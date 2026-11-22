# Relief HD, fabrication (plan : docs/relief-hd/plan-courchevel.md § 5) : la SURFACE DURE d'un bloc (une tuile mercator
# du zoom 16, ~430 m à Courchevel) reconstruite en 3D à partir du nuage de points classé du LiDAR HD de l'IGN (Licence
# Ouverte 2.0, « IGN LiDAR HD »).
#
#   python bloc.py <x16> <y16> <dossier des dalles> <dossier de sortie> [--force]
#
# 1. Points : sol (classe 2) + points non classés (1) à moins de 2 m d'un point du sol (la roche des parois n'est pas
#    toute classée « sol » : 57 % des points sous les surplombs sont « non classés », mesuré le 21/11). Végétation,
#    bâtiments, sursol : écartés (arbres et bâtiments ont leurs propres produits).
# 2. Normales orientées vers le CAPTEUR : une face n'est vue que de son côté avant. Le cap de chaque ligne de vol vient
#    de la régression de la position sur l'heure GPS ; le capteur est du côté opposé à l'angle de visée (LAS : angle > 0
#    à droite de l'avion). Plus de surface fantôme, les dessous de surplombs gardent leur normale vers le bas.
# 3. Reconstruction de Poisson (Open3D) sur le bloc + 25 m de marge : cellule ~0,33 m (journal du 22/11 : en deçà,
#    plus aucun gain mesurable, la donnée est épuisée).
# 4. Rognage : ce qui est à plus de 6 m de tout point (bulles de Poisson) et les petits morceaux isolés.
# 5. Repère de la tuile du zoom 12 qui porte le bloc : mètres VRAIS (mercator × 2πR·cos(latitude du centre de la tuile
#    z12)), x vers l'est, y vers le nord, z = altitude (IGN69). Normales calculées dans ce repère (conforme).
# 6. Occlusion ambiante par sommet (rayons sur toute la surface du bloc, marge comprise) : les creux plus sombres.
# 7. Ne garde que les triangles dont le centre est dans le bloc (les blocs voisins se raccordent par des jupes).
#
# Sortie : <sortie>/16_<x>_<y>.blk : en-tête JSON (1 ligne) puis positions f32 ×3, normales f32 ×3, occlusion u8,
# canopée u8 (version 2 : hauteur de la végétation au-dessus du sommet, pas de 25 cm), indices u32 ×3. Le paquet (scripts/relief-hd/paquet.mjs) en tire les niveaux de détail.
import sys, os, json, time, math, urllib.request
import numpy as np, laspy, open3d as o3d
from laspy.copc import Bounds
from scipy.spatial import cKDTree
from pyproj import Transformer

R_EARTH = 6378137.0
MARGE = 25.0
o3d.utility.set_verbosity_level(o3d.utility.VerbosityLevel.Error)
TO_L93 = Transformer.from_crs(4326, 2154, always_xy=True)
TO_WGS = Transformer.from_crs(2154, 4326, always_xy=True)


def tile_lonlat(z, x, y):
    n = 2 ** z
    lon = x / n * 360 - 180
    lat = math.degrees(math.atan(math.sinh(math.pi * (1 - 2 * y / n))))
    return lon, lat


def bloc_ign(X, Y):
    """Bloc de diffusion de l'IGN d'une dalle (XXXX = km du bord ouest, YYYY = km du bord nord) : Courchevel est à
    cheval sur QL, QM, RL, RM (relevé du catalogue le 22/11/2026)."""
    col = 'Q' if X < 986 else 'R'
    lig = 'L' if Y >= 6484 else 'M'
    dates = {'QL': '2025-03-26', 'QM': '2025-02-20', 'RL': '2025-06-04', 'RM': '2025-06-06'}
    return f'NUALHD_1-0__LAZ_LAMB93_{col}{lig}_{dates[col + lig]}'


def dalle(dossier, X, Y):
    fn = os.path.join(dossier, f'{X:04d}_{Y:04d}.copc.laz')
    if os.path.exists(fn) and os.path.getsize(fn) > 10000:
        return fn
    url = f'https://data.geopf.fr/telechargement/download/LiDARHD-NUALID/{bloc_ign(X, Y)}/LHD_FXX_{X:04d}_{Y:04d}_PTS_LAMB93_IGN69.copc.laz'
    # (22/11/2026 : sur une machine neuve du cloud, le dossier n'existait pas ; chaque écriture échouait en silence.)
    os.makedirs(dossier, exist_ok=True)
    tmp = fn + '.part'
    for essai in range(4):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (relief-hd)'})
            with urllib.request.urlopen(req, timeout=600) as r, open(tmp, 'wb') as f:
                attendu = int(r.headers.get('Content-Length') or 0)
                while True:
                    b = r.read(1 << 20)
                    if not b: break
                    f.write(b)
            # Dalle COMPLÈTE seulement (22/11/2026 : une coupure réseau laissait un fichier tronqué, gardé, et le bloc
            # échouait à la lecture : « failed to fill whole buffer », 12 blocs sur 58 tuiles dans le cloud).
            if attendu and os.path.getsize(tmp) != attendu:
                raise IOError(f'dalle tronquée {os.path.getsize(tmp)} / {attendu}')
            if os.path.getsize(tmp) > 10000:
                os.replace(tmp, fn)
                return fn
        except Exception as e:  # réseau : nouvel essai
            print('dalle', X, Y, 'essai', essai, e, flush=True)
            time.sleep(5 * (essai + 1))
    return None


def lire(dossier, x0, y0, x1, y1):
    cols = {k: [] for k in ('x', 'y', 'z', 'c', 'ang', 'ps', 'gt')}
    for X in range(int(x0 // 1000), int(x1 // 1000) + 1):
        for Y in range(int(y0 // 1000) + 1, int(y1 // 1000) + 2):
            fn = dalle(dossier, X, Y)
            if not fn:
                print('DALLE ABSENTE', X, Y, flush=True)
                continue
            with laspy.CopcReader.open(fn) as r:
                p = r.query(Bounds(mins=np.array([x0, y0]), maxs=np.array([x1, y1])))
            if len(p) == 0:
                continue
            cols['x'].append(np.asarray(p.x)); cols['y'].append(np.asarray(p.y)); cols['z'].append(np.asarray(p.z))
            cols['c'].append(np.asarray(p.classification)); cols['ang'].append(np.asarray(p.scan_angle) * 0.006)
            cols['ps'].append(np.asarray(p.point_source_id)); cols['gt'].append(np.asarray(p.gps_time))
    if not cols['x']:
        return None
    return {k: np.concatenate(v) for k, v in cols.items()}


def close_holes(mesh, max_edges):
    V = np.asarray(mesh.vertices)
    T = np.asarray(mesh.triangles)
    # Arêtes de bord ORIENTÉES (sens du triangle) : celles dont l'arête opposée n'existe pas.
    e = np.r_[T[:, [0, 1]], T[:, [1, 2]], T[:, [2, 0]]].astype(np.int64)
    n = len(V)
    key = e[:, 0] * n + e[:, 1]
    rev = e[:, 1] * n + e[:, 0]
    border = e[~np.isin(key, rev)]
    if not len(border):
        return mesh
    nxt = {}
    for a, b in border:
        nxt.setdefault(int(a), []).append(int(b))
    seen = set()
    newV, newT = [], []
    for a0 in list(nxt.keys()):
        if a0 in seen:
            continue
        loop = [a0]
        seen.add(a0)
        cur = a0
        ok = False
        for _ in range(max_edges + 1):
            nb = nxt.get(cur)
            if not nb:
                break
            cur = nb[0]
            if cur == a0:
                ok = True
                break
            if cur in seen:
                break
            seen.add(cur)
            loop.append(cur)
        if not ok or len(loop) < 3 or len(loop) > max_edges:
            continue
        c = V[loop].mean(0)
        ci = n + len(newV)
        newV.append(c)
        # Le trou se ferme dans le sens INVERSE du bord (les triangles bordent le trou de l'autre côté).
        for i in range(len(loop)):
            newT.append((loop[(i + 1) % len(loop)], loop[i], ci))
    if not newV:
        return mesh
    V2 = np.r_[V, np.array(newV)]
    T2 = np.r_[T, np.array(newT, np.int64)]
    return o3d.geometry.TriangleMesh(o3d.utility.Vector3dVector(V2), o3d.utility.Vector3iVector(T2.astype(np.int32)))


def main():
    x16, y16, dossier, sortie = int(sys.argv[1]), int(sys.argv[2]), sys.argv[3], sys.argv[4]
    out = os.path.join(sortie, f'16_{x16}_{y16}.blk')
    if os.path.exists(out) and '--force' not in sys.argv:
        print('déjà fait', out); return
    T0 = time.time()
    chrono = {}
    # Tuile z12 porteuse et son repère
    x12, y12 = x16 >> 4, y16 >> 4
    lon12a, lat12a = tile_lonlat(12, x12, y12)
    lon12b, lat12b = tile_lonlat(12, x12 + 1, y12 + 1)
    latc = (lat12a + lat12b) / 2
    k = 2 * math.pi * R_EARTH * math.cos(math.radians(latc))  # mètres vrais par unité mercator
    mx0 = x12 / 4096; my0 = y12 / 4096
    # Bloc en mercator (unités 0..1) et son emprise Lambert-93 (+ marge)
    bx0, by0, bx1, by1 = x16 / 65536, y16 / 65536, (x16 + 1) / 65536, (y16 + 1) / 65536
    corners = [tile_lonlat(16, x16 + i, y16 + j) for i in (0, 1) for j in (0, 1)]
    L = np.array([TO_L93.transform(lo, la) for lo, la in corners])
    ex0, ey0 = L.min(0) - MARGE; ex1, ey1 = L.max(0) + MARGE
    d = lire(dossier, ex0, ey0, ex1, ey1)
    chrono['lecture'] = time.time() - T0
    if d is None:
        print('aucun point', x16, y16); return
    x, y, z, c = d['x'], d['y'], d['z'], d['c']
    # 1. points durs
    g = c == 2
    if g.sum() < 1000:
        print('trop peu de sol', x16, y16); return
    tg = cKDTree(np.c_[x[g], y[g], z[g]])
    u = c == 1
    dd, _ = tg.query(np.c_[x[u], y[u], z[u]], k=1, distance_upper_bound=2.0, workers=-1)
    keep = g.copy(); iu = np.nonzero(u)[0]; keep[iu[np.isfinite(dd)]] = True
    # 2. caps des lignes de vol
    head = {}
    for s in np.unique(d['ps']):
        m = d['ps'] == s
        if m.sum() < 1000: continue
        t = d['gt'][m] - d['gt'][m].mean()
        if np.ptp(t) <= 0: continue
        vx = np.polyfit(t, x[m], 1)[0]; vy = np.polyfit(t, y[m], 1)[0]; n = math.hypot(vx, vy)
        if n > 0: head[int(s)] = (vx / n, vy / n)
    # Eau (classe 9) : surface des lacs, gardée comme le sol.
    keep |= c == 9
    ox, oy, oz = (ex0 + ex1) / 2, (ey0 + ey1) / 2, float(np.median(z[keep]))
    P = np.c_[x[keep] - ox, y[keep] - oy, z[keep] - oz]
    ang, ps = d['ang'][keep], d['ps'][keep]
    # SOL INTERPOLÉ là où aucun point dur n'existe à moins de 1,5 m (sous les bâtiments, une canopée très dense, un lac
    # sans écho) : sans lui, la surface y était trouée (contrôle du 22/11 : 1 500 m de bords de trous dans un bloc de
    # Courchevel 1850). Grille de 1 m, altitude interpolée sur les points du sol ; normales verticales.
    from scipy.interpolate import LinearNDInterpolator
    gx, gy = np.meshgrid(np.arange(ex0 + 0.5, ex1, 1.0) - ox, np.arange(ey0 + 0.5, ey1, 1.0) - oy)
    G = np.c_[gx.ravel(), gy.ravel()]
    dd2, _ = cKDTree(P[:, :2]).query(G, k=1, distance_upper_bound=1.5, workers=-1)
    empty = ~np.isfinite(dd2)
    n_fill = 0
    if empty.any():
        gsel = g[keep] if False else (c[keep] == 2)
        src = P[gsel][:: max(1, int(gsel.sum() // 400000))]
        f = LinearNDInterpolator(src[:, :2], src[:, 2])
        zf = f(G[empty])
        okf = np.isfinite(zf)
        F = np.c_[G[empty][okf], zf[okf]]
        n_fill = len(F)
        if n_fill:
            P = np.r_[P, F]
            ang = np.r_[ang, np.zeros(n_fill)]
            ps = np.r_[ps, np.full(n_fill, np.iinfo(ps.dtype).max, dtype=ps.dtype)]
    pc = o3d.geometry.PointCloud(o3d.utility.Vector3dVector(P))
    pc.estimate_normals(o3d.geometry.KDTreeSearchParamHybrid(radius=1.2, max_nn=24))
    N = np.asarray(pc.normals)
    if n_fill:
        N[-n_fill:] = (0, 0, 1)
    S = np.zeros_like(N); S[:, 2] = 1
    for s, (fx, fy) in head.items():
        m = ps == s; a = np.radians(ang[m]); rx, ry = fy, -fx
        S[m, 0] = -np.sin(a) * rx; S[m, 1] = -np.sin(a) * ry; S[m, 2] = np.cos(a)
    N[(N * S).sum(1) < 0] *= -1
    pc.normals = o3d.utility.Vector3dVector(N)
    chrono['normales'] = time.time() - T0
    # 3. Poisson : bloc raide (plus de 4 % des points sur des faces de plus de ~37°) → profondeur 11, sinon 10
    steep = N[:, 2] < 0.8
    raide = float(steep.mean())
    # Cellule visée ~0,33 m partout (22/11 : 0,36 m et 0,18 m donnent le même écart aux points, la donnée est épuisée ;
    # 0,25 m doublait le temps et les triangles pour rien) : profondeur 11 sur un cube agrandi (scale).
    depth = 11
    span = max(ex1 - ex0, ey1 - ey0)
    scale = max(1.05, 0.33 * 2 ** depth / span)
    flat = pc.select_by_index(np.nonzero(~steep)[0]).voxel_down_sample(0.3)
    pcs = pc.select_by_index(np.nonzero(steep)[0]) + flat
    mesh, _ = o3d.geometry.TriangleMesh.create_from_point_cloud_poisson(pcs, depth=depth, scale=float(scale), linear_fit=False)
    chrono['poisson'] = time.time() - T0
    # 4. rognage
    V = np.asarray(mesh.vertices)
    dv, _ = cKDTree(P).query(V, k=1, distance_upper_bound=6.0, workers=-1)
    mesh.remove_vertices_by_mask(~np.isfinite(dv))
    mesh.remove_unreferenced_vertices()
    # Trous intérieurs (paroi sans écho, rognée) bouchés : boucles de bord de moins de 800 arêtes, fermées en éventail
    # depuis leur centre (le bord du bloc, bien plus long, reste ouvert). Contrôle du 22/11 : des taches de ciel au
    # travers d'une paroi du couloir A6. (PyMeshLab le faisait aussi, mais en 18 min par bloc.)
    mesh = close_holes(mesh, 800)
    # 4 ter. BÂTIMENTS (batiments.py) : murs droits et toits mesurés, ajoutés à la surface du bloc (le sol passe dessous,
    # interpolé). Leurs murs sont marqués (canopée = 253) : le moteur les teinte en neutre.
    from scipy.interpolate import LinearNDInterpolator as _LI
    from batiments import batiments
    gsrc = P[: len(c[keep])][c[keep] == 2]  # (P : points gardés, puis points ajoutés ; c[keep] couvre les premiers)
    gsrc = gsrc[:: max(1, len(gsrc) // 300000)]
    _f = _LI(gsrc[:, :2], gsrc[:, 2])

    def sol_z(X, Y):
        zz = _f(X - ox, Y - oy)
        bad = ~np.isfinite(zz)
        if bad.any():
            from scipy.interpolate import NearestNDInterpolator
            zz[bad] = NearestNDInterpolator(gsrc[:, :2], gsrc[:, 2])(X[bad] - ox, Y[bad] - oy)
        return zz + oz

    BV, BT, BM = batiments(x, y, z, c, sol_z, ex0, ey0, ex1, ey1, ox, oy, oz)
    n_bat_v = len(BV)
    if n_bat_v:
        nv0 = len(mesh.vertices)
        mesh.vertices = o3d.utility.Vector3dVector(np.r_[np.asarray(mesh.vertices), BV])
        mesh.triangles = o3d.utility.Vector3iVector(np.r_[np.asarray(mesh.triangles), BT + nv0].astype(np.int32))
    wall = np.zeros(len(mesh.vertices), bool)
    if n_bat_v:
        wall[-n_bat_v:] = BM
    chrono['rognage'] = time.time() - T0
    # 4 bis. CANOPÉE au-dessus de chaque sommet (MHC à 1 m : végétation la plus haute de la case moins le sol) : de près le
    # sol sous les arbres devient un sous-bois, au loin la forêt garde son volume (moteur, nœuds grossiers).
    V = np.asarray(mesh.vertices)
    veg = (c == 3) | (c == 4) | (c == 5)
    nxg = int((ex1 - ex0) // 1.0) + 1
    nyg = int((ey1 - ey0) // 1.0) + 1
    top = np.full((nyg, nxg), -np.inf, np.float32)
    if veg.any():
        np.maximum.at(top, (((y[veg] - ey0) // 1.0).astype(int).clip(0, nyg - 1), ((x[veg] - ex0) // 1.0).astype(int).clip(0, nxg - 1)), z[veg])
    from scipy import ndimage
    top = np.where(np.isfinite(top), top, -1e9)
    top = ndimage.maximum_filter(top, size=3)  # couronnes continues (cases vides entre deux échos)
    vi = ((V[:, 0] + ox - ex0) // 1.0).astype(int).clip(0, nxg - 1)
    vj = ((V[:, 1] + oy - ey0) // 1.0).astype(int).clip(0, nyg - 1)
    can = np.clip(top[vj, vi] - (V[:, 2] + oz), 0, 63).astype(np.float32)
    can[V[:, 2] + oz > top[vj, vi]] = 0
    canopy = np.clip(np.round(can * 4), 0, 252).astype(np.uint8)  # pas de 25 cm
    canopy[wall] = 253  # murs des bâtiments
    # 5. repère de la tuile z12 (mètres vrais), via WGS84 → mercator
    lon, lat = TO_WGS.transform(V[:, 0] + ox, V[:, 1] + oy)
    mx = (np.asarray(lon) + 180) / 360
    latr = np.radians(np.asarray(lat))
    my = (1 - np.log(np.tan(latr) + 1 / np.cos(latr)) / math.pi) / 2
    W = np.c_[(mx - mx0) * k, (my0 - my) * k, V[:, 2] + oz]
    mesh.vertices = o3d.utility.Vector3dVector(W)
    mesh.compute_vertex_normals()
    Nv = np.asarray(mesh.vertex_normals).astype(np.float32)
    chrono['repere'] = time.time() - T0
    # 6. occlusion ambiante : 24 rayons (cosinus) de 30 m depuis chaque sommet
    sc = o3d.t.geometry.RaycastingScene(); sc.add_triangles(o3d.t.geometry.TriangleMesh.from_legacy(mesh))
    nv = len(W)
    rng = np.random.default_rng(7)
    vis = np.zeros(nv, np.float32)
    origin = (W + Nv * 0.15).astype(np.float32)
    # base orthonormée par sommet
    tx = np.cross(Nv, np.array([0, 0, 1], np.float32)); bad = np.linalg.norm(tx, axis=1) < 1e-3
    tx[bad] = np.cross(Nv[bad], np.array([1, 0, 0], np.float32))
    Nv[~np.isfinite(Nv).all(1)] = (0, 0, 1)
    tx /= np.maximum(np.linalg.norm(tx, axis=1, keepdims=True), 1e-6); ty = np.cross(Nv, tx)
    NR = 24
    for i in range(NR):
        u1, u2 = (i + rng.random()) / NR, rng.random()
        r = math.sqrt(u1); phi = 2 * math.pi * u2
        a, b, cz = r * math.cos(phi), r * math.sin(phi), math.sqrt(max(0, 1 - u1))
        dirs = (tx * a + ty * b + Nv * cz).astype(np.float32)
        hit = sc.cast_rays(o3d.core.Tensor(np.c_[origin, dirs]))['t_hit'].numpy()
        vis += (hit > 30.0)
    ao = np.clip(vis / NR * 255 + 0.5, 0, 255).astype(np.uint8)
    chrono['occlusion'] = time.time() - T0
    # 7. triangles du bloc seulement
    T = np.asarray(mesh.triangles)
    cen = W[T].mean(1)
    cx0, cx1 = (bx0 - mx0) * k, (bx1 - mx0) * k
    cy1, cy0 = (my0 - by0) * k, (my0 - by1) * k
    inside = (cen[:, 0] >= cx0) & (cen[:, 0] < cx1) & (cen[:, 1] >= cy0) & (cen[:, 1] < cy1)
    T = T[inside]
    # petits morceaux isolés (moins de 200 triangles) : écartés
    from scipy.sparse import coo_matrix
    from scipy.sparse.csgraph import connected_components
    e = np.r_[T[:, [0, 1]], T[:, [1, 2]]]
    ncomp, lab = connected_components(coo_matrix((np.ones(len(e), np.int8), (e[:, 0], e[:, 1])), shape=(nv, nv)), directed=False)
    tl = lab[T[:, 0]]
    cnt = np.bincount(tl, minlength=ncomp)
    T = T[cnt[tl] >= 200]
    used = np.unique(T)
    remap = np.full(nv, -1, np.int64); remap[used] = np.arange(len(used))
    T = remap[T].astype(np.uint32)
    W = W[used].astype(np.float32); Nv = Nv[used]; ao = ao[used]; canopy = canopy[used]
    head_json = {
        'z': 16, 'x': x16, 'y': y16, 'x12': x12, 'y12': y12, 'k': k, 'latc': latc,
        'emprise': [float(cx0), float(cy0), float(cx1), float(cy1)],
        'version': 2, 'sommets': int(len(W)), 'triangles': int(len(T)), 'batiments_sommets': int(n_bat_v), 'points': int(len(P)), 'points_ajoutes': int(n_fill), 'raide': round(raide, 4), 'profondeur': depth,
        'secondes': {a: round(b, 1) for a, b in chrono.items()} | {'total': round(time.time() - T0, 1)}
    }
    os.makedirs(sortie, exist_ok=True)
    tmp = out + '.part'
    with open(tmp, 'wb') as f:
        f.write((json.dumps(head_json) + '\n').encode())
        f.write(W.tobytes()); f.write(Nv.astype(np.float32).tobytes()); f.write(ao.tobytes()); f.write(canopy.tobytes()); f.write(T.tobytes())
    os.replace(tmp, out)
    print(json.dumps(head_json), flush=True)


if __name__ == '__main__':
    main()
