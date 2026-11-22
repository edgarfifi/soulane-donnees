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
# 4 bis. Écartés (22/11/2026, Edgar : « une rangée de sapins au niveau du câble du téléphérique », « des petits sapins dans
#    des creux ») : une couronne SUSPENDUE (presque aucun écho de végétation au milieu de sa hauteur : câbles, fils, rangés
#    « haute végétation » par le classement de l'IGN) et une couronne à UN SEUL ÉCHO (moins d'un quart de ses points sont des
#    échos multiples : une surface pleine, rocher ou toit, pas un feuillage que le laser traverse).
# 4 ter. Écartée aussi (22/11/2026, Edgar : « des sapins dans des endroits incohérents, dans la montagne », Aiguille du
#    Fruit) : une couronne qui n'est PAS VÉGÉTALE sur la photo infrarouge de l'IGN (ORTHOIMAGERY.ORTHOPHOTOS.IRC, Licence
#    Ouverte : la végétation y est rouge, la roche, la neige et le bâti cyan ou gris). Indice (PIR − rouge) / (PIR + rouge)
#    moyen sur le cœur de la couronne, sous SEUIL_IRC, ET couronne CLAIRE (luminosité > LUM_IRC sur 255 : dans l'ombre
#    profonde d'une forêt dense, l'infrarouge ne se lit plus, l'indice y est faux ; premier essai du 22/11 : 16 % d'une
#    forêt écartés à tort). Mesuré : sous l'Aiguille du Fruit, 29 « arbres » sur 36 écartés (roche claire, médiane 165) ;
#    forêt dense et sombre du bloc 33958/23464, 41 sur 2 729 (436 sans la condition). Photo indisponible : gardé.
# 4 quater. Écartés enfin (22/11 au soir) : les PETITS câbles (moins de 8 échos, tous dans le quart du haut), une couronne
#    à moins de 35 % d'échos multiples (dès 8 échos), et un sommet sur une PAROI (sol de plus de 50°). Bloc d'une paroi sous
#    l'Aiguille du Fruit : 29 → 0 ; bloc des remontées de la Saulire : 64 → 4 ; forêt dense : 3 430 → 3 416.
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
SEUIL_IRC = -0.15
PENTE_MAX = 50.0
LUM_IRC = 70.0
Z_IRC = 18  # (~0,42 m par pixel à Courchevel)


def indice_vegetation(mx, my, rayon_m, k, dossier):
    """(PIR − rouge) / (PIR + rouge) de la photo infrarouge de l'IGN sur le cœur de chaque couronne (mercator 0..1) ;
    NaN là où la photo manque. Tuiles gardées dans <dossier>/irc (partagées entre les blocs)."""
    import io, urllib.request
    from PIL import Image
    os.makedirs(os.path.join(dossier, 'irc'), exist_ok=True)
    n = 256 * 2 ** Z_IRC
    px = np.asarray(mx) * n
    py = np.asarray(my) * n
    mpp = k / n
    tuiles = {}

    def tuile(c, r):
        if (c, r) in tuiles:
            return tuiles[(c, r)]
        fn = os.path.join(dossier, 'irc', f'{Z_IRC}_{c}_{r}.jpg')
        im = None
        for essai in range(3):
            try:
                if not os.path.exists(fn):
                    u = ('https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=ORTHOIMAGERY.ORTHOPHOTOS.IRC'
                         f'&STYLE=normal&TILEMATRIXSET=PM&TILEMATRIX={Z_IRC}&TILEROW={r}&TILECOL={c}&FORMAT=image/jpeg')
                    data = urllib.request.urlopen(urllib.request.Request(u, headers={'User-Agent': 'Mozilla/5.0 (relief-hd)'}), timeout=30).read()
                    tmp = fn + f'.{os.getpid()}.part'
                    open(tmp, 'wb').write(data)
                    os.replace(tmp, fn)
                im = np.asarray(Image.open(fn).convert('RGB'), np.float32)
                break
            except Exception:
                time.sleep(2 + 3 * essai)
        tuiles[(c, r)] = im
        return im

    out = np.full(len(px), np.nan)
    lum = np.full(len(px), np.nan)
    for i in range(len(px)):
        rr = max(1, int(round(0.6 * float(rayon_m[i]) / mpp)))
        vals = []
        for yy in range(int(py[i]) - rr, int(py[i]) + rr + 1):
            for xx in range(int(px[i]) - rr, int(px[i]) + rr + 1):
                if (xx - px[i]) ** 2 + (yy - py[i]) ** 2 > rr * rr:
                    continue
                t = tuile(xx // 256, yy // 256)
                if t is not None:
                    vals.append(t[yy % 256, xx % 256])
        if vals:
            v = np.mean(vals, 0)
            out[i] = (v[0] - v[1]) / max(v[0] + v[1], 1.0)  # (photo IRC : rouge = PIR, vert = rouge)
            lum[i] = float(v.mean())
    return out, lum


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
    xs, ys, zs, cs, ms = [], [], [], [], []
    illisibles = []
    for X in range(int(ex0 // 1000), int(ex1 // 1000) + 1):
        for Y in range(int(ey0 // 1000) + 1, int(ey1 // 1000) + 2):
            fn = dalle(dossier, X, Y)
            if not fn:
                continue
            # Lue par 4 × 4 carrés (22/11/2026) : la dalle 0977_6486 de l'IGN a un morceau illisible (« failed to fill whole
            # buffer », fichier complet pourtant) ; une seule lecture d'un coup faisait échouer les arbres de 4 tuiles entières.
            # Un carré illisible est sauté (ses arbres manquent), les autres sont gardés.
            qx = np.linspace(ex0, ex1, 5); qy = np.linspace(ey0, ey1, 5)
            with laspy.CopcReader.open(fn) as r:
                for a_ in range(4):
                    for b_ in range(4):
                        # (bornes demi-ouvertes : un point au bord n'est lu qu'une fois)
                        x0_, x1_, y0_, y1_ = qx[a_], qx[a_ + 1], qy[b_], qy[b_ + 1]
                        try:
                            p = r.query(Bounds(mins=np.array([x0_, y0_]), maxs=np.array([x1_, y1_])))
                        except Exception as e:
                            illisibles.append(f'{X}_{Y}:{a_}{b_}')
                            continue
                        if not len(p):
                            continue
                        px_ = np.asarray(p.x); py_ = np.asarray(p.y)
                        m_ = (px_ >= x0_) & (py_ >= y0_) & ((px_ < x1_) | (a_ == 3)) & ((py_ < y1_) | (b_ == 3))
                        xs.append(px_[m_]); ys.append(py_[m_]); zs.append(np.asarray(p.z)[m_]); cs.append(np.asarray(p.classification)[m_])
                        ms.append((np.asarray(p.number_of_returns) > 1)[m_])
    x = np.concatenate(xs); y = np.concatenate(ys); z = np.concatenate(zs); c = np.concatenate(cs); multi = np.concatenate(ms)
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
    # échos de végétation de chaque couronne (au-dessus de 1,5 m) : combien, dont multiples, dont dans la moitié basse
    hs = np.r_[0.0, chm[seeds[:, 0], seeds[:, 1]]] if len(seeds) else np.zeros(1)
    hag = z - sol[iy, ix]
    vv = v & (hag > 1.5)
    L = lab[iy[vv], ix[vv]]
    nb = np.bincount(L, minlength=len(seeds) + 1)
    nbm = np.bincount(L, weights=multi[vv], minlength=len(seeds) + 1)
    # (milieu de la couronne : de 0,35 à 0,75 × la hauteur ; sous un câble à 37 m, les arbres de 5 m n'y sont pas)
    hl = hag[vv] / np.maximum(hs[L], 0.1)
    nmil = np.bincount(L, weights=(hl > 0.35) & (hl < 0.75), minlength=len(seeds) + 1)
    nbas = np.bincount(L, weights=hl < 0.75, minlength=len(seeds) + 1)
    # pente du sol (degrés) sous chaque case, sur le sol lissé (~2 m)
    solL = ndimage.gaussian_filter(sol, 4.0)
    gy_, gx_ = np.gradient(solL, CELL)
    pente = np.degrees(np.arctan(np.hypot(gx_, gy_)))
    dbg = []  # (ARBRES_DEBUG=1 : chaque sommet, ses mesures et sa décision, dans 16_x_y.debug.npy)
    suspendus = 0
    paroi = 0
    un_echo = 0
    ecartes = []  # (contrôle : ARBRES_ECARTES=1 les écrit à côté, en Lambert 93)
    trees = []
    for i, (r_, c_) in enumerate(seeds):
        h = float(chm[r_, c_])
        dbg.append((ex0 + (c_ + 0.5) * CELL, ey0 + (r_ + 0.5) * CELL, h, nb[i + 1], nbm[i + 1], nmil[i + 1], nbas[i + 1], pente[r_, c_]))
        # (suspendu aussi : un PETIT câble, téléski — moins de 8 échos, tous dans le quart du haut ; 22/11 au soir, Edgar :
        # « toujours des sapins aux endroits à câbles »)
        if (h >= 4 and nb[i + 1] >= 8 and nmil[i + 1] < max(3, 0.03 * nb[i + 1])) or (h >= 3 and nb[i + 1] < 8 and nbas[i + 1] == 0):
            suspendus += 1
            ecartes.append(('suspendu', ex0 + (c_ + 0.5) * CELL, ey0 + (r_ + 0.5) * CELL, h, int(nb[i + 1])))
            continue
        if nb[i + 1] >= 8 and nbm[i + 1] < 0.35 * nb[i + 1]:
            un_echo += 1
            ecartes.append(('un_echo', ex0 + (c_ + 0.5) * CELL, ey0 + (r_ + 0.5) * CELL, h, float(nbm[i + 1] / nb[i + 1])))
            continue
        # PAROI (22/11 au soir, Edgar : « toujours des arbres sur les parois, ça n'a aucun sens ») : sol de plus de 50° sous le
        # sommet. Mesuré : sapins d'une paroi sous l'Aiguille du Fruit, pente médiane 76° ; forêt dense, 99 % sous 41°.
        if pente[r_, c_] > PENTE_MAX:
            paroi += 1
            ecartes.append(('paroi', ex0 + (c_ + 0.5) * CELL, ey0 + (r_ + 0.5) * CELL, h, float(pente[r_, c_])))
            continue
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
    # 4 ter. couronne non végétale sur la photo infrarouge : écartée (photo indisponible : gardée)
    roche = 0
    irc_manque = 0
    if len(out) and not os.environ.get('ARBRES_SANS_IRC'):
        nd, lum = indice_vegetation(mx, my, out[:, 4], k, dossier)
        irc_manque = int(np.isnan(nd).sum())
        pas_vert = (nd < SEUIL_IRC) & (lum > LUM_IRC)
        roche = int(pas_vert.sum())
        out = out[~pas_vert]; T = T[~pas_vert]
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
            'ecartes_suspendus': suspendus, 'ecartes_un_echo': un_echo, 'ecartes_paroi': paroi, 'ecartes_infrarouge': roche, 'infrarouge_manquant': irc_manque, 'carres_illisibles': illisibles,
            'hauteur_mediane': round(float(np.median(out[:, 3])) if len(T) else 0, 1),
            'secondes': round(time.time() - T0, 1)}
    os.makedirs(sortie, exist_ok=True)
    if os.environ.get('ARBRES_DEBUG'):
        np.save(os.path.join(sortie, f'16_{x16}_{y16}.debug.npy'), np.array(dbg, np.float64))
    with open(os.path.join(sortie, f'16_{x16}_{y16}.arb'), 'wb') as f:
        f.write((json.dumps(head) + '\n').encode())
        f.write(out.tobytes()); f.write(nature.tobytes()); f.write(graine.tobytes())
    if os.environ.get('ARBRES_ECARTES'):
        with open(os.path.join(sortie, f'16_{x16}_{y16}.ecartes.json'), 'w') as f:
            json.dump(ecartes, f)
    print(json.dumps(head), flush=True)


if __name__ == '__main__':
    main()
