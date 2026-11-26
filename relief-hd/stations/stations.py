# Zones du Relief HD des stations de ski alpin de France : domaines (pistes de descente, remontées, landuse=winter_sports
# d'OpenStreetMap via OpenSnowMap), marge autour, tuiles z12 complètes, par massif, lots de 256 tuiles z14 au plus.
#   python stations.py stations-brut.json departements.json <sortie.json> [marge_km]
import sys, json, math, collections
import numpy as np
from shapely.geometry import shape, Point
from shapely.prepared import prep
from shapely.ops import unary_union
from pyproj import Transformer
from scipy import ndimage
from skimage.draw import polygon as poly_raster

brut = json.load(open(sys.argv[1]))
deps = json.load(open(sys.argv[2]))
sortie = sys.argv[3]
MARGE = float(sys.argv[4]) if len(sys.argv) > 4 else 2.0
TO_L93 = Transformer.from_crs(4326, 2154, always_xy=True)
TO_WGS = Transformer.from_crs(2154, 4326, always_xy=True)
CELL = 200.0
X0, Y0, X1, Y1 = 50_000.0, 6_020_000.0, 1_260_000.0, 7_130_000.0
NX, NY = int((X1 - X0) / CELL), int((Y1 - Y0) / CELL)

MASSIFS = {
    'Alpes du Nord': ['74', '73', '38', '26'],
    'Alpes du Sud': ['05', '04', '06', '84'],
    'Pyrénées': ['64', '65', '31', '09', '11', '66'],
    'Massif central': ['63', '15', '43', '42', '07', '48', '12', '03', '19', '23', '87', '30', '81', '34'],
    'Jura': ['01', '39', '25'],
    'Vosges': ['88', '68', '67', '90', '70', '54', '57'],
    'Corse': ['2A', '2B'],
}
DEP_MASSIF = {d: m for m, l in MASSIFS.items() for d in l}
ORDRE = list(MASSIFS) + ['Autres']

# départements (Lambert 93) : France et département de chaque cellule
dep_geo = {}
for f in deps['features']:
    code = f['properties']['code_insee']
    if len(code) > 2 and code not in ('2A', '2B'):
        continue  # (outre-mer)
    g = shape(f['geometry'])
    from shapely.ops import transform as sh_tr
    dep_geo[code] = sh_tr(lambda x, y, z=None: TO_L93.transform(x, y), g)
france = prep(unary_union(list(dep_geo.values())).buffer(0))
dep_prep = {c: prep(g) for c, g in dep_geo.items()}
# France rastérisée sur la grille de 200 m (contours extérieurs des départements)
france_grille = np.zeros((int((7_130_000.0 - 6_020_000.0) / 200.0), int((1_260_000.0 - 50_000.0) / 200.0)), bool)
for g in dep_geo.values():
    for pg in (g.geoms if g.geom_type == 'MultiPolygon' else [g]):
        A = np.asarray(pg.exterior.coords)
        rr_, cc_ = poly_raster((A[:, 1] - 6_020_000.0) / 200.0, (A[:, 0] - 50_000.0) / 200.0, shape=france_grille.shape)
        france_grille[rr_, cc_] = True

def dep_de(x, y):
    p = Point(x, y)
    for c, g in dep_prep.items():
        if g.contains(p):
            return c
    return None

def l93(coords):
    a = np.asarray(coords, float)
    X, Y = TO_L93.transform(a[:, 0], a[:, 1])
    return np.c_[X, Y]

def cell(P):
    return ((P[:, 1] - Y0) / CELL).astype(int).clip(0, NY - 1), ((P[:, 0] - X0) / CELL).astype(int).clip(0, NX - 1)

def echantillon(P, pas=50.0):
    out = [P[:1]]
    for a, b in zip(P[:-1], P[1:]):
        n = max(1, int(np.hypot(*(b - a)) / pas))
        t = np.linspace(0, 1, n + 1)[1:, None]
        out.append(a + (b - a) * t)
    return np.concatenate(out)

def longueur(P):
    return float(np.hypot(*np.diff(P, axis=0).T).sum()) if len(P) > 1 else 0.0

# 1. objets en France (milieu de la ligne dans un département)
marque = np.zeros((NY, NX), bool)
remontees, pistes, domaines = [], [], []
for kind, lst, dst in (('remontee', brut['remontees'], remontees), ('piste', brut['pistes'], pistes)):
    for f in lst:
        P = l93(f['c'])
        m = P[len(P) // 2]
        if not (X0 <= m[0] < X1 and Y0 <= m[1] < Y1) or not france.contains(Point(*m)):
            continue
        E = echantillon(P)
        r, c = cell(E)
        marque[r, c] = True
        dst.append({'nom': f['nom'], 'type': f.get('type', ''), 'P': P, 'm': m, 'long': longueur(P)})
for f in brut['domaines']:
    P = l93(f['c'])
    m = P.mean(0)
    if not (X0 <= m[0] < X1 and Y0 <= m[1] < Y1) or not france.contains(Point(*m)):
        continue
    rr, cc = poly_raster((P[:, 1] - Y0) / CELL, (P[:, 0] - X0) / CELL, shape=marque.shape)
    marque[rr, cc] = True
    domaines.append({'nom': f['nom'], 'm': m, 'P': P})
print('en France :', len(remontees), 'remontées,', len(pistes), 'pistes de descente,', len(domaines), 'domaines skiables', flush=True)

# 2. domaines skiables : objets à moins de ~1 km les uns des autres
lab, n = ndimage.label(ndimage.binary_dilation(marque, iterations=5), structure=np.ones((3, 3)))
lab = np.where(marque, lab, 0)
def lab_de(m):
    r, c = cell(np.asarray([m]))
    return int(lab[r[0], c[0]]) or int(ndimage.maximum(lab, None, None) * 0)
S = collections.defaultdict(lambda: {'remontees': 0, 'types': collections.Counter(), 'pistes_km': 0.0, 'noms_dom': collections.Counter(),
                                     'noms_rem': collections.Counter()})
for o in remontees:
    k = lab_de(o['m'])
    if k:
        S[k]['remontees'] += o['type'] != 'magic_carpet'
        S[k]['types'][o['type']] += 1
        if o['nom']:
            S[k]['noms_rem'][o['nom']] += 1
for o in pistes:
    k = lab_de(o['m'])
    if k:
        S[k]['pistes_km'] += o['long'] / 1000
for o in domaines:
    k = lab_de(o['m'])
    if k and o['nom']:
        S[k]['noms_dom'][o['nom']] += 1

# 3. stations de ski alpin : au moins une remontée (hors tapis) et 1 km de pistes de descente
idx_cells = ndimage.find_objects(lab)
stations = []
for k, s in S.items():
    if s['remontees'] < 1 or s['pistes_km'] < 1.0:
        continue
    sl = idx_cells[k - 1]
    rr, cc = np.nonzero(lab[sl] == k)
    rr += sl[0].start; cc += sl[1].start
    cx, cy = X0 + (cc.mean() + 0.5) * CELL, Y0 + (rr.mean() + 0.5) * CELL
    dep = dep_de(cx, cy) or '?'
    nom = ' / '.join([n for n, _ in s['noms_dom'].most_common(3)]) or ''
    lon, lat = TO_WGS.transform(cx, cy)
    stations.append({'id': k, 'nom': nom, 'departement': dep, 'massif': DEP_MASSIF.get(dep, 'Autres'), 'remontees': s['remontees'],
                     'pistes_km': round(s['pistes_km'], 1), 'centre': [round(lon, 4), round(lat, 4)], 'cellules': (rr, cc)})

# 3 bis. commune du centre (géocodage inverse de l'IGN, puis communes d'ADMIN EXPRESS : communes.py, communes2.py, cache) ;
# pistes qui ne sont pas de la montagne écartées
import os
communes = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'communes-cache.json'))) if os.path.exists(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'communes-cache.json')) else {}
EXCLUS = {'Amnéville': 'piste couverte (Snowhall)', 'Blaye-les-Mines': 'piste synthétique (Cap Découverte)'}
exclues = []
for s in list(stations):
    s['commune'] = communes.get(f"{s['centre'][0]},{s['centre'][1]}", '')
    if not s['nom']:
        s['nom'] = f"(domaine de {s['commune']})" if s['commune'] else '(sans nom)'
    if s['commune'] in EXCLUS:
        exclues.append({'commune': s['commune'], 'raison': EXCLUS[s['commune']]})
        stations.remove(s)

# 4. zone : marge autour des pistes et remontées (en France seulement), tuiles z12 qui la touchent
def z12(lon, lat, n=4096):
    x = ((np.asarray(lon) + 180) / 360 * n).astype(int)
    la = np.radians(np.asarray(lat))
    y = ((1 - np.log(np.tan(la) + 1 / np.cos(la)) / math.pi) / 2 * n).astype(int)
    return x, y
it = int(round(MARGE * 1000 / CELL))
fait = {(x, y) for x in range(2122, 2125) for y in (1466, 1467)}  # Courchevel
fait |= {(2121, 1467), (2122, 1470)} | {(x, y) for x in range(2121, 2124) for y in (1468, 1469)} | {(x, y) for x in (2126, 2127) for y in (1465, 1466, 1467)}
for s in stations:
    rr, cc = s.pop('cellules')
    r0, r1, c0, c1 = max(0, rr.min() - it - 1), min(NY, rr.max() + it + 2), max(0, cc.min() - it - 1), min(NX, cc.max() + it + 2)
    m = np.zeros((r1 - r0, c1 - c0), bool); m[rr - r0, cc - c0] = True
    # disque de rayon MARGE (distance euclidienne sur la grille)
    d = ndimage.distance_transform_edt(~m) * CELL
    zr, zc = np.nonzero(d <= MARGE * 1000)
    sel = france_grille[zr + r0, zc + c0]
    X = X0 + (zc[sel] + c0 + 0.5) * CELL; Y = Y0 + (zr[sel] + r0 + 0.5) * CELL
    lon, lat = TO_WGS.transform(X, Y)
    tx, ty = z12(lon, lat)
    s['z12'] = sorted({(int(a), int(b)) for a, b in zip(tx, ty)})
    ux, uy = z12(lon, lat, 16384)
    s['z14_utiles'] = sorted({(int(a), int(b)) for a, b in zip(ux, uy)})
    s['surface_zone_km2'] = round(float((d <= MARGE * 1000).sum()) * CELL * CELL / 1e6, 1)

# 5. tuiles z12 : chacune à la station la plus grande qui la touche ; par massif
stations.sort(key=lambda s: (ORDRE.index(s['massif']), -s['remontees'], -s['pistes_km']))
tuile_station = {}
for s in stations:
    for t in s['z12']:
        tuile_station.setdefault(t, s['id'])
def aire_z12(y):
    lat = math.degrees(math.atan(math.sinh(math.pi * (1 - 2 * (y + 0.5) / 4096))))
    c = 40075.016686 * math.cos(math.radians(lat)) / 4096
    return c * c
par_massif = collections.OrderedDict((m, {'stations': 0, 'grandes': 0, 'remontees': 0, 'z12': [], 'z12_faites': 0}) for m in ORDRE)
st_par_id = {s['id']: s for s in stations}
for s in stations:
    pm = par_massif[s['massif']]
    pm['stations'] += 1; pm['grandes'] += s['remontees'] >= 10; pm['remontees'] += s['remontees']
for t, k in tuile_station.items():
    pm = par_massif[st_par_id[k]['massif']]
    if t in fait:
        pm['z12_faites'] += 1
    else:
        pm['z12'].append(t)
for m, pm in par_massif.items():
    pm['surface_km2'] = round(sum(aire_z12(y) for _, y in pm['z12']))
# tuiles z14 UTILES (dans la zone d'une station, hors tuiles z12 déjà faites) : le paquet assemble aussi une tuile z12 incomplète
z14_vu = {}
for s in stations:
    for t in s['z14_utiles']:
        if (t[0] >> 2, t[1] >> 2) not in fait:
            z14_vu.setdefault(t, s['massif'])
for m, pm in par_massif.items():
    pm['z14_utiles'] = sum(1 for v in z14_vu.values() if v == m)

# 6. lots de 256 tuiles z14 (16 tuiles z12 complètes) : par massif, grandes stations d'abord
ordre_tuiles = []
vu = set()
for s in stations:
    for t in s['z12']:
        if t not in vu and t not in fait:
            vu.add(t); ordre_tuiles.append(t)
lots = []
for i in range(0, len(ordre_tuiles), 16):
    l = ordre_tuiles[i:i + 16]
    lots.append({'z12': [f'{x}/{y}' for x, y in l], 'tuiles': ' '.join(f'{4 * x + a}/{4 * y + b}' for x, y in l for b in range(4) for a in range(4)),
                 'massifs': sorted({st_par_id[tuile_station[t]]['massif'] for t in l})})
# 6 bis. lots des seules tuiles z14 UTILES, une tuile z12 jamais coupée entre deux lots
par_z12 = collections.OrderedDict()
for s in stations:
    for t in s['z14_utiles']:
        p = (t[0] >> 2, t[1] >> 2)
        if p in fait:
            continue
        par_z12.setdefault(p, set()).add(t)
lots_utiles, cur, cur_z12 = [], [], []
for p, ts in par_z12.items():
    ts = sorted(ts, key=lambda t: (t[1], t[0]))
    if len(cur) + len(ts) > 256:
        lots_utiles.append({'z12': cur_z12, 'tuiles': ' '.join(f'{x}/{y}' for x, y in cur), 'nombre': len(cur)}); cur, cur_z12 = [], []
    cur += ts; cur_z12.append(f'{p[0]}/{p[1]}')
if cur:
    lots_utiles.append({'z12': cur_z12, 'tuiles': ' '.join(f'{x}/{y}' for x, y in cur), 'nombre': len(cur)})
res = {'source': 'OpenStreetMap via OpenSnowMap (planet_pistes, © contributeurs OpenStreetMap, ODbL) ; départements ADMIN EXPRESS (IGN)',
       'marge_km': MARGE, 'exclues': exclues, 'deja_faites_z12': sorted(f'{x}/{y}' for x, y in fait),
       'massifs': {m: {k: (v if k != 'z12' else [f'{x}/{y}' for x, y in v]) for k, v in pm.items()} for m, pm in par_massif.items()},
       'stations': [{**{k: v for k, v in s.items() if k != 'z14_utiles'}, 'z12': [f'{x}/{y}' for x, y in s['z12']], 'z14_utiles': len(s['z14_utiles'])} for s in stations], 'lots': lots, 'lots_utiles': lots_utiles}
json.dump(res, open(sortie, 'w'), ensure_ascii=False, indent=1)
tot = sum(len(pm['z12']) for pm in par_massif.values())
print('stations :', len(stations), '; tuiles z12 à faire :', tot, '(z14 :', 16 * tot, ') ; lots :', len(lots), '; lots des tuiles utiles :', len(lots_utiles), sum(l['nombre'] for l in lots_utiles))
for m, pm in par_massif.items():
    print(f"  {m:15s} stations {pm['stations']:4d} (dont {pm['grandes']:3d} de 10 remontées et plus), z12 {len(pm['z12']):4d}, déjà faites {pm['z12_faites']}, {pm['surface_km2']} km², z14 utiles {pm['z14_utiles']}")
