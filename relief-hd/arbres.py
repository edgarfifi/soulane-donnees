# Relief HD, phase 4 (plan § 5.2 b) : les ARBRES d'un bloc (tuile z16), une table d'instances, pas un maillage.
#
#   python arbres.py <x16> <y16> <dossier des dalles> <dossier de sortie>
#
# 1. Modèle de hauteur de canopée (MHC) à 0,5 m : point de végétation le plus haut de la case (classes 3, 4, 5) moins le
#    sol (classe 2, interpolé), lissé légèrement (gaussienne σ ≈ 0,5 m).
# 2. Sommets : maxima locaux du MHC dans une fenêtre qui grandit avec la hauteur (couronne ∝ hauteur), au-dessus de 2 m.
# 3. Couronnes : ligne de partage des eaux sur le MHC inversé à partir des sommets, limitée aux cases > 1,5 m et à
#    moins de 0,55 × hauteur du sommet ; rayon = √(surface / π), base de la couronne = 15e centile des hauteurs de la
#    couronne.
# 4. Nature : d'après la forme de la couronne et l'altitude (cf. plus bas) ; buisson sous 3 m.
#    (Limite honnête : sous ~2 m, le LiDAR dit « quelque chose de cette taille », pas quelle plante.)
# 5. Teinte : lue au rendu sur la photo (pas à la fabrication).
#
# Sortie : <sortie>/16_<x>_<y>.arb : en-tête JSON (1 ligne) puis, par arbre, x, y (repère de la tuile z12, m vrais),
# z (altitude du pied), hauteur, rayon (f32 ×5), nature (u8), graine (u8).
import sys, os, json, math, time
import numpy as np, laspy
from laspy.copc import Bounds
from scipy import ndimage
from scipy.interpolate import griddata
from skimage.segmentation import watershed
from pyproj import Transformer

sys.path.insert(0, os.path.dirname(__file__))
from bloc import tile_lonlat, dalle, R_EARTH  # noqa: E402

TO_L93 = Transformer.from_crs(4326, 2154, always_xy=True)
TO_WGS = Transformer.from_crs(2154, 4326, always_xy=True)
CELL = 0.5
MARGE = 15.0


def main():
    x16, y16, dossier, sortie = int(sys.argv[1]), int(sys.argv[2]), sys.argv[3], sys.argv[4]
    T0 = time.time()
    x12, y12 = x16 >> 4, y16 >> 4
    _, lat12a = tile_lonlat(12, x12, y12)
    _, lat12b = tile_lonlat(12, x12 + 1, y12 + 1)
    latc = (lat12a + lat12b) / 2
    k = 2 * math.pi * R_EARTH * math.cos(math.radians(latc))
    mx0 = x12 / 4096
    my0 = y12 / 4096
    corners = [tile_lonlat(16, x16 + i, y16 + j) for i in (0, 1) for j in (0, 1)]
    L = np.array([TO_L93.transform(lo, la) for lo, la in corners])
    ex0, ey0 = L.min(0) - MARGE
    ex1, ey1 = L.max(0) + MARGE
    xs, ys, zs, cs = [], [], [], []
    for X in range(int(ex0 // 1000), int(ex1 // 1000) + 1):
        for Y in range(int(ey0 // 1000) + 1, int(ey1 // 1000) + 2):
            fn = dalle(dossier, X, Y)
            if not fn:
                continue
            with laspy.CopcReader.open(fn) as r:
                p = r.query(Bounds(mins=np.array([ex0, ey0]), maxs=np.array([ex1, ey1])))
            if len(p):
                xs.append(np.asarray(p.x)); ys.append(np.asarray(p.y)); zs.append(np.asarray(p.z)); cs.append(np.asarray(p.classification))
    x = np.concatenate(xs); y = np.concatenate(ys); z = np.concatenate(zs); c = np.concatenate(cs)
    nx = int((ex1 - ex0) / CELL) + 1
    ny = int((ey1 - ey0) / CELL) + 1
    ix = ((x - ex0) / CELL).astype(int).clip(0, nx - 1)
    iy = ((y - ey0) / CELL).astype(int).clip(0, ny - 1)
    # sol : moyenne par case puis interpolation des cases vides
    g = c == 2
    sol = np.full((ny, nx), np.nan)
    acc = np.zeros((ny, nx)); cnt = np.zeros((ny, nx))
    np.add.at(acc, (iy[g], ix[g]), z[g]); np.add.at(cnt, (iy[g], ix[g]), 1)
    ok = cnt > 0
    sol[ok] = acc[ok] / cnt[ok]
    yy, xx = np.nonzero(ok)
    hole = ~ok
    if hole.any():
        sol[hole] = griddata(np.c_[xx, yy][::4], sol[ok][::4], np.c_[np.nonzero(hole)[1], np.nonzero(hole)[0]], method='linear')
        still = np.isnan(sol)
        if still.any():
            sol[still] = griddata(np.c_[xx, yy][::4], sol[ok][::4], np.c_[np.nonzero(still)[1], np.nonzero(still)[0]], method='nearest')
    # MHC : végétation la plus haute de la case moins le sol
    v = (c == 3) | (c == 4) | (c == 5)
    top = np.full((ny, nx), -np.inf)
    np.maximum.at(top, (iy[v], ix[v]), z[v])
    chm = np.where(np.isfinite(top), top - sol, 0.0)
    chm = np.clip(chm, 0, 60)
    chm = ndimage.gaussian_filter(chm, 1.0)
    # sommets : maximum local dans une fenêtre qui suit la hauteur (rayon ~ 0,25 h, borné 1,5 à 4 m)
    seeds = []
    # Fenêtres resserrées (22/11, planche A4) : dans un peuplement serré, des fenêtres plus larges fusionnaient plusieurs
    # épicéas en un seul arbre trop large (forêt clairsemée, « pins » en champignon).
    for hmin, hmax, rad in ((2, 6, 1.0), (6, 14, 1.5), (14, 25, 2.0), (25, 80, 2.6)):
        w = int(round(rad / CELL)) * 2 + 1
        mx = ndimage.maximum_filter(chm, size=w)
        m = (chm == mx) & (chm >= hmin) & (chm < hmax)
        seeds.append(np.argwhere(m))
    seeds = np.concatenate(seeds) if seeds else np.zeros((0, 2), int)
    markers = np.zeros(chm.shape, np.int32)
    for i, (r_, c_) in enumerate(seeds):
        markers[r_, c_] = i + 1
    mask = chm > 1.5
    lab = watershed(-chm, markers, mask=mask)
    # par arbre : surface de la couronne, base
    idx = np.arange(1, len(seeds) + 1)
    area = ndimage.sum_labels(np.ones_like(chm), lab, idx) * CELL * CELL
    trees = []
    for i, (r_, c_) in enumerate(seeds):
        h = float(chm[r_, c_])
        rad = math.sqrt(max(area[i], 0.25) / math.pi)
        rad = min(rad, 0.55 * h + 0.5)
        X = ex0 + (c_ + 0.5) * CELL
        Y = ey0 + (r_ + 0.5) * CELL
        trees.append((X, Y, float(sol[r_, c_]), h, rad))
    T = np.array(trees, np.float64).reshape(-1, 5)
    # repère de la tuile z12 + emprise du bloc
    lon, lat = TO_WGS.transform(T[:, 0], T[:, 1])
    mx = (np.asarray(lon) + 180) / 360
    latr = np.radians(np.asarray(lat))
    my = (1 - np.log(np.tan(latr) + 1 / np.cos(latr)) / math.pi) / 2
    inside = (mx >= x16 / 65536) & (mx < (x16 + 1) / 65536) & (my >= y16 / 65536) & (my < (y16 + 1) / 65536)
    T = T[inside]; mx = mx[inside]; my = my[inside]
    out = np.zeros((len(T), 5), np.float32)
    out[:, 0] = (mx - mx0) * k
    out[:, 1] = (my0 - my) * k
    out[:, 2] = T[:, 2]
    out[:, 3] = T[:, 3]
    out[:, 4] = T[:, 4]
    # Nature (reliefMesh.ts : 0 épicéa / sapin, 1 mélèze, 2 pin cembro / à crochets, 3 feuillu, 4 buisson), d'après la
    # forme mesurée (rayon de couronne / hauteur) et l'altitude : à Courchevel, presque tout est conifère au-dessus de
    # 1 400 m (épicéa et sapin étroits, mélèze plus large, cembro rond et trapu vers la limite de la forêt) ; feuillus en
    # bas de vallée. Quand rien ne tranche : épicéa. (À affiner avec la BD Forêt V2 de l'IGN, essence par parcelle.)
    ratio = out[:, 4] / np.maximum(out[:, 3], 0.1)
    alt = out[:, 2]
    nature = np.zeros(len(out), np.uint8)
    nature[(ratio >= 0.22) & (alt >= 1450)] = 1
    nature[(ratio >= 0.42) & (alt >= 1750)] = 2
    nature[(ratio >= 0.3) & (alt < 1450)] = 3
    nature[out[:, 3] < 3] = 4
    rng = np.random.default_rng(x16 * 100003 + y16)
    graine = rng.integers(0, 256, len(T), dtype=np.uint8)
    head = {'z': 16, 'x': x16, 'y': y16, 'arbres': int(len(T)), 'epiceas': int((nature == 0).sum()), 'meleze': int((nature == 1).sum()),
            'pins': int((nature == 2).sum()), 'feuillus': int((nature == 3).sum()), 'buissons': int((nature == 4).sum()),
            'hauteur_mediane': round(float(np.median(out[:, 3])) if len(T) else 0, 1),
            'secondes': round(time.time() - T0, 1)}
    os.makedirs(sortie, exist_ok=True)
    with open(os.path.join(sortie, f'16_{x16}_{y16}.arb'), 'wb') as f:
        f.write((json.dumps(head) + '\n').encode())
        f.write(out.tobytes()); f.write(nature.tobytes()); f.write(graine.tobytes())
    print(json.dumps(head), flush=True)


if __name__ == '__main__':
    main()
