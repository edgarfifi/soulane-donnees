# Relief HD, fabrication (plan : docs/relief-hd/plan-courchevel.md § 5) : la SURFACE DURE d'un bloc (une tuile mercator
# du zoom 16, ~430 m à Courchevel) reconstruite en 3D à partir du nuage de points classé du LiDAR HD de l'IGN (Licence
# Ouverte 2.0, « IGN LiDAR HD »).
#
#   python bloc.py <x16> <y16> <dossier des dalles> <dossier de sortie> [--force]
#
# 1. Points : sol (classe 2), eau (9), tablier des ponts (17) + points non classés (1) à moins de 2 m d'un point du sol (la roche des parois n'est pas
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
    tmp = fn + f'.{os.getpid()}.part'  # (deux blocs en même temps peuvent demander la même dalle)
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


def caps(d):
    """Cap (vecteur unitaire du déplacement de l'avion, x vers l'est, y vers le nord) de chaque ligne de vol (point_source_id)
    d'au moins 1 000 points : régression de la position sur l'heure GPS."""
    head = {}
    x, y = d['x'], d['y']
    for s in np.unique(d['ps']):
        m = d['ps'] == s
        if m.sum() < 1000: continue
        t = d['gt'][m] - d['gt'][m].mean()
        if np.ptp(t) <= 0: continue
        vx = np.polyfit(t, x[m], 1)[0]; vy = np.polyfit(t, y[m], 1)[0]; n = math.hypot(vx, vy)
        if n > 0: head[int(s)] = (vx / n, vy / n)
    return head


def vers_capteur(ang, ps, head):
    """Direction (unitaire) de chaque point vers le CAPTEUR : le capteur est du côté opposé à l'angle de visée (LAS : angle
    > 0 à droite de l'avion). Ligne de vol inconnue : verticale. Sert aux normales de la surface et, pour les bâtiments,
    aux rayons LIBRES (entre le point et l'avion, rien de solide : batiments.py, controle_batiments.py)."""
    S = np.zeros((len(ang), 3)); S[:, 2] = 1
    for s, (fx, fy) in head.items():
        m = ps == s; a = np.radians(ang[m]); rx, ry = fy, -fx
        S[m, 0] = -np.sin(a) * rx; S[m, 1] = -np.sin(a) * ry; S[m, 2] = np.cos(a)
    return S


def toits_semes(x, y, z, c, d, head, ex0, ey0, ex1, ey1, ox, oy, oz, pas=0.3, murs=False):
    """Surface unique, toits posés (BATI_POISSON=2) : toits à pans de batiments.py (version 5, avec ses replis), semés de
    points tous les ~pas m (normale du pan, vers le haut). Rend (points semés (repère local), normales, masque des points
    scène des toits pour le lancer de rayons), ou None sans bâtiment."""
    import batiments as bt
    from scipy.interpolate import LinearNDInterpolator, NearestNDInterpolator
    g = c == 2
    gs = np.c_[x[g] - ox, y[g] - oy, z[g] - oz][:: max(1, int(g.sum()) // 300000)]
    fl = LinearNDInterpolator(gs[:, :2], gs[:, 2])

    def sol_z(X, Y):
        zz = fl(X - ox, Y - oy)
        bad = ~np.isfinite(zz)
        if bad.any():
            zz[bad] = NearestNDInterpolator(gs[:, :2], gs[:, 2])(X[bad] - ox, Y[bad] - oy)
        return zz + oz

    st = {}
    V, T, M = bt.batiments(x, y, z, c, sol_z, ex0, ey0, ex1, ey1, ox, oy, oz, stats=st,
                           capteur=vers_capteur(d['ang'], d['ps'], head))
    if not len(T):
        return None
    Kt = st['types_triangles']
    TT = T[Kt == bt.TOIT]
    if murs:
        # (BATI_POISSON=3 : murs, rives, sous-faces, dessous semés aussi, plus clair : un point tous les ~0,5 m ; bloc.py
        # n'en garde que là où aucun point mesuré n'est à moins de 0,7 m, ils ne font que guider la surface)
        TT = np.r_[TT, T[Kt != bt.TOIT]]
    est_toit = np.r_[np.ones(int((Kt == bt.TOIT).sum()), bool), np.zeros(len(TT) - int((Kt == bt.TOIT).sum()), bool)]
    a, b, cc = V[TT[:, 0]], V[TT[:, 1]], V[TT[:, 2]]
    n = np.cross(b - a, cc - a)
    ar = 0.5 * np.linalg.norm(n, axis=1)
    ok = ar > 1e-6
    TT, a, b, cc, n, ar, est_toit = TT[ok], a[ok], b[ok], cc[ok], n[ok], ar[ok], est_toit[ok]
    n = n / (2 * ar)[:, None]
    n[est_toit & (n[:, 2] < 0)] *= -1
    k = np.maximum(1, np.round(ar / np.where(est_toit, pas * pas, 0.25)).astype(int))
    ti = np.repeat(np.arange(len(TT)), k)
    rng = np.random.default_rng(1)
    r1, r2 = rng.random(len(ti)), rng.random(len(ti))
    f = r1 + r2 > 1
    r1[f], r2[f] = 1 - r1[f], 1 - r2[f]
    R = a[ti] + (b[ti] - a[ti]) * r1[:, None] + (cc[ti] - a[ti]) * r2[:, None]
    RN = n[ti]
    if murs:
        # murs guidés : jamais là où des rayons du laser sont passés (contrôle des rideaux : un mur de batiments.py descendu
        # dans un vide vu par le LiDAR ne guide pas la surface)
        import controle_batiments as cb
        lab, _, top = cb.emprises(x, y, z, c, ex0, ey0, ex1, ey1)
        PL, DL, _ = cb.rayons_libres(x, y, z, c, vers_capteur(d['ang'], d['ps'], head), lab, ex0, ey0, ox, oy, oz, top)
        _, pas_, _, _ = cb.rideaux(V, T, M, PL, DL)
        if len(pas_):
            dpas, _ = cKDTree(pas_).query(R, k=1, distance_upper_bound=1.5, workers=-1)
            vide = np.isfinite(dpas) & ~est_toit[ti]
            R, RN, ti = R[~vide], RN[~vide], ti[~vide]
        R = np.c_[R, est_toit[ti]]  # (4e colonne : point du toit, pour le tri de bloc.py)
    # scène des toits : bloc.py y lit, à la verticale de chaque point gardé, la hauteur du toit posé
    sc = o3d.t.geometry.RaycastingScene()
    m = o3d.t.geometry.TriangleMesh()
    m.vertex.positions = o3d.core.Tensor(V.astype(np.float32))
    m.triangle.indices = o3d.core.Tensor(TT.astype(np.int32))
    sc.add_triangles(m)
    return R, RN, sc


def boucles_de_bord(T):
    """Boucles de bord d'un maillage (triangles T) : arêtes ORIENTÉES (sens de leur triangle) dont l'arête opposée n'existe
    pas, enchaînées en boucles SIMPLES. Un sommet de degré 4 (deux trous qui se touchent en un point, boucle en huit) a
    deux arêtes de bord sortantes : la marche garde chaque arête une seule fois et, dès qu'elle repasse par un sommet déjà
    sur son chemin, détache la boucle simple ainsi fermée (23/11/2026 : la version d'avant ne suivait que la première
    arête sortante et abandonnait toute boucle qui repassait par un sommet : ces trous restaient ouverts).
    Rend (boucles fermées (listes de sommets), nombre d'arêtes de bord restées en chemin ouvert)."""
    e = np.r_[T[:, [0, 1]], T[:, [1, 2]], T[:, [2, 0]]].astype(np.int64)
    n = int(T.max()) + 1 if len(T) else 0
    key = e[:, 0] * n + e[:, 1]
    rev = e[:, 1] * n + e[:, 0]
    border = e[~np.isin(key, rev)]
    nxt = {}
    for a, b in border:
        nxt.setdefault(int(a), []).append(int(b))
    loops = []
    ouvertes = 0
    for a0 in list(nxt.keys()):
        while nxt.get(a0):
            path = [a0]
            pos = {a0: 0}
            cur = a0
            while True:
                nb = nxt.get(cur)
                if not nb:  # (chemin ouvert : arête partagée par plus de deux triangles, bord incohérent)
                    ouvertes += len(path) - 1
                    break
                cur = nb.pop()
                if cur in pos:  # boucle simple fermée : de la première visite de cur jusqu'ici
                    i = pos[cur]
                    loops.append(path[i:])
                    for v in path[i + 1:]:
                        del pos[v]
                    path = path[: i + 1]
                    if cur == a0 and len(path) == 1:
                        break
                    continue
                pos[cur] = len(path)
                path.append(cur)
    return loops, ouvertes


def close_holes(mesh, max_edges, stats=None):
    """Bouche les TROUS (boucles de bord de moins de max_edges arêtes), en éventail depuis leur centre. Un trou se
    reconnaît à son sens : son aire vectorielle (arêtes orientées) est opposée à la normale des triangles qui le bordent ;
    le bord extérieur d'un morceau (bord du bloc, petit morceau isolé, pièce collée par un seul sommet) va dans le sens de
    sa surface et reste ouvert."""
    V = np.asarray(mesh.vertices)
    T = np.asarray(mesh.triangles)
    if not len(T):
        return mesh
    loops, ouvertes = boucles_de_bord(T)
    # normale (non normalisée) des triangles, sommée par sommet : sens de la surface autour d'une boucle
    fn = np.cross(V[T[:, 1]] - V[T[:, 0]], V[T[:, 2]] - V[T[:, 0]])
    vn = np.zeros_like(V)
    for k in range(3):
        np.add.at(vn, T[:, k], fn)
    newV, newT = [], []
    n = len(V)
    nb_trous = nb_complexes = 0
    for loop in loops:
        if len(loop) < 3 or len(loop) > max_edges:
            continue
        P = V[loop]
        c = P.mean(0)
        Q = P - c
        aire = 0.5 * np.cross(Q, np.roll(Q, -1, 0)).sum(0)
        if float(aire @ vn[loop].sum(0)) >= 0:  # (bord extérieur d'un morceau)
            continue
        nb_trous += 1
        nb_complexes += len(set(loop)) < len(loop)
        ci = n + len(newV)
        newV.append(c)
        # Le trou se ferme dans le sens INVERSE du bord (les triangles bordent le trou de l'autre côté).
        for i in range(len(loop)):
            newT.append((loop[(i + 1) % len(loop)], loop[i], ci))
    if stats is not None:
        stats.update({'boucles': len(loops), 'trous_bouches': nb_trous, 'aretes_ouvertes': ouvertes})
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
    head = caps(d)
    # Eau (classe 9) : surface des lacs, gardée comme le sol.
    keep |= c == 9
    # Ponts (classe 17, « tablier de pont » de l'IGN) : gardés comme le sol (24/11/2026, Edgar, devant Relief Maps : le pont
    # de la route au-dessus de la piste de Courchevel 1650 manquait, « chez eux la route est continue » ; 3 367 points de
    # tablier sur ce pont, jetés jusque-là). PONTS=0 : sans.
    if os.environ.get('PONTS', '1') == '1':
        keep |= c == 17
    # ESSAI (BATI_POISSON=1, 22/11/2026, Edgar : « comment Relief Maps a ses bâtiments en relief sans paroi verticale ? ») :
    # les points des bâtiments (classe 6) reconstruits AVEC le sol, comme la roche, au lieu des murs extrudés de batiments.py.
    # BATI_POISSON=2 (« surface unique, toits posés », 23/11/2026, Edgar devant Relief Maps : « la surface est bien
    # comprise et il n'y a rien en dessous de la gare… peut-être un mix où tu arrives à poser les toits ») : même surface
    # unique, mais les points du TOIT sont remplacés par des points semés sur les toits à pans de batiments.py (faîtages et
    # pans nets) ; façades, dessous, sol : les points mesurés. Une seule règle partout, pas de mur extrudé.
    # Depuis le 23/11/2026 (validé par Edgar) : le MIX (3 : surface unique, toit des points mesurés, murs de batiments.py
    # semés là où la façade n'a pas été vue) par défaut ; BATI_POISSON=0 : murs extrudés de batiments.py seuls.
    bati_mode = os.environ.get('BATI_POISSON', '3')
    bati_poisson = bati_mode in ('1', '2', '3')
    if bati_poisson:
        keep |= c == 6
    # ESSAI (ARBRES_MAILLAGE=1, 22/11/2026, Edgar : « faire exactement comme Relief Maps ») : la végétation moyenne et haute
    # (classes 4, 5) reconstruite AVEC le sol : chaque arbre devient un volume du relief, à sa vraie taille, visible de loin
    # comme le reste du maillage (au lieu des arbres posés un par un).
    if os.environ.get('ARBRES_MAILLAGE') == '1':
        keep |= (c == 4) | (c == 5)
    ox, oy, oz = (ex0 + ex1) / 2, (ey0 + ey1) / 2, float(np.median(z[keep]))
    P = np.c_[x[keep] - ox, y[keep] - oy, z[keep] - oz]
    ang, ps = d['ang'][keep], d['ps'][keep]
    Psol = P[c[keep] == 2]  # (sol mesuré, repère local : sol_z des bâtiments)
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
    toits_poses = None
    if bati_mode in ('2', '3'):
        toits_poses = toits_semes(x, y, z, c, d, head, ex0, ey0, ex1, ey1, ox, oy, oz, murs=bati_mode == '3')
        if toits_poses is not None and bati_mode == '3':
            R4, RN4, scn = toits_poses
            # points de guidage des murs : seulement là où rien n'a été mesuré à moins de 0,7 m
            dd3, _ = cKDTree(P).query(R4[:, :3], k=1, distance_upper_bound=0.7, workers=-1)
            # (Edgar, 23/11 au soir : « la surface unique gère mieux le toit que le mix ; le mix a une meilleure façade » :
            # le toit reste celui des points mesurés ; seuls les murs guident)
            g3 = (R4[:, 3] < 0.5) & ~np.isfinite(dd3)
            toits_poses = (R4[g3, :3], RN4[g3], scn)
        if toits_poses is not None and bati_mode == '2':
            # points mesurés du toit retirés (classe 6 de 0,8 m sous le toit posé à 3 m au-dessus : cheminées, neige) : le
            # toit posé les remplace ; façades, dessous et sol gardés
            nk = int(keep.sum())
            c6 = np.nonzero(c[keep] == 6)[0]
            Q = P[c6]
            r = toits_poses[2].cast_rays(o3d.core.Tensor(np.c_[Q[:, 0], Q[:, 1], Q[:, 2] + 50,
                                                                  np.zeros(len(Q)), np.zeros(len(Q)), -np.ones(len(Q))].astype(np.float32)))
            th = r['t_hit'].numpy()
            dz = Q[:, 2] - (Q[:, 2] + 50 - th)
            garde = np.ones(len(P), bool)
            garde[c6[np.isfinite(th) & (dz > -0.8) & (dz < 3.0)]] = False
            assert len(P) >= nk
            P, ang, ps = P[garde], ang[garde], ps[garde]
            if n_fill:
                n_fill = int(garde[-n_fill:].sum())
    pc = o3d.geometry.PointCloud(o3d.utility.Vector3dVector(P))
    pc.estimate_normals(o3d.geometry.KDTreeSearchParamHybrid(radius=1.2, max_nn=24))
    N = np.asarray(pc.normals)
    if n_fill:
        N[-n_fill:] = (0, 0, 1)
    S = vers_capteur(ang, ps, head)
    N[(N * S).sum(1) < 0] *= -1
    if toits_poses is not None and len(toits_poses[0]):
        P = np.r_[P, toits_poses[0]]
        N = np.r_[N, toits_poses[1]]
        pc = o3d.geometry.PointCloud(o3d.utility.Vector3dVector(P))
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
    trous = {}
    mesh = close_holes(mesh, 800, trous)
    # 4 ter. BÂTIMENTS (batiments.py) : murs droits et toits mesurés, ajoutés à la surface du bloc (le sol passe dessous,
    # interpolé). Leurs murs sont marqués (canopée = 253) : le moteur les teinte en neutre.
    from scipy.interpolate import LinearNDInterpolator as _LI
    from batiments import batiments
    gsrc = Psol
    gsrc = gsrc[:: max(1, len(gsrc) // 300000)]
    _f = _LI(gsrc[:, :2], gsrc[:, 2])

    def sol_z(X, Y):
        zz = _f(X - ox, Y - oy)
        bad = ~np.isfinite(zz)
        if bad.any():
            from scipy.interpolate import NearestNDInterpolator
            zz[bad] = NearestNDInterpolator(gsrc[:, :2], gsrc[:, 2])(X[bad] - ox, Y[bad] - oy)
        return zz + oz

    bati_stats = {}
    bati_ctrl = None
    if bati_poisson:
        BV, BT, BM = np.zeros((0, 3)), np.zeros((0, 3), np.int64), np.zeros(0, bool)
        head_extra = {'batiments': {'mode': {'1': 'surface unique', '2': 'surface unique, toits posés',
                                             '3': 'surface unique, murs guidés (mix)'}[bati_mode]}}
    else:
        # (version 5, 23/11/2026 : direction de chaque point vers l'avion : dessous mesurés des plateformes et des gares,
        # contrôles automatiques de chaque bâtiment, replis sur une forme sûre)
        capteur = vers_capteur(d['ang'], d['ps'], head)
        tb = time.time()
        BV, BT, BM = batiments(x, y, z, c, sol_z, ex0, ey0, ex1, ey1, ox, oy, oz, stats=bati_stats, capteur=capteur)
        chrono['duree_batiments'] = time.time() - tb
        # contrôles de tout le bloc (controle_batiments.py) : résumé dans l'en-tête, détail dans le rapport
        import controle_batiments as cbat
        tb = time.time()
        bati_ctrl = cbat.controle(BV, BT, BM, x, y, z, c, capteur, sol_z, ex0, ey0, ex1, ey1, ox, oy, oz)
        chrono['duree_controle_batiments'] = time.time() - tb
    n_bat_v = len(BV)
    n_tri_sol = len(mesh.triangles)  # (triangles du sol ; ceux des bâtiments suivent)
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
    if bati_poisson:
        # surface unique : faces raides ou tournées vers le bas dans l'emprise d'un bâtiment (plus 1,5 m) = murs, dessous :
        # teinte neutre comme les murs de batiments.py (la photo prise d'en haut n'a rien à y montrer)
        import controle_batiments as cbat
        from scipy import ndimage as _nd
        lab_b, _, _ = cbat.emprises(x, y, z, c, ex0, ey0, ex1, ey1)
        pres = _nd.binary_dilation(lab_b > 0, iterations=3)
        mesh.compute_vertex_normals()
        nz = np.asarray(mesh.vertex_normals)[:, 2]
        bi = ((V[:, 0] + ox - ex0) / cbat.CELL).astype(int).clip(0, pres.shape[1] - 1)
        bj = ((V[:, 1] + oy - ey0) / cbat.CELL).astype(int).clip(0, pres.shape[0] - 1)
        canopy[pres[bj, bi] & (nz < 0.6)] = 253
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
    is_bat = np.arange(len(T)) >= n_tri_sol
    T = T[inside]
    is_bat = is_bat[inside]
    # petits morceaux isolés (moins de 200 triangles) : écartés, SAUF les bâtiments (22/11/2026 : chaque pan de mur, quatre
    # sommets à lui pour une normale plate, est un morceau de 2 triangles : TOUS les murs étaient jetés ici, il ne restait
    # que des toits flottants)
    from scipy.sparse import coo_matrix
    from scipy.sparse.csgraph import connected_components
    e = np.r_[T[:, [0, 1]], T[:, [1, 2]]]
    ncomp, lab = connected_components(coo_matrix((np.ones(len(e), np.int8), (e[:, 0], e[:, 1])), shape=(nv, nv)), directed=False)
    tl = lab[T[:, 0]]
    cnt = np.bincount(tl, minlength=ncomp)
    T = T[(cnt[tl] >= 200) | is_bat]
    used = np.unique(T)
    remap = np.full(nv, -1, np.int64); remap[used] = np.arange(len(used))
    T = remap[T].astype(np.uint32)
    W = W[used].astype(np.float32); Nv = Nv[used]; ao = ao[used]; canopy = canopy[used]
    head_json = {
        'z': 16, 'x': x16, 'y': y16, 'x12': x12, 'y12': y12, 'k': k, 'latc': latc,
        'emprise': [float(cx0), float(cy0), float(cx1), float(cy1)],
        'version': 2, 'sommets': int(len(W)), 'triangles': int(len(T)), 'batiments_sommets': int(n_bat_v), 'points': int(len(P)), 'points_ajoutes': int(n_fill), 'raide': round(raide, 4), 'profondeur': depth, 'trous': trous,
        'secondes': {a: round(b, 1) for a, b in chrono.items()} | {'total': round(time.time() - T0, 1)}
    }
    if bati_poisson:
        head_json.update(head_extra)
    if bati_ctrl is not None:
        # (contrôles sur la fenêtre de données, marge comprise ; le détail par bâtiment va dans le rapport)
        head_json['batiments'] = {'version': 5, 'controles': bati_ctrl[0], 'replis': bati_stats.get('niveaux', {}),
                                  'avec_dessous': bati_stats.get('avec_dessous', 0),
                                  'defauts_restants': bati_stats.get('defauts_restants', {})}
    os.makedirs(sortie, exist_ok=True)
    tmp = out + '.part'
    with open(tmp, 'wb') as f:
        f.write((json.dumps(head_json) + '\n').encode())
        f.write(W.tobytes()); f.write(Nv.astype(np.float32).tobytes()); f.write(ao.tobytes()); f.write(canopy.tobytes()); f.write(T.tobytes())
    os.replace(tmp, out)
    if bati_ctrl is not None:
        # rapport des bâtiments (à côté du bloc, ignoré par paquet-build.ts qui ne lit que les .blk)
        with open(out[:-4] + '.batiments.json', 'w') as f:
            json.dump({'bloc': [x16, y16], 'resume': bati_ctrl[0], 'defauts': bati_ctrl[1],
                       'batiments': bati_stats.get('par_batiment', [])}, f, ensure_ascii=False, indent=1)
    print(json.dumps(head_json), flush=True)


if __name__ == '__main__':
    main()
