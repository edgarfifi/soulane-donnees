# Relief HD, phase 4 (plan § 5.2 b) : les ARBRES d'un bloc (tuile z16), une table d'instances, pas un maillage.
#
#   python arbres.py <x16> <y16> <dossier des dalles> <dossier de sortie>
#
# 1. Modèle de hauteur de canopée (MHC) à 0,5 m : point de végétation le plus haut de la case (classes 3, 4, 5) moins le
#    sol (classe 2, interpolé), lissé légèrement (gaussienne σ ≈ 0,5 m).
# 2. Sommets : maxima locaux du MHC dans une fenêtre qui grandit avec la hauteur (couronne ∝ hauteur), au-dessus de 2 m.
#    Hauteur de l'arbre : écho le plus haut de sa couronne (MHC brut), cf. 26/11/2026 plus bas.
# 3. Couronnes : ligne de partage des eaux sur le MHC inversé à partir des sommets, limitée aux cases > 1,5 m et à
#    moins de 0,55 × hauteur du sommet ; rayon = √(surface / π), base de la couronne = 15e centile des hauteurs de la
#    couronne.
# 4. Nature : d'après la BD Forêt, l'infrarouge, la forme de la couronne et l'altitude (cf. plus bas) ; buisson sous 3 m.
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
# 4 quinquies (23/11/2026, chantier 5 d'Edgar : « les pylônes pris pour des sapins ») : PYLÔNE = sommet de 8 m ou plus
#    dont presque tous les échos sont en haut (moins de 20 % au milieu de la hauteur, moins de 40 % sous les trois quarts).
# 4 sexies (23/11/2026) : ESSENCE d'après la BD Forêt V2 de l'IGN (Licence Ouverte ; type de peuplement de chaque parcelle :
#    « sapin ou épicéa », « mélèze pur », « pin à crochets ou cembro pur », conifères en îlots, landes…), la forme de la
#    couronne ne départageant plus qu'à l'intérieur d'un peuplement mélangé. Avant, la forme seule rangeait en mélèzes
#    beaucoup d'épicéas larges : avec les mélèzes nus de novembre, la forêt paraissait à moitié morte.
# 26/11/2026 (retour d'Edgar du 25/11 : « un petit arbre au milieu d'une piste », « parfois ça manque de densité » ; mesures
# et fiches dans relief-hd/arbres-26-11.md) :
# - HAUTEUR = écho de végétation le plus haut de la couronne (MHC brut), plus le sommet lissé (≈ 1 m trop bas) ;
# - 4 octies : POINTE écartée (perches et canons à neige, poteaux, cheminées : le lissage n'en garde qu'un pic bas) ;
# - 4 ter revu : infrarouge lu en tenant compte du DÉVERS de la photo (de vrais épicéas de 20 m étaient écartés parce
#   que la photo montrait, à leur place mesurée, le toit ou la route d'à côté) ;
# - 4 septies : couronne à un seul écho GARDÉE si nettement végétale sur l'infrarouge (fourrés d'aulnes verts) ;
# - 4 nonies : profil de pylône écarté seulement près d'une remontée ou d'une ligne électrique (les pins ont ce profil) ;
# - 4 decies : mélèze d'après l'infrarouge (relatif aux épicéas purs du bloc), plus d'après la largeur de la couronne.
# 5. Teinte : lue au rendu sur la photo (pas à la fabrication).
#
# Sortie : <sortie>/16_<x>_<y>.arb : en-tête JSON (1 ligne) puis, par arbre, x, y (repère de la tuile z12, m vrais),
# z (altitude du pied), hauteur, rayon (f32 ×5), nature (u8), graine (u8). (Format inchangé le 26/11/2026 ; l'en-tête JSON a
# des compteurs en plus, que paquet-build.mjs ne lit pas.)
import sys, os, json, math, time
import numpy as np, laspy
from laspy.copc import Bounds
from scipy import ndimage
from scipy.interpolate import griddata
from skimage.segmentation import watershed
from pyproj import Transformer

sys.path.insert(0, os.path.dirname(__file__))
from bloc import tile_lonlat, dalle, requete, R_EARTH  # noqa: E402

TO_L93 = Transformer.from_crs(4326, 2154, always_xy=True)
TO_WGS = Transformer.from_crs(2154, 4326, always_xy=True)
CELL = 0.5
MARGE = 15.0
SEUIL_IRC = -0.15
PENTE_MAX = 50.0
LUM_IRC = 70.0
Z_IRC = 18  # (~0,42 m par pixel à Courchevel)
PYLONE_MIL = 0.2
PYLONE_BAS = 0.4
DEVERS_IRC = 0.4  # dévers de la photo : cime cherchée jusqu'à 0,4 × la hauteur de l'arbre (cf. indice_vegetation)
# POINTE (26/11/2026) : sommet lissé / écho le plus haut. Un houppier garde ~0,75 à 0,95 de sa hauteur au lissage ; une
# perche ou un canon à neige, un poteau, une cheminée (quelques échos en ligne) en garde moins de la moitié.
POINTE_Q = 0.5
POINTE_Q2, POINTE_LARGEUR = 0.65, 0.2  # (entre 0,5 et 0,65 : objet fin aussi si ses échos tiennent dans 0,2 m d'écart-type)
# Buissons denses (aulnes verts…) : « un seul écho » mais nettement végétaux sur l'infrarouge (conifères ~0, roche et
# toits −0,1 à −0,35).
FEUILLAGE_IRC = 0.03
MELEZE_IRC = 0.05  # (cf. 4 decies)
OMBRE_MAX = 100.0  # luminosité (sur 255, photo infrarouge) le long de l'ombre prévue au-delà de laquelle l'arbre n'a pas d'ombre
PYLONE_LIGNE = 30.0  # m : un profil de pylône n'est écarté qu'à cette distance d'une remontée ou d'une ligne électrique


def bd_foret(x14, y14, dossier):
    """Peuplements de la BD Forêt V2 (IGN) sur la tuile z14 (et 60 m autour) : liste de (code_tfv, anneaux en Lambert 93).
    Gardés dans <dossier>/bdforet (partagés entre les blocs de la tuile). [] si le service ne répond pas."""
    import urllib.request
    os.makedirs(os.path.join(dossier, 'bdforet'), exist_ok=True)
    fn = os.path.join(dossier, 'bdforet', f'14_{x14}_{y14}.json')
    if not os.path.exists(fn):
        c = [tile_lonlat(14, x14 + i, y14 + j) for i in (0, 1) for j in (0, 1)]
        L = np.array([TO_L93.transform(lo, la) for lo, la in c])
        (a, b), (cx, dy) = L.min(0) - 60, L.max(0) + 60
        u = ('https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature'
             '&TYPENAMES=LANDCOVER.FORESTINVENTORY.V2:formation_vegetale&OUTPUTFORMAT=application/json&COUNT=5000'
             '&SRSNAME=urn:ogc:def:crs:EPSG::2154'
             f'&BBOX={a},{b},{cx},{dy},urn:ogc:def:crs:EPSG::2154')
        data = None
        for essai in range(3):
            try:
                data = urllib.request.urlopen(urllib.request.Request(u, headers={'User-Agent': 'Mozilla/5.0 (relief-hd)'}), timeout=60).read()
                json.loads(data)
                break
            except Exception:
                data = None
                time.sleep(3 + 5 * essai)
        if data is None:
            return []
        tmp = fn + f'.{os.getpid()}.part'
        open(tmp, 'wb').write(data)
        os.replace(tmp, fn)
    out = []
    for f in json.load(open(fn, encoding='utf-8')).get('features', []):
        g = f.get('geometry') or {}
        polys = [g['coordinates']] if g.get('type') == 'Polygon' else g.get('coordinates', []) if g.get('type') == 'MultiPolygon' else []
        rings = [np.asarray(r, np.float64)[:, :2] for poly in polys for r in poly]
        out.append((f['properties'].get('code_tfv') or '', rings))
    return out


CABLE_COULOIR = 5.0  # m de part et d'autre de l'axe d'une remontée : couloir dégagé (aucun arbre)


def lignes_bdtopo(couche, x14, y14, dossier, marge=400):
    """Lignes d'une couche de la BD TOPO (IGN, WFS de la Géoplateforme) sur la tuile z14 et `marge` m autour : liste de
    tableaux (n, 2) en Lambert 93, gardée dans <dossier>/<dossier de la couche>. None si le service ne répond pas."""
    import urllib.request
    sous = {'transport_par_cable': 'cables', 'ligne_electrique': 'lignes_electriques'}[couche]
    os.makedirs(os.path.join(dossier, sous), exist_ok=True)
    fn = os.path.join(dossier, sous, f'14_{x14}_{y14}.json')
    if not os.path.exists(fn):
        c = [tile_lonlat(14, x14 + i, y14 + j) for i in (0, 1) for j in (0, 1)]
        L = np.array([TO_L93.transform(lo, la) for lo, la in c])
        (a, b), (cx, dy) = L.min(0) - marge, L.max(0) + marge
        u = ('https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature'
             f'&TYPENAMES=BDTOPO_V3:{couche}&OUTPUTFORMAT=application/json&COUNT=5000'
             '&SRSNAME=urn:ogc:def:crs:EPSG::2154'
             f'&BBOX={a},{b},{cx},{dy},urn:ogc:def:crs:EPSG::2154')
        data = None
        for essai in range(3):
            try:
                data = urllib.request.urlopen(urllib.request.Request(u, headers={'User-Agent': 'Mozilla/5.0 (relief-hd)'}), timeout=60).read()
                json.loads(data)
                break
            except Exception:
                data = None
                time.sleep(3 + 5 * essai)
        if data is None:
            return None
        tmp = fn + f'.{os.getpid()}.part'
        open(tmp, 'wb').write(data)
        os.replace(tmp, fn)
    out = []
    for f in json.load(open(fn, encoding='utf-8')).get('features', []):
        g = f.get('geometry') or {}
        ls = [g['coordinates']] if g.get('type') == 'LineString' else g.get('coordinates', []) if g.get('type') == 'MultiLineString' else []
        out += [np.asarray(l, np.float64)[:, :2] for l in ls if len(l) >= 2]
    return out


def cables(x14, y14, dossier):
    """Axes des remontées mécaniques de la BD TOPO (IGN, transport_par_cable) sur la tuile z14 et 400 m autour : liste de
    tableaux (n, 2) en Lambert 93. Gardés dans <dossier>/cables. [] si le service ne répond pas.
    (23/11/2026 au soir, Edgar : « en dessous des remontées mécaniques… de la végétation incohérente ») : les échos des
    câbles, des cabines et des sièges passaient encore pour des arbres là où le profil des échos ne tranche pas ; sous une
    remontée, le couloir est dégagé en vrai : rien n'y est gardé."""
    return lignes_bdtopo('transport_par_cable', x14, y14, dossier) or []


def pres_cable(X, Y, lignes, d=CABLE_COULOIR):
    """Points (Lambert 93) à moins de d m de l'axe d'une remontée."""
    m = np.zeros(len(X), bool)
    for l in lignes:
        for (ax, ay), (bx, by) in zip(l[:-1], l[1:]):
            vx, vy = bx - ax, by - ay
            L2 = vx * vx + vy * vy
            if L2 < 1e-6:
                continue
            if X.min() > max(ax, bx) + d or X.max() < min(ax, bx) - d or Y.min() > max(ay, by) + d or Y.max() < min(ay, by) - d:
                continue
            t = np.clip(((X - ax) * vx + (Y - ay) * vy) / L2, 0, 1)
            m |= (X - ax - t * vx) ** 2 + (Y - ay - t * vy) ** 2 < d * d
    return m


def peuplement(X, Y, parcelles):
    """Code du peuplement (BD Forêt) sous chaque point (Lambert 93) : '' hors parcelle. Règle pair-impair sur tous les
    anneaux d'une parcelle (les trous comptent)."""
    code = np.array([''] * len(X), dtype=object)
    for c, rings in parcelles:
        inside = np.zeros(len(X), bool)
        for r in rings:
            x0, y0 = r[:-1, 0], r[:-1, 1]
            x1, y1 = r[1:, 0], r[1:, 1]
            for k in range(len(x0)):
                cond = (y0[k] > Y) != (y1[k] > Y)
                if not cond.any():
                    continue
                xi = x0[k] + (Y - y0[k]) * (x1[k] - x0[k]) / ((y1[k] - y0[k]) or 1e-12)
                inside ^= cond & (X < xi)
        code[inside & (code == '')] = c
    return code


def indice_vegetation(mx, my, rayon_m, h, k, dossier):
    """Photo infrarouge de l'IGN autour de chaque couronne (mercator 0..1), indice (PIR − rouge) / (PIR + rouge) :
    - `coeur`, `lum` : moyennes sur le CŒUR de la couronne (0,6 × rayon), comme avant ;
    - `proche` : l'indice le plus VÉGÉTAL (lissé sur 3 × 3 pixels, ~1,3 m) parmi les pixels ÉCLAIRÉS (luminosité > LUM_IRC)
      à portée du DÉVERS de la photo : 0,6 × rayon + DEVERS_IRC × hauteur ;
    - `ombre` : luminosité moyenne de la photo le long de l'OMBRE prévue de l'arbre (de 0,2 à 0,55 × sa hauteur, côté
      opposé au soleil ; direction du soleil cherchée sur le bloc : celle qui assombrit le plus le pied des arbres de 10 m
      et plus). Un arbre debout sur la photo y a son ombre et son côté à l'ombre ; un arbre abattu depuis le vol LiDAR
      (chantiers du village), une grue, un bord de toit n'en ont pas.
    NaN là où la photo manque (ou, pour `proche`, sans pixel éclairé ; pour `ombre`, moins de 20 arbres de 10 m).
    Tuiles gardées dans <dossier>/irc (partagées).

    Dévers (26/11/2026) : la photo de l'IGN n'est pas une « vraie ortho » ; la cime d'un arbre y est déplacée en
    s'éloignant du point visé par l'avion, de ~0,2 à 0,4 × sa hauteur (5 à 8 m pour un épicéa de 20 m). Lue à la place
    mesurée par le LiDAR, la photo montrait souvent le toit, la route ou l'ombre d'à côté : à Courchevel 1850 (bloc
    33975/23468), 120 arbres écartés par l'infrarouge, dont ~87 vrais épicéas de 13 à 24 m (fiches de arbres-26-11.md)."""
    import urllib.request
    from PIL import Image
    os.makedirs(os.path.join(dossier, 'irc'), exist_ok=True)
    n = 256 * 2 ** Z_IRC
    mpp = k / n
    px = np.asarray(mx) * n
    py = np.asarray(my) * n
    rc = np.maximum(1.0, 0.6 * np.asarray(rayon_m, np.float64) / mpp)
    rs = rc + DEVERS_IRC * np.asarray(h, np.float64) / mpp
    m = float(rs.max()) + 4 if len(rs) else 4
    c0, c1 = int((px.min() - m) // 256), int((px.max() + m) // 256)
    r0, r1 = int((py.min() - m) // 256), int((py.max() + m) // 256)
    im = np.full(((r1 - r0 + 1) * 256, (c1 - c0 + 1) * 256, 3), np.nan, np.float32)
    for c in range(c0, c1 + 1):
        for r in range(r0, r1 + 1):
            fn = os.path.join(dossier, 'irc', f'{Z_IRC}_{c}_{r}.jpg')
            for essai in range(3):
                try:
                    if not os.path.exists(fn):
                        u = ('https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=ORTHOIMAGERY.ORTHOPHOTOS.IRC'
                             f'&STYLE=normal&TILEMATRIXSET=PM&TILEMATRIX={Z_IRC}&TILEROW={r}&TILECOL={c}&FORMAT=image/jpeg')
                        data = urllib.request.urlopen(urllib.request.Request(u, headers={'User-Agent': 'Mozilla/5.0 (relief-hd)'}), timeout=30).read()
                        tmp = fn + f'.{os.getpid()}.part'
                        open(tmp, 'wb').write(data)
                        os.replace(tmp, fn)
                    im[(r - r0) * 256:(r - r0 + 1) * 256, (c - c0) * 256:(c - c0 + 1) * 256] = np.asarray(Image.open(fn).convert('RGB'), np.float32)
                    break
                except Exception:
                    time.sleep(2 + 3 * essai)
    px -= c0 * 256
    py -= r0 * 256
    ok = np.isfinite(im[..., 0])
    nir, red = np.where(ok, im[..., 0], 0), np.where(ok, im[..., 1], 0)  # (photo IRC : rouge = PIR, vert = rouge)
    ind = (nir - red) / np.maximum(nir + red, 1.0)
    lumi = np.where(ok, im.mean(-1), 0)
    w = np.maximum(ndimage.uniform_filter(ok.astype(np.float32), 3), 1e-6)
    ind_l = ndimage.uniform_filter(ind * ok, 3) / w
    lum_l = ndimage.uniform_filter(lumi * ok, 3) / w
    H, W = ind.shape
    coeur = np.full(len(px), np.nan)
    lum = np.full(len(px), np.nan)
    proche = np.full(len(px), np.nan)
    for i in range(len(px)):
        a0, a1 = int(max(0, px[i] - rs[i])), int(min(W, px[i] + rs[i] + 1))
        b0, b1 = int(max(0, py[i] - rs[i])), int(min(H, py[i] + rs[i] + 1))
        if a1 <= a0 or b1 <= b0:
            continue
        yy, xx = np.mgrid[b0:b1, a0:a1]
        d2 = (xx + 0.5 - px[i]) ** 2 + (yy + 0.5 - py[i]) ** 2
        okw = ok[b0:b1, a0:a1]
        mc = (d2 <= rc[i] * rc[i]) & okw
        if mc.any():
            coeur[i] = float(ind[b0:b1, a0:a1][mc].mean())
            lum[i] = float(lumi[b0:b1, a0:a1][mc].mean())
        ms = (d2 <= rs[i] * rs[i]) & okw & (lum_l[b0:b1, a0:a1] > LUM_IRC)
        if ms.any():
            proche[i] = float(ind_l[b0:b1, a0:a1][ms].max())
    # ombre portée (cf. plus haut)
    ombre = np.full(len(px), np.nan)
    grands = np.nonzero(np.asarray(h) >= 10)[0]
    if len(grands) >= 20:
        grands = grands[np.linspace(0, len(grands) - 1, min(400, len(grands))).astype(int)]

        def le_long(ii, s, nb):
            v = np.zeros(len(ii)); c = np.zeros(len(ii))
            for t in np.linspace(0.2 / 0.6, 0.55 / 0.6, nb):
                u = (px[ii] + t * h[ii] * s[0] / mpp).astype(int); w_ = (py[ii] + t * h[ii] * s[1] / mpp).astype(int)
                ok_ = (u >= 0) & (u < W) & (w_ >= 0) & (w_ < H)
                v[ok_] += lumi[w_[ok_], u[ok_]]; c[ok_] += ok[w_[ok_], u[ok_]]
            return np.where(c > 0, v / np.maximum(c, 1), np.nan)
        h = np.asarray(h, np.float64)
        meilleur = None
        for az in range(0, 360, 5):
            a = math.radians(az)
            s = (0.6 * math.sin(a), -0.6 * math.cos(a))
            m_ = float(np.nanmean(le_long(grands, s, 5)))
            if meilleur is None or m_ < meilleur[0]:
                meilleur = (m_, s)
        ombre = le_long(np.arange(len(px)), meilleur[1], 8)
    return coeur, lum, proche, ombre


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
            # Un carré illisible est relu morceau par morceau (24/11/2026, `requete` de bloc.py : seuls les morceaux de
            # l'octree illisibles sont sautés ; avant, le carré entier, et le bloc 33960/23468 n'avait plus d'arbres).
            qx = np.linspace(ex0, ex1, 5); qy = np.linspace(ey0, ey1, 5)
            with laspy.CopcReader.open(fn) as r:
                for a_ in range(4):
                    for b_ in range(4):
                        # (bornes demi-ouvertes : un point au bord n'est lu qu'une fois)
                        x0_, x1_, y0_, y1_ = qx[a_], qx[a_ + 1], qy[b_], qy[b_ + 1]
                        p, sautes = requete(r, Bounds(mins=np.array([x0_, y0_]), maxs=np.array([x1_, y1_])))
                        if sautes:
                            illisibles.append(f'{X}_{Y}:{a_}{b_}:{sautes}')
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
    chm0 = np.clip(np.where(np.isfinite(top), top - sol, 0.0), 0, 60)  # (brut : hauteur des arbres, cf. plus bas)
    chm = ndimage.gaussian_filter(chm0, 1.0)
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
    # HAUTEUR MESURÉE (26/11/2026) : l'écho de végétation le plus haut de la couronne à moins de 1,5 m du sommet (MHC brut),
    # et non plus le sommet du MHC lissé, qui rabotait la cime de ~1 m à toutes les tailles (médiane mesurée sur 8 blocs
    # de Courchevel : 0,9 m sous 4 m, 1,0 m de 6 à 20 m, 1,05 m au-delà ; un épicéa de 3 m était rendu à 2,1 m).
    hbrut = np.zeros(len(seeds) + 1)
    for i, (r_, c_) in enumerate(seeds):
        a0, b0 = max(0, r_ - 3), max(0, c_ - 3)
        w_ = lab[a0:r_ + 4, b0:c_ + 4] == i + 1
        hbrut[i + 1] = max(float(chm0[a0:r_ + 4, b0:c_ + 4][w_].max()) if w_.any() else 0.0, float(chm[r_, c_]))
    # largeur des échos hauts autour d'un sommet (règle POINTE) : écart-type selon le petit axe, échos de végétation à plus
    # de 1,5 m du sol et à moins de 1,5 m du sommet
    from scipy.spatial import cKDTree
    kd_v = cKDTree(np.c_[x[vv], y[vv]]) if vv.any() else None

    def largeur(X_, Y_):
        if kd_v is None:
            return 0.0
        j = kd_v.query_ball_point((X_, Y_), 1.5)
        if len(j) < 3:
            return 0.0
        P = np.c_[x[vv][j], y[vv][j]]
        return float(np.sqrt(max(np.linalg.eigvalsh(np.cov((P - P.mean(0)).T))[0], 0.0)))
    # pente du sol (degrés) sous chaque case, sur le sol lissé (~2 m)
    solL = ndimage.gaussian_filter(sol, 4.0)
    gy_, gx_ = np.gradient(solL, CELL)
    pente = np.degrees(np.arctan(np.hypot(gx_, gy_)))
    dbg = []  # (ARBRES_DEBUG=1 : chaque sommet, ses mesures et sa décision, dans 16_x_y.debug.npy)
    suspendus = 0
    paroi = 0
    pylones = 0
    un_echo = 0
    pointes = 0
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
        # (UN SEUL ÉCHO : jugé plus bas sur l'infrarouge, cf. 4 septies ; écarté s'il n'y est pas nettement végétal)
        seul = nb[i + 1] >= 8 and nbm[i + 1] < 0.35 * nb[i + 1]
        # PAROI (22/11 au soir, Edgar : « toujours des arbres sur les parois, ça n'a aucun sens ») : sol de plus de 50° sous le
        # sommet. Mesuré : sapins d'une paroi sous l'Aiguille du Fruit, pente médiane 76° ; forêt dense, 99 % sous 41°.
        if pente[r_, c_] > PENTE_MAX:
            paroi += 1
            ecartes.append(('paroi', ex0 + (c_ + 0.5) * CELL, ey0 + (r_ + 0.5) * CELL, h, float(pente[r_, c_])))
            continue
        # PYLÔNE (4 quinquies) : presque tous ses points en haut (traverse, poulies), un mât maigre dessous. Mesuré le 23/11
        # sur 3 blocs des remontées (pylônes d'OpenStreetMap pour la vérification seulement) : part des points au milieu de
        # la hauteur 3 à 14 % (arbres 43 à 59 %), sous les trois quarts 10 à 28 % (arbres plus de 65 %) ; 13 pylônes sur 13
        # écartés, aucun des 2 185 arbres. (Règle de forme essayée d'abord : 56 à 78 vrais arbres écartés en forêt dense.)
        # (26/11/2026 : candidat seulement, tranché plus bas près d'une remontée ou d'une ligne électrique, cf. 4 nonies)
        pyl = h >= 8 and nb[i + 1] >= 30 and nmil[i + 1] < PYLONE_MIL * nb[i + 1] and nbas[i + 1] < PYLONE_BAS * nb[i + 1]
        X = ex0 + (c_ + 0.5) * CELL
        Y = ey0 + (r_ + 0.5) * CELL
        # POINTE (4 octies, 26/11/2026, Edgar : « un petit arbre au milieu d'une piste ») : perches et canons à neige,
        # poteaux, cheminées. Quelques échos en ligne : le MHC lissé n'en garde qu'un pic bas (moins de la moitié de l'écho
        # le plus haut ; houppiers : 0,75 à 0,95). Sur 8 blocs de Courchevel, 60 « arbres » sous 0,6 : presque tous des
        # canons et des perches sur les pistes (tube blanc incliné sur la photo, ligne oblique dans le profil), rendus en
        # arbres de 2 à 4 m alors qu'ils montent à 6 à 11 m.
        q = h / max(hbrut[i + 1], 0.1)
        if h < 10 and (q < POINTE_Q or (q < POINTE_Q2 and largeur(X, Y) < POINTE_LARGEUR)):
            pointes += 1
            ecartes.append(('pointe', X, Y, float(hbrut[i + 1]), float(q)))
            continue
        rad = math.sqrt(max(area[i], 0.25) / math.pi)
        rad = min(rad, 0.55 * h + 0.5)
        trees.append((X, Y, float(sol[r_, c_]), float(hbrut[i + 1]), rad, h, float(seul), float(nbm[i + 1] / max(nb[i + 1], 1)), float(pyl)))
    T = np.array(trees, np.float64).reshape(-1, 9)
    # 4 nonies (26/11/2026) : un profil de PYLÔNE (échos en haut, mât maigre) n'est écarté qu'à moins de PYLONE_LIGNE m d'une
    # remontée ou d'une ligne électrique de la BD TOPO. Les pins (pin à crochets, sylvestre, cembro âgé) ont le même profil
    # (houppier en haut, tronc nu) : bloc 33982/23466, pinède pure de la BD Forêt sans aucune remontée, 25 « pylônes »
    # écartés, 9 sur 9 vérifiés de vrais pins. Sans réponse du service : écarté comme avant.
    lignes_pyl = None
    if T[:, 8].any():
        lc = lignes_bdtopo('transport_par_cable', x16 >> 2, y16 >> 2, dossier)
        le = lignes_bdtopo('ligne_electrique', x16 >> 2, y16 >> 2, dossier)
        lignes_pyl = None if lc is None or le is None else lc + le
    pyl = T[:, 8] > 0.5
    if pyl.any() and lignes_pyl is not None:
        pyl &= pres_cable(T[:, 0], T[:, 1], lignes_pyl, PYLONE_LIGNE) if lignes_pyl else False
    pylones = int(pyl.sum())
    for j in np.nonzero(pyl)[0]:
        ecartes.append(('pylone', float(T[j, 0]), float(T[j, 1]), float(T[j, 5]), 0.0))
    T = T[~pyl]
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
    # 4 ter. couronne non végétale sur la photo infrarouge : écartée (photo indisponible : gardée). Depuis le 26/11/2026,
    # elle est REPRISE si la photo montre de la végétation éclairée à portée du dévers ET l'ombre portée d'un arbre (cf.
    # indice_vegetation) : un arbre abattu depuis le vol LiDAR (2022 ; photo 2024), une grue, un balcon, un toit, une
    # voiture restent écartés.
    # 4 septies (26/11/2026) : couronne à UN SEUL ÉCHO (règle du 22/11 : rocher, toit) GARDÉE si son cœur est nettement
    # végétal sur l'infrarouge (> FEUILLAGE_IRC) : buissons denses à feuilles (aulnes verts surtout), que le laser ne
    # traverse pas. Mesuré sur 8 blocs : indice médian de ces couronnes +0,06 à +0,13 hors du village (conifères gardés
    # ~0) ; dans le village −0,17 (toits, murs : écartés). Sans photo : écartée, comme avant.
    roche = 0
    irc_manque = 0
    seuls = T[:, 6] > 0.5
    buissons_denses = np.zeros(len(T), bool)
    nd = np.full(len(T), np.nan)
    if len(out) and not os.environ.get('ARBRES_SANS_IRC'):
        nd, lum, proche, ombre = indice_vegetation(mx, my, out[:, 4], T[:, 3], k, dossier)
        irc_manque = int(np.isnan(nd).sum())
        # non végétal au cœur (règle du 22/11) ET pas repris : repris si la photo montre de la végétation à portée du dévers
        # ET une ombre d'arbre (OMBRE_MAX : 95 % des arbres gardés au village sous 85, 99 % sous 104 ; les arbres repris
        # au-dessus de 100 : chantiers, grue, bords de toits, fiches de arbres-26-11.md)
        repris = (proche >= SEUIL_IRC) & ~(ombre > OMBRE_MAX)
        pas_vert = ~seuls & (nd < SEUIL_IRC) & (lum > LUM_IRC) & ~repris
        buissons_denses = seuls & (nd > FEUILLAGE_IRC) & (lum > 30)
        roche = int(pas_vert.sum())
        garde = ~pas_vert & (~seuls | buissons_denses)
    else:
        garde = ~seuls
    un_echo = int((seuls & ~buissons_denses).sum())
    for j in np.nonzero(seuls & ~buissons_denses)[0]:
        ecartes.append(('un_echo', float(T[j, 0]), float(T[j, 1]), float(T[j, 3]), float(T[j, 7])))
    if len(out) and not os.environ.get('ARBRES_SANS_IRC'):
        for j in np.nonzero(pas_vert)[0]:
            ecartes.append(('infrarouge', float(T[j, 0]), float(T[j, 1]), float(T[j, 3]), float(proche[j])))
    out = out[garde]; T = T[garde]; buissons_denses = buissons_denses[garde]; nd = nd[garde]
    # Nature (reliefMesh.ts : 0 épicéa / sapin, 1 mélèze, 2 pin cembro / à crochets, 3 feuillu, 4 buisson), d'après la
    # forme mesurée (rayon de couronne / hauteur) et l'altitude : à Courchevel, presque tout est conifère au-dessus de
    # 1 400 m (épicéa et sapin étroits, mélèze plus large, cembro rond et trapu vers la limite de la forêt) ; feuillus en
    # bas de vallée. Quand rien ne tranche : épicéa. (À affiner avec la BD Forêt V2 de l'IGN, essence par parcelle.)
    sous_cable = 0
    if len(T) and not os.environ.get('ARBRES_SANS_CABLES'):
        lignes = cables(x16 >> 2, y16 >> 2, dossier)
        if lignes:
            pc = pres_cable(T[:, 0], T[:, 1], lignes)
            sous_cable = int(pc.sum())
            out = out[~pc]; T = T[~pc]; buissons_denses = buissons_denses[~pc]; nd = nd[~pc]
    # (rayon / hauteur LISSÉE : les seuils de forme ci-dessous ont été réglés ainsi le 22-23/11 ; la hauteur écrite est l'écho
    # le plus haut, cf. 26/11/2026)
    ratio = out[:, 4] / np.maximum(T[:, 5], 0.1)
    ratio_brut = out[:, 4] / np.maximum(out[:, 3], 0.1)
    alt = out[:, 2]
    rng = np.random.default_rng(x16 * 100003 + y16)
    graine = rng.integers(0, 256, len(T), dtype=np.uint8)
    tirage = rng.random(len(T))
    # forme seule (hors parcelle, peuplements mélangés) : comme avant
    forme = np.zeros(len(out), np.uint8)
    forme[(ratio >= 0.22) & (alt >= 1450)] = 1
    forme[(ratio >= 0.42) & (alt >= 1750)] = 2
    forme[(ratio >= 0.3) & (alt < 1450)] = 3
    nature = forme.copy()
    parcelles = [] if os.environ.get('ARBRES_SANS_BDFORET') else bd_foret(x16 >> 2, y16 >> 2, dossier)
    code = peuplement(T[:, 0], T[:, 1], parcelles) if len(T) and parcelles else np.array([''] * len(T), dtype=object)
    c_ = code.astype(str)
    # (« pur » dans la BD Forêt : 75 % au moins de l'essence ; les autres arbres de la parcelle gardent leur forme, mais
    # seulement s'ils la marquent nettement)
    pur_epicea = np.char.startswith(c_, 'FF2G61')
    pur_meleze = np.char.startswith(c_, 'FF2-63')
    # (FF2-52 : pin sylvestre pur, ajouté le 26/11/2026 ; il passait par la forme seule)
    pur_pin = np.char.startswith(c_, 'FF2G58') | np.char.startswith(c_, 'FF2-81') | np.char.startswith(c_, 'FF2G51') | np.char.startswith(c_, 'FF2-52')
    feuillus = np.char.startswith(c_, 'FF1') | np.char.startswith(c_, 'FO1')
    nature[pur_epicea] = np.where((tirage[pur_epicea] < 0.18) & (forme[pur_epicea] != 0), forme[pur_epicea], 0)
    nature[pur_meleze] = np.where((tirage[pur_meleze] < 0.2) & (forme[pur_meleze] != 1), 0, 1)
    nature[pur_pin] = np.where((tirage[pur_pin] < 0.2) & (forme[pur_pin] != 2), 0, 2)
    nature[feuillus] = np.where((tirage[feuillus] < 0.15) & (alt[feuillus] >= 1450), 0, 3)
    # peuplements mélangés de conifères (îlots, forêt ouverte, mélanges) : la forme, mais un mélèze ou un cembro doit la
    # marquer franchement (sinon épicéa, l'essence la plus courante de la zone)
    melange = np.char.startswith(c_, 'FF2-00') | np.char.startswith(c_, 'FO2') | np.char.startswith(c_, 'FF32')
    nature[melange & (forme == 1) & (ratio < 0.3)] = 0
    # hors forêt (landes, prés, arbres isolés) : la forme, sans changement
    # 4 decies (26/11/2026) : MÉLÈZE d'après la photo INFRAROUGE de l'IGN, hors des parcelles pures (mélanges, forêts
    # ouvertes, landes, prés, hors BD Forêt). La forme ne le distingue pas : rayon / hauteur médian mesuré dans les
    # parcelles pures, épicéa 0,17, mélèze 0,19 (pin 0,25) ; la règle « ≥ 0,22 » faisait des mélèzes de 554 des 674
    # arbres de 5 m et plus du bloc ouvert 33973/23469, presque tous des épicéas sur la photo. Le mélèze (aiguilles
    # tendres, feuillage clair) renvoie plus de proche infrarouge : indice du cœur de la couronne, mesuré dans le même vol
    # (Courchevel, été 2024), épicéas purs −0,01, mélèzes purs +0,075 ; au-dessus de la RÉFÉRENCE des épicéas purs du bloc
    # + MELEZE_IRC : 78 % des mélèzes purs reconnus, 9 % des épicéas purs pris pour des mélèzes. Référence relative (la
    # photo change d'étalonnage d'un vol à l'autre : mélèzes purs de Méribel +0,27) : médiane des arbres de 6 m et plus des
    # parcelles d'épicéa pur du bloc (30 au moins), sinon de tous ses arbres de 6 m et plus hors mélèze, pin et feuillus
    # purs ; sans référence ni photo : la forme, comme avant. Très infrarouge en mélange à feuillus (FF31, FO3) ou en bas
    # (< 1 450 m, couronne large) : feuillu.
    ref_irc, ref_src = None, ''
    # (ARBRES_ESSENCE_FORME=1 : l'ancienne règle de forme, pour comparer)
    if np.isfinite(nd).any() and not os.environ.get('ARBRES_ESSENCE_FORME'):
        m_ = pur_epicea & (out[:, 3] >= 6) & np.isfinite(nd)
        if m_.sum() >= 30:
            ref_irc, ref_src = float(np.median(nd[m_])), 'epiceas_purs'
        else:
            m_ = ~(pur_meleze | pur_pin | feuillus) & (out[:, 3] >= 6) & np.isfinite(nd)
            if m_.sum() >= 30:
                ref_irc, ref_src = float(np.median(nd[m_])), 'bloc'
    if ref_irc is not None:
        cible = ~(pur_epicea | pur_meleze | pur_pin | feuillus) & (out[:, 3] >= 3) & np.isfinite(nd)
        clair = cible & (nd > ref_irc + MELEZE_IRC)
        nature[cible & ~clair & (nature == 1)] = 0
        nature[clair] = 1
        a_feuillus = np.char.startswith(c_, 'FF31') | np.char.startswith(c_, 'FO3')
        nature[clair & (a_feuillus | ((ratio >= 0.3) & (alt < 1450)))] = 3
    nature[out[:, 3] < 3] = 4
    # buissons denses (4 septies) LARGES ET PLATS (rayon ≥ 0,4 × hauteur : fourrés d'aulnes verts, mesurés 0,5 à 0,7) :
    # buisson, feuillu au-delà de 5 m ; les étroits (petits conifères serrés posés sur l'herbe, au-dessus de 2 000 m surtout,
    # rayon ~0,2 × hauteur) gardent la règle commune
    plat = buissons_denses & (ratio_brut >= 0.4)
    nature[plat] = np.where(out[plat, 3] < 5, 4, 3)
    essences = {k: int(v) for k, v in zip(*np.unique(c_[c_ != ''], return_counts=True))} if len(c_) else {}
    head = {'z': 16, 'x': x16, 'y': y16, 'arbres': int(len(T)), 'pylones': pylones, 'peuplements': essences,
            'epiceas': int((nature == 0).sum()), 'meleze': int((nature == 1).sum()),
            'pins': int((nature == 2).sum()), 'feuillus': int((nature == 3).sum()), 'buissons': int((nature == 4).sum()),
            'buissons_denses': int(buissons_denses.sum()), 'ecartes_pointe': pointes,
            'reference_meleze': {'source': ref_src, 'indice': round(ref_irc, 3)} if ref_irc is not None else None,
            'ecartes_suspendus': suspendus, 'ecartes_un_echo': un_echo, 'ecartes_paroi': paroi, 'ecartes_infrarouge': roche, 'ecartes_sous_cable': sous_cable, 'infrarouge_manquant': irc_manque, 'carres_illisibles': illisibles,
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
