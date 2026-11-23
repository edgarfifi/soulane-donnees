# Relief HD : CONTRÔLES AUTOMATIQUES des bâtiments d'un bloc (agent du cloud, 23/11/2026). Edgar : « je ne vais pas vérifier
# tous les bâtiments qui existent : il faut qu'il n'y ait JAMAIS de défaut ». Chaque bâtiment est jugé sur ce que le LiDAR a
# MESURÉ, sans regarder le dessin :
# - rideau : un mur (ou une rive, une sous-face, un dessous) que des rayons du laser ont TRAVERSÉ. Entre un point mesuré et
#   l'avion, rien de solide : si le rayon d'un point du sol (ou de la végétation) recoupe un mur, ce mur est là où le LiDAR a
#   vu du vide (plateforme, gare ou passerelle au-dessus de la pente, fermée par un mur descendu jusqu'au sol) ;
# - faces retournées ou repliées : rayon lancé de chaque triangle le long de sa normale ; s'il touche le DOS d'une face, le
#   triangle regarde vers l'intérieur d'un volume (face retournée, pli, recoupement) ; toit dont la normale descend ;
# - faces dégénérées (aire quasi nulle) et aiguilles (angle de moins de 1,5° sur plus de 0,3 m) ;
# - jours : arêtes de bord (après soudure) au-dessus du sol, sur aucune autre arête de bord (raccords en T exclus) ;
# - bâtiment flottant (aucun sommet à moins de 0,3 m du sol) ou enterré (toit à moins de 1 m au-dessus du sol) ;
# - toit trop haut ou trop bas : écart entre le toit et le point le plus haut de chaque case de 0,5 m mesurée ;
# - triangles par bâtiment.
# Sert à deux choses : (1) dans batiments.py, juger chaque bâtiment au moment de le construire et se REPLIER sur une forme
# plus sûre s'il échoue ; (2) dans bloc.py et au banc, compter les défauts de tout le bloc (en-tête du bloc, rapport).
# Les fonctions ne savent rien de la façon dont le maillage a été fait : elles jugent aussi la version 4 (avant / après).
import numpy as np
from scipy import ndimage
from scipy.spatial import cKDTree

CELL = 0.5
CLASSES_LIBRES = (2, 3, 4, 5, 9)  # sol, végétation, eau : points dont le rayon vers l'avion prouve du vide
RAYON_LIBRE_DEBUT = 1.0  # m : le rayon n'est compté qu'à partir de là (un mur posé à quelques décimètres près n'est pas un rideau)
RAYON_LIBRE_PRES = 10.0  # m : points libres gardés à moins de ça d'une emprise de bâtiment (vu de dessus)
RIDEAU_COUPS = 2  # rayons sur un même triangle pour le compter traversé
RAYON_BORD = 1.5  # m : points libres sous le bord d'une emprise (moins de ça à l'intérieur) : écartés
RIDEAU_BAS = 3.0  # m : passages plus bas que ça au-dessus du sol : « pied » (retrait du rez-de-chaussée), pas rideau
ANGLE_TOL = 4.0  # degrés : marge sur la direction de l'avion (traverse)


def emprises(x, y, z, c, ex0, ey0, ex1, ey1):
    """Emprises des bâtiments (comme batiments.py) : cases de 0,5 m avec des points de la classe 6, fermeture d'une case,
    trous bouchés, morceaux étiquetés. Rend (lab (ny, nx), n, top : point le plus haut de chaque case (−inf sans point))."""
    b = c == 6
    nx = int((ex1 - ex0) / CELL) + 1
    ny = int((ey1 - ey0) / CELL) + 1
    top = np.full((ny, nx), -np.inf)
    if b.any():
        ix = ((x[b] - ex0) / CELL).astype(int).clip(0, nx - 1)
        iy = ((y[b] - ey0) / CELL).astype(int).clip(0, ny - 1)
        np.maximum.at(top, (iy, ix), z[b])
    occ = np.isfinite(top)
    occ = ndimage.binary_closing(occ, iterations=1)
    occ = ndimage.binary_fill_holes(occ)
    lab, n = ndimage.label(occ)
    return lab, n, top


def _aires(V, T):
    a, b, c = V[T[:, 0]], V[T[:, 1]], V[T[:, 2]]
    n = np.cross(b - a, c - a)
    return a, b, c, n, 0.5 * np.linalg.norm(n, axis=1)


def formes(V, T):
    """Par triangle : dégénéré (aire < 1e-4 m²), aiguille (plus petit angle < 1,5° et plus grand côté > 0,3 m)."""
    if not len(T):
        return np.zeros(0, bool), np.zeros(0, bool)
    a, b, c, n, ar = _aires(V, T)
    L = np.stack([np.linalg.norm(b - c, axis=1), np.linalg.norm(c - a, axis=1), np.linalg.norm(a - b, axis=1)], 1)
    lmax = L.max(1)
    deg = ar < 1e-4
    # sinus du plus petit angle = 2 × aire / (produit des deux plus grands côtés)
    Ls = np.sort(L, 1)
    sin_min = 2 * ar / np.maximum(Ls[:, 1] * Ls[:, 2], 1e-12)
    aig = ~deg & (sin_min < np.sin(np.radians(1.5))) & (lmax > 0.3)
    return deg, aig


def retournees(V, T, M, scene_tout=None, groupe=None):
    """Par triangle : face retournée ou repliée. Toit (sommets non « mur ») dont la normale descend, ou rayon parti du centre
    du triangle le long de sa normale qui touche d'abord le DOS d'une face (on était à l'intérieur d'un volume). groupe :
    bâtiment de chaque triangle ; le dos touché doit être du même bâtiment (deux bâtiments voisins qui se recoupent :
    faces cachées, pas un défaut de forme)."""
    import open3d as o3d
    if not len(T):
        return np.zeros(0, bool)
    a, b, c, n, ar = _aires(V, T)
    ok = ar > 1e-6
    nn = np.zeros_like(n)
    nn[ok] = n[ok] / (2 * ar[ok])[:, None]
    toit = ~M[T].any(1)
    bad = toit & ok & (nn[:, 2] < 0.05)
    if scene_tout is None:
        scene_tout = _scene(V, T)
    sc, Vs, Ts = scene_tout
    cen = (a + b + c) / 3
    o = cen + nn * 0.02
    r = sc.cast_rays(o3d.core.Tensor(np.c_[o, nn].astype(np.float32)))
    th = r['t_hit'].numpy()
    hit = np.isfinite(th) & ok & (th < 30)
    pid = r['primitive_ids'].numpy()
    # normale de la face touchée (dans la scène), comparée au sens du rayon
    hn = r['primitive_normals'].numpy()
    dos = hit & ((hn * nn).sum(1) > 0.05)
    if groupe is not None:
        dos &= groupe[np.minimum(pid, len(T) - 1)] == groupe
    return bad | dos


def _scene(V, T):
    import open3d as o3d
    m = o3d.t.geometry.TriangleMesh()
    m.vertex.positions = o3d.core.Tensor(np.asarray(V, np.float32))
    m.triangle.indices = o3d.core.Tensor(np.asarray(T, np.int32))
    sc = o3d.t.geometry.RaycastingScene()
    sc.add_triangles(m)
    return sc, V, T


def jours(V, T, sol_z_local, tol=0.08, pas=0.1, dans=None):
    """Jours d'un maillage : arêtes de bord (sommets soudés au millimètre) au-dessus du sol (+0,2 m) dont des points sont à plus
    de tol de toute autre arête de bord (un raccord en T, arête longue d'un côté et courtes de l'autre, n'est pas un jour).
    sol_z_local(X, Y) : sol dans le repère du maillage ; dans(X, Y) : facultatif, faux au bord de la fenêtre de données (un
    bâtiment coupé par la fenêtre y est ouvert, hors du bloc). Rend (longueur des jours en m, milieux des arêtes en cause)."""
    if not len(T):
        return 0.0, np.zeros((0, 3))
    q = np.round(V * 1000).astype(np.int64)
    _, inv = np.unique(q, axis=0, return_inverse=True)
    inv = inv.ravel()
    TT = inv[T]
    TT = TT[(TT[:, 0] != TT[:, 1]) & (TT[:, 1] != TT[:, 2]) & (TT[:, 0] != TT[:, 2])]
    P = np.zeros((inv.max() + 1, 3))
    P[inv] = V
    e = np.sort(np.r_[TT[:, [0, 1]], TT[:, [1, 2]], TT[:, [2, 0]]], 1)
    u, cnt = np.unique(e, axis=0, return_counts=True)
    b = u[cnt == 1]
    if not len(b):
        return 0.0, np.zeros((0, 3))
    A, B = P[b[:, 0]], P[b[:, 1]]
    mid = (A + B) / 2
    haut = mid[:, 2] > sol_z_local(mid[:, 0], mid[:, 1]) + 0.2
    if dans is not None:
        haut &= dans(mid[:, 0], mid[:, 1])
    if not haut.any():
        return 0.0, np.zeros((0, 3))
    # échantillons de toutes les arêtes de bord ; ceux des arêtes hautes cherchent une AUTRE arête de bord tout près
    L = np.linalg.norm(B - A, axis=1)
    k = np.maximum(1, np.ceil(L / pas).astype(int))
    eid = np.repeat(np.arange(len(b)), k)
    f = (np.arange(k.sum()) - np.repeat(np.cumsum(k) - k, k) + 0.5) / np.repeat(k, k)
    S = A[eid] + (B - A)[eid] * f[:, None]
    tr = cKDTree(S)
    hs = haut[eid]
    dd, ii = tr.query(S[hs], k=8, distance_upper_bound=tol)
    autre = (eid[np.minimum(ii, len(eid) - 1)] != eid[hs][:, None]) & np.isfinite(dd)
    trou = ~autre.any(1)
    Lg = np.bincount(eid[hs][trou], minlength=len(b)) * (L / k)
    sel = Lg > 0
    return float(Lg.sum()), mid[sel]


def _coupe(sc, o, d):
    """Rayons (départs o, directions d) sur la scène sc : (touché, distance, triangle)."""
    import open3d as o3d
    th, pid = [], []
    for i in range(0, len(o), 2_000_000):
        r = sc.cast_rays(o3d.core.Tensor(np.c_[o[i:i + 2_000_000], d[i:i + 2_000_000]].astype(np.float32)))
        th.append(r['t_hit'].numpy())
        pid.append(r['primitive_ids'].numpy())
    th = np.concatenate(th) if th else np.zeros(0)
    pid = np.concatenate(pid) if pid else np.zeros(0, np.int64)
    return np.isfinite(th) & (th < 120), th, pid


def traverse(sc, depart, direction, delta=ANGLE_TOL):
    """Rayons libres qui traversent la scène sc, de façon SÛRE : le rayon touche aussi quand on l'incline de delta degrés
    de chaque côté (l'angle de visée enregistré ne donne la direction de l'avion qu'à quelques degrés près : roulis ;
    sans cette marge, chaque bord de toit paraît traversé par les rayons des points du sol à son pied). Départ décalé de
    RAYON_LIBRE_DEBUT. Rend (traversé, distance, triangle) du rayon central."""
    o = depart + direction * RAYON_LIBRE_DEBUT
    h, th, pid = _coupe(sc, o, direction)
    if not h.any() or delta <= 0:
        return h, th, pid
    i = np.nonzero(h)[0]
    d = direction[i]
    u = np.cross(d, [0.0, 0.0, 1.0])
    nu = np.linalg.norm(u, axis=1, keepdims=True)
    u = np.where(nu > 1e-6, u / np.maximum(nu, 1e-9), [1.0, 0.0, 0.0])
    v = np.cross(u, d)
    tg = np.tan(np.radians(delta))
    tous = np.ones(len(i), bool)
    for e in (u, -u, v, -v):
        dd = d + tg * e
        dd /= np.linalg.norm(dd, axis=1, keepdims=True)
        hh, _, _ = _coupe(sc, o[i], dd)
        tous &= hh
    h2 = np.zeros(len(h), bool)
    h2[i[tous]] = True
    return h2, th, pid


def rideaux(V, T, M, depart, direction):
    """Rayons libres (point mesuré → avion) qui traversent SÛREMENT (traverse) un mur : triangles dont tous les sommets sont
    « mur » (murs, rives, sous-faces, dessous), SANS traverser aussi le toit (un rayon qui passe au travers du toit dit que
    le toit couvre du vide : défaut du toit, compté à part). Rend (coups par triangle, points de passage, triangle de chaque
    passage, points de passage au travers des toits)."""
    coups = np.zeros(len(T), np.int64)
    murs = np.nonzero(M[T].all(1))[0]
    toits = np.nonzero(~M[T].any(1))[0]
    vide = np.zeros((0, 3))
    if not len(depart):
        return coups, np.zeros((0, 3)), np.zeros(0, np.int64), vide
    o = depart + direction * RAYON_LIBRE_DEBUT
    ht = np.zeros(len(depart), bool)
    if len(toits):
        ht, tht, _ = traverse(_scene(V, T[toits])[0], depart, direction)
        vide = o[ht] + direction[ht] * tht[ht][:, None]
    if not len(murs):
        return coups, np.zeros((0, 3)), np.zeros(0, np.int64), vide
    h, th, pid = traverse(_scene(V, T[murs])[0], depart, direction)
    h &= ~ht
    np.add.at(coups, murs[pid[h]], 1)
    return coups, o[h] + direction[h] * th[h][:, None], murs[pid[h]], vide


def aire_traversee(pts, pas=1.0, mini=RIDEAU_COUPS):
    """Surface de mur traversée par des rayons (m²) : cubes de 1 m qui reçoivent au moins `mini` passages (indépendant de la
    finesse du maillage). Rend (aire, centres des cubes)."""
    if not len(pts):
        return 0.0, np.zeros((0, 3))
    q = np.floor(pts / pas).astype(np.int64)
    u, cnt = np.unique(q, axis=0, return_counts=True)
    u = u[cnt >= mini]
    return float(len(u) * pas * pas), (u + 0.5) * pas


def rayons_libres(x, y, z, c, capteur, lab, ex0, ey0, ox, oy, oz, top=None):
    """Points dont le rayon vers l'avion prouve du vide autour des bâtiments : classes CLASSES_LIBRES, à moins de
    RAYON_LIBRE_PRES d'une emprise, plus bas que le toit le plus haut de l'emprise voisine. Rend (départs (repère local),
    directions, emprise voisine)."""
    ny, nx = lab.shape
    lib = np.isin(c, CLASSES_LIBRES)
    if not lib.any() or lab.max() == 0:
        return np.zeros((0, 3)), np.zeros((0, 3)), np.zeros(0, np.int64)
    dist, (nr, nc) = ndimage.distance_transform_edt(lab == 0, return_indices=True)
    near = lab[nr, nc]
    near[dist * CELL > RAYON_LIBRE_PRES] = 0
    idx = np.nonzero(lib)[0]
    ix = ((x[idx] - ex0) / CELL).astype(int).clip(0, nx - 1)
    iy = ((y[idx] - ey0) / CELL).astype(int).clip(0, ny - 1)
    k = near[iy, ix]
    if top is not None:
        zmax = ndimage.maximum(np.where(np.isfinite(top), top, -1e9), lab, np.arange(lab.max() + 1))
        zmax = np.asarray(zmax)
        keep = (k > 0) & (z[idx] < zmax[k] - 1.0)
    else:
        keep = k > 0
    idx, k = idx[keep], k[keep]
    # (points sous le bord d'une emprise, à moins de RAYON_BORD à l'intérieur : le mur y est posé à un mètre près, un rayon
    # raide parti de là le recoupe haut sans que ce soit un rideau ; écartés)
    din = ndimage.distance_transform_edt(lab > 0) * CELL
    ix = ((x[idx] - ex0) / CELL).astype(int).clip(0, nx - 1)
    iy = ((y[idx] - ey0) / CELL).astype(int).clip(0, ny - 1)
    dd = din[iy, ix]
    keep = ~((dd > 0) & (dd <= RAYON_BORD))
    idx, k = idx[keep], k[keep]
    keep = capteur[idx, 2] > 0.3  # (visée de plus de ~73° sur l'horizontale : impossible, ligne de vol mal connue)
    idx, k = idx[keep], k[keep]
    P = np.c_[x[idx] - ox, y[idx] - oy, z[idx] - oz]
    return P, capteur[idx], k


def batiment_de(V, T, lab, ex0, ey0, ox, oy):
    """Bâtiment de chaque triangle : morceau d'un seul tenant du maillage (sommets soudés au millimètre : toit, rive,
    sous-face, murs et dessous d'un bâtiment se touchent), numéroté par l'emprise la plus présente sous ses triangles
    (deux bâtiments soudés l'un à l'autre n'en font qu'un)."""
    from scipy.sparse import coo_matrix
    from scipy.sparse.csgraph import connected_components
    ny, nx = lab.shape
    if not len(T):
        return np.zeros(0, np.int64)
    q = np.round(V * 1000).astype(np.int64)
    _, inv = np.unique(q, axis=0, return_inverse=True)
    inv = inv.ravel()
    TT = inv[T]
    nv = int(inv.max()) + 1
    e = np.r_[TT[:, [0, 1]], TT[:, [1, 2]]]
    _, comp = connected_components(coo_matrix((np.ones(len(e), np.int8), (e[:, 0], e[:, 1])), shape=(nv, nv)),
                                   directed=False)
    ct = comp[TT[:, 0]]
    cen = V[T].mean(1)
    _, (nr, nc) = ndimage.distance_transform_edt(lab == 0, return_indices=True)
    ix = ((cen[:, 0] + ox - ex0) / CELL).astype(int).clip(0, nx - 1)
    iy = ((cen[:, 1] + oy - ey0) / CELL).astype(int).clip(0, ny - 1)
    kt = lab[nr[iy, ix], nc[iy, ix]]
    # emprise la plus présente de chaque morceau
    o = np.lexsort((kt, ct))
    pair = ct[o] * (int(kt.max()) + 1) + kt[o]
    u, cnt = np.unique(pair, return_counts=True)
    cu, ku = u // (int(kt.max()) + 1), u % (int(kt.max()) + 1)
    best = {}
    for c_, k_, n_ in zip(cu.tolist(), ku.tolist(), cnt.tolist()):
        if n_ > best.get(c_, (0, 0))[1]:
            best[c_] = (k_, n_)
    kc = np.array([best[c_][0] for c_ in range(int(ct.max()) + 1)])
    # (deux morceaux sur la même emprise : le plus grand garde son numéro, les autres prennent des numéros au-delà)
    tail = np.bincount(ct)
    vu = {}  # emprise → morceau qui la garde
    nxt = int(lab.max()) + 1
    for c_ in np.argsort(-tail):
        k_ = kc[c_]
        if k_ in vu:
            kc[c_] = nxt
            nxt += 1
        else:
            vu[k_] = c_
    return kc[ct]


def ecarts_toit(V, T, M, top, lab, ex0, ey0, ox, oy, oz):
    """Écart toit − point le plus haut de chaque case de 0,5 m mesurée (classe 6), le toit lu par un rayon vertical sur les
    triangles du toit. Rend (écart par case touchée, emprise de la case)."""
    import open3d as o3d
    toit = ~M[T].any(1)
    if not toit.any():
        return np.zeros(0), np.zeros(0, np.int64)
    sc = _scene(V, T[toit])[0]
    iy, ix = np.nonzero(np.isfinite(top) & (lab > 0))
    X = ex0 + (ix + 0.5) * CELL - ox
    Y = ey0 + (iy + 0.5) * CELL - oy
    Z = top[iy, ix] - oz + 30.0
    r = sc.cast_rays(o3d.core.Tensor(np.c_[X, Y, Z, np.zeros_like(X), np.zeros_like(X), -np.ones_like(X)].astype(np.float32)))
    th = r['t_hit'].numpy()
    h = np.isfinite(th)
    return (Z[h] - th[h]) - (top[iy, ix][h] - oz), lab[iy[h], ix[h]]


def controle(V, T, M, x, y, z, c, capteur, sol_z, ex0, ey0, ex1, ey1, ox, oy, oz, signales=None):
    """Contrôle de TOUS les bâtiments d'un bloc (maillage V, T, M du repère local de batiments()). Rend (résumé du bloc,
    liste des bâtiments en défaut). capteur : direction vers l'avion de chaque point (bloc.vers_capteur), ou None (pas de
    contrôle des rideaux). signales : dict facultatif, reçoit les indices des triangles en défaut par sorte (rendus)."""
    lab, n, top = emprises(x, y, z, c, ex0, ey0, ex1, ey1)
    V = np.asarray(V, np.float64)
    T = np.asarray(T, np.int64)
    M = np.asarray(M, bool)
    res = {'batiments': 0, 'triangles': int(len(T))}
    if not len(T):
        return res, []
    kb = batiment_de(V, T, lab, ex0, ey0, ox, oy)

    def sol_local(X, Y):
        return sol_z(X + ox, Y + oy) - oz

    def dans_local(X, Y):
        return (X + ox > ex0 + 1) & (X + ox < ex1 - 1) & (Y + oy > ey0 + 1) & (Y + oy < ey1 - 1)

    deg, aig = formes(V, T)
    ret = retournees(V, T, M, groupe=kb)
    a, b, cc, nrm, ar = _aires(V, T)
    # rideaux
    coups = np.zeros(len(T), np.int64)
    if capteur is not None:
        P, D, _ = rayons_libres(x, y, z, c, capteur, lab, ex0, ey0, ox, oy, oz, top)
        coups, passages, _, vides = rideaux(V, T, M, P, D)
    else:
        passages = vides = np.zeros((0, 3))
    traverse = coups >= RIDEAU_COUPS
    # passages des rayons rangés par bâtiment (case d'emprise la plus proche)
    _, (nr_, nc_) = ndimage.distance_transform_edt(lab == 0, return_indices=True)

    def kde(pp):
        if not len(pp):
            return np.zeros(0, np.int64)
        pix = ((pp[:, 0] + ox - ex0) / CELL).astype(int).clip(0, lab.shape[1] - 1)
        piy = ((pp[:, 1] + oy - ey0) / CELL).astype(int).clip(0, lab.shape[0] - 1)
        return lab[nr_[piy, pix], nc_[piy, pix]]
    kp, kv = kde(passages), kde(vides)
    # passages à moins de RIDEAU_BAS du sol : rez-de-chaussée en retrait, arcades, porches (mur posé un peu trop loin sous
    # un étage en saillie) : comptés à part du RIDEAU (mur au-dessus du vide, plus haut)
    hp = passages[:, 2] - sol_local(passages[:, 0], passages[:, 1]) if len(passages) else np.zeros(0)
    bas_ = hp < RIDEAU_BAS
    # toit
    ec, kec = ecarts_toit(V, T, M, top, lab, ex0, ey0, ox, oy, oz)
    if signales is not None:
        signales.update({'rideau': np.nonzero(traverse)[0], 'retournees': np.nonzero(ret)[0],
                         'aiguilles': np.nonzero(aig | deg)[0]})
    # par bâtiment
    ids = np.unique(kb[kb > 0])
    res['batiments'] = int(len(ids))
    defauts = []
    tot = {'rideau_m2': 0.0, 'rideau_rayons': 0, 'pied_m2': 0.0, 'toit_sur_vide_m2': 0.0, 'retournees': 0, 'degeneres': 0, 'aiguilles': 0, 'jours_m': 0.0,
           'flottants': 0, 'enterres': 0, 'toit_ecart_p90': [], 'toit_hors_1m': 0, 'toit_cases': 0}
    nb_def = {'rideau': 0, 'retournees': 0, 'aiguilles': 0, 'jours': 0, 'flottant': 0, 'enterre': 0, 'toit': 0}
    tri_par = []
    o = np.argsort(kb, kind='stable')
    st = np.searchsorted(kb[o], np.r_[ids, ids[-1] + 1] if len(ids) else [0])
    for i, k in enumerate(ids):
        sel = o[st[i]:st[i + 1]]
        Tk = T[sel]
        used = np.unique(Tk)
        Vk = V[used]
        sol_v = sol_local(Vk[:, 0], Vk[:, 1])
        d = {'k': int(k), 'triangles': int(len(sel))}
        tri_par.append(len(sel))
        d['rideau_m2'] = round(aire_traversee(passages[(kp == k) & ~bas_])[0], 1)
        d['rideau_rayons'] = int(((kp == k) & ~bas_).sum())
        d['pied_m2'] = round(aire_traversee(passages[(kp == k) & bas_])[0], 1)
        d['toit_sur_vide_m2'] = round(aire_traversee(vides[kv == k])[0], 1)
        d['retournees'] = int(ret[sel].sum())
        d['degeneres'] = int(deg[sel].sum())
        d['aiguilles'] = int(aig[sel].sum())
        remap = np.full(len(V), -1, np.int64)
        remap[used] = np.arange(len(used))
        jl, jm = jours(Vk, remap[Tk], sol_local, dans=dans_local)
        d['jours_m'] = round(jl, 1)
        d['flottant'] = bool((Vk[:, 2] - sol_v).min() > 0.3)
        roof = ~M[Tk].any(1)
        if roof.any():
            rz = np.median(V[Tk[roof]].mean(1)[:, 2] - sol_local(*V[Tk[roof]].mean(1)[:, :2].T))
            d['enterre'] = bool(rz < 1.0)
        else:
            d['enterre'] = False
        e = np.abs(ec[kec == k])
        if len(e):
            d['toit_ecart_p90'] = round(float(np.percentile(e, 90)), 2)
            d['toit_hors_1m'] = round(float((e > 1.0).mean()), 3)
            tot['toit_ecart_p90'].append(d['toit_ecart_p90'])
            tot['toit_hors_1m'] += int((e > 1.0).sum())
            tot['toit_cases'] += len(e)
        cen = Vk.mean(0)
        d['ou'] = [round(float(cen[0] + ox), 1), round(float(cen[1] + oy), 1), round(float(cen[2] + oz), 1)]
        for key in ('rideau_m2', 'rideau_rayons', 'pied_m2', 'toit_sur_vide_m2', 'retournees', 'degeneres', 'aiguilles', 'jours_m'):
            tot[key] += d[key]
        tot['flottants'] += d['flottant']
        tot['enterres'] += d['enterre']
        fl = []
        if d['rideau_m2'] >= 4.0:
            fl.append('rideau')
        if d['retournees'] > max(2, 0.002 * d['triangles']):
            fl.append('retournees')
        if d['aiguilles'] > max(2, 0.01 * d['triangles']):
            fl.append('aiguilles')
        if d['jours_m'] >= 0.5:
            fl.append('jours')
        if d['flottant']:
            fl.append('flottant')
        if d['enterre']:
            fl.append('enterre')
        if d.get('toit_ecart_p90', 0) > 1.0:
            fl.append('toit')
        for f_ in fl:
            nb_def[f_] += 1
        if fl:
            d['defauts'] = fl
            defauts.append(d)
    res.update({k: (round(v, 1) if isinstance(v, float) else v) for k, v in tot.items() if k != 'toit_ecart_p90'})
    p = tot['toit_ecart_p90']
    res['toit_ecart_p90_median'] = round(float(np.median(p)), 2) if p else None
    res['toit_hors_1m'] = round(tot['toit_hors_1m'] / max(1, tot['toit_cases']), 4)
    del res['toit_cases']
    res['triangles_par_batiment_max'] = int(max(tri_par)) if tri_par else 0
    res['batiments_en_defaut'] = nb_def
    defauts.sort(key=lambda d: -(d['rideau_m2'] + 10 * d['jours_m'] + d['retournees'] + d['aiguilles']))
    return res, defauts
