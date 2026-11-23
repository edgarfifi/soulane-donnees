# Relief HD, phase 5 (plan § 5.2 a) : les BÂTIMENTS d'un bloc, en maillage, à partir des points classés « bâtiment »
# (classe 6) du LiDAR HD. Appelé par bloc.py (les bâtiments rejoignent la surface du bloc : niveaux de détail, occlusion,
# paquet).
#
# Version 4 (23/11/2026, Edgar : « sur certaines maisons on voit le contour des fenêtres, les balcons… comme Relief
# Maps ») : FAÇADES EN RELIEF, mesurées. L'avion du LiDAR HD vise en biais (jusqu'à ±29°) : une partie des points tombe
# sur les façades (23 % des points « bâtiment » de Courchevel 1850). Rien n'est dessiné : chaque creux, chaque saillie
# vient de ces points.
# - Emprise : cases de 0,5 m qui ont des points du bâtiment, réunies par voisinage (un bâtiment = un morceau d'au moins
#   8 m²), trous bouchés. Son contour est le BORD DU TOIT (vu d'en haut).
# - CONTOUR RÉGULARISÉ (`regularise`) : orientation dominante du bâtiment, côtés proches de cette orientation mis d'équerre
#   (les autres gardent leur direction mesurée), chaque côté posé sur la médiane de ses points du contour, côtés courts
#   absorbés, vrais décrochés gardés. Plus de zigzags dus aux cases de 0,5 m posées de biais. Repli sur le contour de
#   Douglas-Peucker (v3) si le résultat s'écarte trop du contour mesuré (`valide`).
# - TOIT EN PANS (v3) : la surface mesurée (hauteur la plus haute de chaque case) est découpée en pans plans (cases
#   voisines de même pente, sans marche) ; chaque pan reçoit le plan ajusté sur ses points.
# - MURS POSÉS LÀ OÙ LEURS POINTS LE DISENT : pour chaque côté du toit, les points des classes 6 et 1 à moins de 4 m du
#   côté, sous le bord du toit et au-dessus du sol ; le mur est sur la médiane de leur écart au bord du toit (vrai débord
#   du toit, au lieu du retrait fixe de 0,6 m de la v3). Coins communs aux deux murs voisins (intersection de leurs
#   lignes). Rive (tranche du toit) et sous-face entre le bord du toit et le haut du mur.
# - RELIEF DU MUR : carte de 0,5 m × 0,5 m sur le mur (écart médian des points de chaque case au plan du mur ; cases vides
#   comblées par leurs voisines, à plat au-delà de 2 m sans point) ; le mur est une grille de 0,5 m déplacée selon cette
#   carte : balcons en saillie, loggias et embrasures en creux. Bords de la grille (coins, haut, pied) à plat : les murs
#   voisins et la sous-face s'y raccordent sans jour.
# - Murs jusqu'à 0,5 m sous le sol (le sol, interpolé sous le bâtiment, ne laisse aucun jour).
# Sortie : sommets (L93 local), triangles, et un drapeau « mur » par sommet (murs, rives, sous-faces : le moteur les teinte
# en neutre, la photo prise d'en haut n'a rien à y montrer).
import numpy as np
from scipy import ndimage
from scipy.spatial import Delaunay
from scipy.sparse import coo_matrix
from scipy.sparse.csgraph import connected_components
from skimage.measure import find_contours, approximate_polygon, points_in_poly

CELL = 0.5
DEBORD = 0.6  # m : retrait des murs sous un toit en pente quand AUCUN point ne dit où est le mur (repli de la v3)
RIVE = 0.25  # m : épaisseur de la tranche du toit
PENTE_TOIT = 0.25  # pente (tan) au-dessus de laquelle un toit est « en pente »
PAN_MIN = 12  # cases (3 m²) : plus petit pan ajusté

# Contour régularisé
ECART_MAX = 0.6  # m : deux côtés parallèles plus proches que ça sont le même côté
COTE_MIN = 1.0  # m : côté plus court : absorbé par ses voisins (sauf vrai décroché)
TOL_ANGLE = np.radians(12)  # écart à l'orientation dominante sous lequel un côté est mis d'équerre

# Façades
FACADE_DIST = 4.0  # m : points de façade à moins de ça du côté du toit (des deux côtés)
FACADE_MIN = 8  # points (et au moins 1 par mètre de côté) pour poser un mur d'après ses points
RETRAIT_MAX = 3.0  # m : plus grand retrait d'un mur sous le bord du toit
GRILLE = 0.5  # m : pas de la grille des murs et de la carte de relief
RELIEF_MIN, RELIEF_MAX = -1.2, 2.5  # m : creux et saillie possibles (au-delà : intérieur vu par une vitre)
DEBORD_PT = 0.5  # m : un point de façade n'est jamais au-delà du bord du toit (vu d'en haut, il serait dans l'emprise)
SOUS_TOIT = 0.5  # m : un point de façade est au moins ça sous le point le plus haut de sa case (sinon : toit, terrasse)
BRUIT = 0.10  # m : écart au plan du mur sous lequel on reste à plat (bruit de mesure et décalage des lignes de vol)
SIGMA_H, SIGMA_V = 0.5, 0.7  # m : lissage de la carte de relief le long du mur et à la verticale
POIDS_PLEIN = 0.08  # poids gaussien des cases mesurées au-dessus duquel la carte garde toute sa valeur


# ----------------------------------------------------------------------------------------------------------------------
# Contour régularisé
# ----------------------------------------------------------------------------------------------------------------------
def _dp_indices(C, tol):
    """Douglas-Peucker sur le contour fermé C (N, 2) : indices des sommets gardés (ordre du contour)."""
    P = approximate_polygon(np.r_[C, C[:1]], tolerance=tol)[:-1]
    pos = {(float(a), float(b)): i for i, (a, b) in enumerate(C)}
    idx = [pos.get((float(a), float(b))) for a, b in P]
    return sorted(set(i for i in idx if i is not None))


def _orientation(dirs, lens):
    """Orientation dominante (rad, modulo 90°) : moyenne pondérée des angles × 4, affinée sur les côtés proches."""
    th = np.angle(np.sum(lens * np.exp(4j * dirs))) / 4
    for _ in range(2):
        dd = np.angle(np.exp(4j * (dirs - th))) / 4
        ok = np.abs(dd) < np.radians(15)
        if not ok.any():
            break
        th = th + np.sum(lens[ok] * dd[ok]) / np.sum(lens[ok])
    return th


class _Ligne:
    """Un côté du contour : direction phi, classe d'équerre k (0 à 3, None : direction libre), points du contour, position
    o (normale · p = o), fige : bord de la fenêtre de données (gardé tel quel)."""
    __slots__ = ('phi', 'k', 'pts', 'o', 'fige')

    def __init__(self, phi, k, pts, fige=False):
        self.phi, self.k, self.pts, self.fige = phi, k, pts, fige
        self.o = 0.0

    def nrm(self):  # normale extérieure (contour dans le sens trigonométrique : extérieur à droite)
        return np.array([np.sin(self.phi), -np.cos(self.phi)])


def _ajuste(l, C, th):
    P = C[l.pts]
    if l.fige:
        d = P[-1] - P[0]
        l.phi = float(np.arctan2(d[1], d[0]))
        l.o = float(P[0] @ l.nrm())
        return
    if len(P) >= 6:  # (les bouts d'un côté sont arrondis par la grille : on ne garde que son milieu)
        q = max(1, len(P) // 7)
        P = P[q:-q]
    if l.k is not None:
        l.phi = th + l.k * np.pi / 2
    elif len(P) >= 3:
        u, s, vt = np.linalg.svd(P - P.mean(0))
        d = vt[0] if np.dot(vt[0], P[-1] - P[0]) >= 0 else -vt[0]
        l.phi = float(np.arctan2(d[1], d[0]))
    s = P @ l.nrm()
    o = float(np.median(s))
    near = np.abs(s - o) < 0.8  # (une encoche ou un coin du contour ne tire pas le côté)
    l.o = float(np.median(s[near])) if near.sum() >= 2 else o


def _inter(na, oa, nb, ob, sin_min=np.sin(np.radians(15))):
    """Intersection des droites na · p = oa et nb · p = ob, ou None si elles sont presque parallèles."""
    det = na[0] * nb[1] - na[1] * nb[0]
    if abs(det) < sin_min:
        return None
    return np.array([(oa * nb[1] - ob * na[1]) / det, (na[0] * ob - nb[0] * oa) / det])


def _sommets(L, C):
    """Sommets du polygone : intersection des côtés voisins ; deux côtés parallèles (décroché) : raccord perpendiculaire."""
    out = []
    n = len(L)
    for i in range(n):
        a, b = L[i], L[(i + 1) % n]
        J = C[b.pts[0]]  # point du contour où l'on passe de a à b
        p = _inter(a.nrm(), a.o, b.nrm(), b.o)
        if p is not None and np.hypot(*(p - J)) < 3.0:
            out.append(p)
        else:
            out.append(J - (J @ a.nrm() - a.o) * a.nrm())
            out.append(J - (J @ b.nrm() - b.o) * b.nrm())
    return np.array(out)


def regularise(C, tol=0.8, bord=None):
    """Contour fermé C (N, 2, sens trigonométrique, m) → (polygone régularisé (M, 2) ou None, polygone de Douglas-Peucker).
    bord : points du contour sur le bord de la fenêtre de données (côtés gardés tels quels)."""
    N = len(C)
    idx = _dp_indices(C, tol)
    dp = C[idx]
    if len(idx) < 3:
        return None, dp
    seg = np.roll(dp, -1, 0) - dp
    lens = np.hypot(seg[:, 0], seg[:, 1])
    dirs = np.arctan2(seg[:, 1], seg[:, 0])
    E = []
    for e in range(len(idx)):
        i0, i1 = idx[e], idx[(e + 1) % len(idx)]
        E.append(list(range(i0, i1 + 1)) if i1 > i0 else list(range(i0, N)) + list(range(0, i1 + 1)))
    fige = np.array([bord is not None and bord[p].mean() > 0.5 for p in E])
    if fige.all():
        return None, dp
    th = _orientation(dirs[~fige], lens[~fige])
    L = []
    for e in range(len(idx)):
        k = int(np.round((dirs[e] - th) / (np.pi / 2)))
        dev = abs(dirs[e] - th - k * np.pi / 2)
        L.append(_Ligne(dirs[e], (k % 4) if dev < TOL_ANGLE and not fige[e] else None, E[e], bool(fige[e])))
    for l in L:
        _ajuste(l, C, th)
    for _ in range(4 * len(L)):
        n = len(L)
        if n < 3:
            return None, dp
        chg = False
        # (1) voisins de même direction et presque alignés : un seul côté ; demi-tour : bruit, le plus court s'en va
        for i in range(n):
            a, b = L[i], L[(i + 1) % n]
            if a.k is not None and a.k == b.k and abs(a.o - b.o) < ECART_MAX:
                a.pts = a.pts + b.pts[1:]
                _ajuste(a, C, th)
                del L[(i + 1) % n]
                chg = True
                break
            if a.k is not None and b.k is not None and (a.k - b.k) % 4 == 2:
                rm = i if len(a.pts) < len(b.pts) else (i + 1) % n
                o = L[(rm - 1) % n]
                o.pts = o.pts + L[rm].pts[1:]
                _ajuste(o, C, th)
                del L[rm]
                chg = True
                break
        if chg:
            continue
        # (2) côté le plus court (< COTE_MIN) : absorbé, sauf vrai décroché entre deux parallèles éloignées (mis d'équerre)
        V = _sommets(L, C)
        if len(V) != n:  # (raccords insérés : longueurs approchées par les points du contour)
            ln = np.array([np.hypot(*(C[l.pts[-1]] - C[l.pts[0]])) for l in L])
        else:
            ln = np.hypot(*(np.roll(V, 1, 0) - V).T)  # côté i : du sommet i - 1 au sommet i
        for i in np.argsort(ln):
            if ln[i] >= COTE_MIN:
                break
            if L[i].fige:
                continue
            a, b = L[(i - 1) % n], L[(i + 1) % n]
            if a.k is not None and a.k == b.k and abs(a.o - b.o) >= ECART_MAX:
                if L[i].k is None:
                    L[i].k = (a.k + (3 if b.o > a.o else 1)) % 4
                    _ajuste(L[i], C, th)
                continue
            a.pts = a.pts + L[i].pts[1:]
            _ajuste(a, C, th)
            del L[i]
            chg = True
            break
        if not chg:
            break
    if len(L) < 3:
        return None, dp
    V = _sommets(L, C)
    V = V[np.hypot(*(V - np.roll(V, 1, 0)).T) > 0.01]  # (sommets confondus)
    return V, dp


def valide(V, C):
    """Le polygone régularisé V tient-il face au contour mesuré C ? Simple, même sens, aire à ±10 %, écart moyen
    (aire de la différence / périmètre) sous 0,3 m, écart maximal (encoche absorbée) sous 2,5 m."""
    from shapely.geometry import Polygon, LinearRing
    if V is None or len(V) < 3:
        return False
    p, q = Polygon(V), Polygon(C)
    if not p.is_valid or not q.is_valid or p.area <= 0 or p.exterior.is_ccw != q.exterior.is_ccw:
        return False
    if not (0.9 < p.area / q.area < 1.1) or p.symmetric_difference(q).area / q.length > 0.3:
        return False
    return LinearRing(C).hausdorff_distance(p.exterior) < 2.5


# ----------------------------------------------------------------------------------------------------------------------
# Toit en pans (v3)
# ----------------------------------------------------------------------------------------------------------------------
def pans(t, m):
    """Découpe le toit en pans plans. t : hauteur par case (−1e9 sans mesure), m : cases du bâtiment.
    Rend (z : hauteur du toit par case, lab : pan de chaque case (−1 sans pan), plans : {pan: (a, b, c)} avec
    z = a × colonne + b × ligne + c en cases), la pente dominante (tan) et la surface mesurée (médiane 3 × 3)."""
    ny, nx = m.shape
    mes = m & (t > -1e8)
    fill = float(np.median(t[mes])) if mes.any() else 0.0
    z = np.where(mes, t, np.nan)
    # cases sans mesure : la moyenne des voisines mesurées (3 passes), sinon la médiane
    for _ in range(3):
        zz = np.where(np.isfinite(z), z, 0.0)
        w = np.isfinite(z).astype(float)
        s = ndimage.uniform_filter(zz, 3)
        ws = ndimage.uniform_filter(w, 3)
        z = np.where(np.isfinite(z) | ~m, z, np.where(ws > 0.05, s / np.maximum(ws, 1e-6), np.nan))
    z = np.where(np.isfinite(z), z, fill)
    zm = np.where(m, ndimage.median_filter(z, size=3), z)
    # pente locale : plan des moindres carrés sur 5 × 5 cases
    k = np.arange(-2, 3, dtype=float)
    kx = np.tile(k, (5, 1))
    ky = kx.T
    gx = ndimage.correlate(zm, kx) / np.sum(kx * kx)
    gy = ndimage.correlate(zm, ky) / np.sum(ky * ky)
    # graphe des cases voisines de même pente, sans marche : pans = composantes connexes
    idx = -np.ones((ny, nx), np.int64)
    ii = np.nonzero(m)
    idx[ii] = np.arange(len(ii[0]))
    n = len(ii[0])
    rows, cols = [], []
    for dy, dx in ((0, 1), (1, 0)):
        a = m[: ny - dy, : nx - dx] & m[dy:, dx:]
        ga = np.c_[gx[: ny - dy, : nx - dx][a], gy[: ny - dy, : nx - dx][a]]
        gb = np.c_[gx[dy:, dx:][a], gy[dy:, dx:][a]]
        same = np.hypot(*(ga - gb).T) < 0.06  # pente par case (0,5 m) : ~7° d'écart au plus
        za = zm[: ny - dy, : nx - dx][a]
        zb = zm[dy:, dx:][a]
        pred = za + (ga[:, 0] if dx else ga[:, 1])
        cont = np.abs(zb - pred) < 0.3
        ok = same & cont
        rows.append(idx[: ny - dy, : nx - dx][a][ok])
        cols.append(idx[dy:, dx:][a][ok])
    r = np.concatenate(rows) if rows else np.zeros(0, int)
    c = np.concatenate(cols) if cols else np.zeros(0, int)
    ncomp, comp = connected_components(coo_matrix((np.ones(len(r)), (r, c)), shape=(n, n)), directed=False)
    lab = -np.ones((ny, nx), np.int64)
    plans = {}
    zr = zm.copy()
    yy, xx = ii
    slopes, weights = [], []
    for q in range(ncomp):
        sel = comp == q
        if sel.sum() < PAN_MIN:
            continue
        py_, px_ = yy[sel], xx[sel]
        zz = t[py_, px_]
        ok = zz > -1e8
        if ok.sum() < PAN_MIN // 2:
            continue
        A = np.c_[px_[ok], py_[ok], np.ones(ok.sum())]
        sol = np.linalg.lstsq(A, zz[ok], rcond=None)[0]
        res = np.abs(A @ sol - zz[ok])
        good = res < max(0.3, np.percentile(res, 80))
        if good.sum() >= 6:
            sol = np.linalg.lstsq(A[good], zz[ok][good], rcond=None)[0]
        plans[q] = sol
        lab[py_, px_] = q
        zr[py_, px_] = sol[0] * px_ + sol[1] * py_ + sol[2]
        slopes.append(np.hypot(sol[0], sol[1]) / CELL)
        weights.append(sel.sum())
    pente = float(np.average(slopes, weights=weights)) if slopes else 0.0
    return zr, lab, plans, pente, zm


# ----------------------------------------------------------------------------------------------------------------------
# Toit : triangulation dans le contour
# ----------------------------------------------------------------------------------------------------------------------
def _toit(B, IP):
    """Triangles du toit : sommets du bord B (Nb, 2, sens trigonométrique, côtés recoupés tous les 0,5 m) puis points
    intérieurs IP. Delaunay gardée dans le contour ; chaque segment du bord doit être une arête d'un triangle gardé (le toit
    se raccorde exactement à la rive), sinon triangulation contrainte du seul bord (shapely). Rend (indices, sommets 2D)."""
    nb = len(B)
    ok = False
    tri = None
    for essai in range(3):
        P2 = np.r_[B, IP] if len(IP) else B
        if len(P2) < 3:
            break
        try:
            # (coordonnées ramenées près de 0 : en Lambert-93 brut, Qhull perdait presque toutes les arêtes du bord)
            tri = Delaunay(P2 - P2.mean(0)).simplices
        except Exception:
            break
        tri = tri[points_in_poly(P2[tri].mean(1), B)]
        e = np.r_[tri[:, [0, 1]], tri[:, [1, 2]], tri[:, [2, 0]]]
        have = set(map(tuple, np.sort(e, 1).tolist()))
        miss = [i for i in range(nb) if (min(i, (i + 1) % nb), max(i, (i + 1) % nb)) not in have]
        if not miss:
            ok = True
            break
        # arête du bord absente : les points intérieurs trop proches d'elle s'en vont, et on recommence
        if not len(IP):
            break
        far = np.ones(len(IP), bool)
        for i in miss:
            a_, b_ = B[i], B[(i + 1) % nb]
            far &= np.hypot(*(IP - (a_ + b_) / 2).T) > np.hypot(*(b_ - a_)) / 2 + 0.3
        IP = IP[far]
    if not ok:
        import shapely
        from shapely.geometry import Polygon
        pos = {(round(float(a), 6), round(float(b), 6)): i for i, (a, b) in enumerate(B)}
        try:
            g = shapely.constrained_delaunay_triangles(Polygon(B))
            tri = np.array([[pos[(round(float(a), 6), round(float(b), 6))] for a, b in list(t.exterior.coords)[:3]]
                            for t in g.geoms], np.int64)
        except Exception:
            return np.zeros((0, 3), np.int64), B
        P2 = B
    a, b2, c2 = P2[tri[:, 0]], P2[tri[:, 1]], P2[tri[:, 2]]
    cross = (b2[:, 0] - a[:, 0]) * (c2[:, 1] - a[:, 1]) - (b2[:, 1] - a[:, 1]) * (c2[:, 0] - a[:, 0])
    tri = tri[np.abs(cross) > 1e-9]
    cross = cross[np.abs(cross) > 1e-9]
    tri[cross < 0] = tri[cross < 0][:, [0, 2, 1]]
    return tri, P2


# ----------------------------------------------------------------------------------------------------------------------
# Façades
# ----------------------------------------------------------------------------------------------------------------------
def _carte_relief(u, h, e, L, z0, z1):
    """Carte de relief d'un mur : points (u le long du mur, h altitude, e écart au plan du mur, + vers l'extérieur) →
    grille (nz, nu) en cases de GRILLE m depuis (0, z0). Médiane par case, puis comblement par convolution normalisée
    (moyenne gaussienne des cases mesurées, plus large à la verticale : l'avion balaie la façade en lignes espacées de
    ~1,4 m), qui s'efface en douceur à plus de ~2 m d'un point ; bruit de mesure retiré en douceur."""
    nu = max(1, int(np.ceil(L / GRILLE)))
    nz = max(1, int(np.ceil((z1 - z0) / GRILLE)))
    if len(u) == 0:
        return np.zeros((nz, nu))
    iu = np.clip((u / GRILLE).astype(int), 0, nu - 1)
    iz = np.clip(((h - z0) / GRILLE).astype(int), 0, nz - 1)
    cell = iz * nu + iu
    o = np.argsort(cell, kind='stable')
    cs, es = cell[o], np.clip(e[o], RELIEF_MIN, RELIEF_MAX)
    uniq, start = np.unique(cs, return_index=True)
    med = np.array([np.median(g) for g in np.split(es, start[1:])])
    D0 = np.zeros(nz * nu)
    Wt = np.zeros(nz * nu)
    D0[uniq] = med
    Wt[uniq] = 1.0
    D0, Wt = D0.reshape(nz, nu), Wt.reshape(nz, nu)
    sig = (SIGMA_V / GRILLE, SIGMA_H / GRILLE)
    num = ndimage.gaussian_filter(D0 * Wt, sig, mode='constant', truncate=3.0)
    den = ndimage.gaussian_filter(Wt, sig, mode='constant', truncate=3.0)
    D = num / np.maximum(den, 1e-9)
    a = np.clip(den / POIDS_PLEIN, 0.0, 1.0)
    D = D * a * a * (3 - 2 * a)  # (loin des points : à plat, sans marche)
    return np.sign(D) * np.maximum(np.abs(D) - BRUIT, 0.0)


def _bilin(D, fu, fz):
    """Valeur de la carte D (nz, nu) aux positions fractionnaires de cases (fu, fz) (centres des cases en k + 0,5)."""
    nz, nu = D.shape
    x = np.clip(fu - 0.5, 0, nu - 1)
    y = np.clip(fz - 0.5, 0, nz - 1)
    x0 = np.floor(x).astype(int)
    y0 = np.floor(y).astype(int)
    x1 = np.minimum(x0 + 1, nu - 1)
    y1 = np.minimum(y0 + 1, nz - 1)
    ax, ay = x - x0, y - y0
    return (D[y0, x0] * (1 - ax) * (1 - ay) + D[y0, x1] * ax * (1 - ay) + D[y1, x0] * (1 - ax) * ay + D[y1, x1] * ax * ay)


def batiments(x, y, z, c, sol_z, ex0, ey0, ex1, ey1, ox, oy, oz, stats=None):
    """x, y, z, c : points (L93) ; sol_z(X, Y) → altitude du sol (L93). Rend (V, T, mur) en repère local (−ox, −oy, −oz).
    stats : dict facultatif, rempli de mesures (contrôle)."""
    b = c == 6
    if b.sum() < 50:
        return np.zeros((0, 3)), np.zeros((0, 3), np.int64), np.zeros(0, bool)
    nx = int((ex1 - ex0) / CELL) + 1
    ny = int((ey1 - ey0) / CELL) + 1
    ix = ((x[b] - ex0) / CELL).astype(int).clip(0, nx - 1)
    iy = ((y[b] - ey0) / CELL).astype(int).clip(0, ny - 1)
    top = np.full((ny, nx), -np.inf)
    np.maximum.at(top, (iy, ix), z[b])
    occ = np.isfinite(top)
    occ = ndimage.binary_closing(occ, iterations=1)
    occ = ndimage.binary_fill_holes(occ)
    t = np.where(np.isfinite(top), top, -1e9)
    lab, n = ndimage.label(occ)
    # Points candidats des façades (classes 6 et 1), rangés par bâtiment le plus proche (à moins de FACADE_DIST)
    cand = np.nonzero((c == 6) | (c == 1))[0]
    dist, (nr, nc) = ndimage.distance_transform_edt(lab == 0, return_indices=True)
    near = lab[nr, nc]
    near[dist * CELL > FACADE_DIST + CELL] = 0
    cix = ((x[cand] - ex0) / CELL).astype(int).clip(0, nx - 1)
    ciy = ((y[cand] - ey0) / CELL).astype(int).clip(0, ny - 1)
    ck = near[ciy, cix]
    keep = ck > 0
    cand, ck = cand[keep], ck[keep]
    o = np.argsort(ck, kind='stable')
    cand, ck = cand[o], ck[o]
    kstart = np.searchsorted(ck, np.arange(n + 2))
    V, T, M = [], [], []
    nv = 0
    st = {'batiments': 0, 'regularises': 0, 'murs': 0, 'murs_mesures': 0, 'points_facade': 0, 'triangles_murs': 0,
          'retraits': []} if stats is None else stats
    st.update({k: st.get(k, 0) for k in ('batiments', 'regularises', 'murs', 'murs_mesures', 'points_facade',
                                         'triangles_murs')})
    st.setdefault('retraits', [])

    def add(P3, tri, wall):
        """Morceau de maillage (sommets propres : normale à lui) ; tri : indices locaux."""
        nonlocal nv
        V.extend(map(tuple, P3))
        M.extend([wall] * len(P3))
        T.extend((np.asarray(tri, np.int64) + nv).tolist())
        nv += len(P3)

    def strip(A, Bp, wall=True):
        """Bande de quadrilatères entre deux polylignes 3D A (bord du haut) et Bp (bord du bas), même nombre de points ;
        face vers l'extérieur quand A et Bp vont dans le sens du contour (sens trigonométrique vu de dessus)."""
        k = len(A)
        P3 = np.r_[A, Bp]
        i = np.arange(k - 1)
        tri = np.r_[np.c_[i, k + i, k + i + 1], np.c_[i, k + i + 1, i + 1]]
        # (quadrilatères écrasés : écartés)
        a, b_, c_ = P3[tri[:, 0]], P3[tri[:, 1]], P3[tri[:, 2]]
        ar = np.linalg.norm(np.cross(b_ - a, c_ - a), axis=1)
        tri = tri[ar > 1e-6]
        if len(tri):
            add(P3, tri, wall)

    sl = ndimage.find_objects(lab)
    for k in range(1, n + 1):
        box = sl[k - 1]
        if box is None:
            continue
        # (travail sur la boîte du bâtiment + 3 cases : rapide)
        r0, r1 = max(0, box[0].start - 3), min(ny, box[0].stop + 3)
        c0, c1 = max(0, box[1].start - 3), min(nx, box[1].stop + 3)
        m = lab[r0:r1, c0:c1] == k
        if m.sum() < 32:  # < 8 m²
            continue
        tk = np.where(m, t[r0:r1, c0:c1], -1e9)
        if not (tk > -1e8).any():
            continue
        st['batiments'] += 1
        zr, plab, plans, pente, zmes = pans(tk, m)
        # bornes de la surface mesurée autour de chaque case (le plan d'un pan prolongé jusqu'au contour ne s'envole pas :
        # « ailerons » de la v3)
        mes = m & (tk > -1e8)
        zhi = ndimage.maximum_filter(np.where(mes, tk, -1e9), 5)
        zlo = ndimage.minimum_filter(np.where(mes, tk, 1e9), 5)
        zhi = np.where(zhi > -1e8, zhi, zr)
        zlo = np.where(zlo < 1e8, zlo, zr)
        cs = find_contours(np.pad(m, 1).astype(float), 0.5)
        if not cs:
            continue
        cont = max(cs, key=len)[:-1] - 1  # (ligne, colonne) en cases de la boîte
        # contour en m (repère de la boîte : centre de la case (0, 0) en (0, 0)), sens trigonométrique
        C = np.c_[cont[:, 1], cont[:, 0]] * CELL
        if 0.5 * np.sum(C[:, 0] * np.roll(C[:, 1], -1) - np.roll(C[:, 0], -1) * C[:, 1]) < 0:
            C, cont = C[::-1], cont[::-1]
        if len(C) < 4:
            continue
        # points du contour sur le bord de la fenêtre de données (bâtiment coupé : ce côté-là reste tel quel)
        bord = (cont[:, 1] + c0 < 0.75) | (cont[:, 0] + r0 < 0.75) | (cont[:, 1] + c0 > nx - 1.75) | (cont[:, 0] + r0 > ny - 1.75)
        Vr, dp = regularise(C, bord=bord)
        if valide(Vr, C):
            poly = Vr
            st['regularises'] += 1
        else:
            poly = dp
        if len(poly) < 3:
            continue
        X0 = ex0 + (c0 + 0.5) * CELL  # (L93 du centre de la case (0, 0) de la boîte)
        Y0 = ey0 + (r0 + 0.5) * CELL
        bx = lambda X: (X - X0) / CELL  # noqa: E731  (L93 → colonne de la boîte)
        by = lambda Y: (Y - Y0) / CELL  # noqa: E731
        dist_m, (ir_m, ic_m) = ndimage.distance_transform_edt(~m, return_indices=True)
        dist_in = ndimage.distance_transform_edt(m)
        npl = (max(plans) + 1) if plans else 1
        PA, PB, PC = np.zeros(npl), np.zeros(npl), np.zeros(npl)
        for q_, (a_, b_, c_) in plans.items():
            PA[q_], PB[q_], PC[q_] = a_, b_, c_

        def roof_z(X, Y):
            """Hauteur du toit au point (L93) : plan du pan de la case du bâtiment la plus proche (bord net), sinon la
            hauteur mesurée de cette case."""
            cc = np.clip(np.round(bx(X)).astype(int), 0, m.shape[1] - 1)
            rr = np.clip(np.round(by(Y)).astype(int), 0, m.shape[0] - 1)
            rr, cc = ir_m[rr, cc], ic_m[rr, cc]
            q = plab[rr, cc]
            qq = np.maximum(q, 0)
            out = np.where(q >= 0, PA[qq] * bx(X) + PB[qq] * by(Y) + PC[qq], zr[rr, cc])
            return np.clip(out, zlo[rr, cc] - 0.3, zhi[rr, cc] + 0.3)

        def surf_z(X, Y):
            """Surface mesurée du toit (médiane 3 × 3 des cases) à la case du bâtiment la plus proche."""
            cc = np.clip(np.round(bx(X)).astype(int), 0, m.shape[1] - 1)
            rr = np.clip(np.round(by(Y)).astype(int), 0, m.shape[0] - 1)
            return zmes[ir_m[rr, cc], ic_m[rr, cc]]

        # ---- côtés du toit, recoupés tous les GRILLE m (le toit, la rive, la sous-face et le mur ont les mêmes coupes)
        Pl = poly + np.array([X0, Y0])  # L93
        Lp = len(Pl)
        seg = np.roll(Pl, -1, 0) - Pl
        slen = np.hypot(seg[:, 0], seg[:, 1])
        dirs = seg / np.maximum(slen, 1e-9)[:, None]
        nrm = np.c_[dirs[:, 1], -dirs[:, 0]]  # normale extérieure
        ncut = np.maximum(1, np.ceil(slen / GRILLE).astype(int))
        Bl, Be = [], []  # bord du toit (L93) et côté de chaque point
        for j in range(Lp):
            f = np.arange(ncut[j]) / ncut[j]
            Bl.append(Pl[j] + f[:, None] * seg[j])
            Be.append(np.full(ncut[j], j))
        B = np.concatenate(Bl)
        Be = np.concatenate(Be)
        zt = roof_z(B[:, 0], B[:, 1])
        # Bord du toit (rive) : une DROITE quand les trois quarts des hauteurs mesurées le long du côté sont à moins de
        # 0,3 m d'une droite (égout d'un toit, rampant d'un pignon d'un seul pan ; le reste : neige, gouttière, bruit) ;
        # sinon (faîtage d'un pignon, lucarne) un léger lissage. Les coins restent communs aux deux côtés.
        cum0 = np.r_[0, np.cumsum(ncut)]
        zt1 = np.r_[zt, zt[:1]]
        for j in range(len(ncut)):
            if ncut[j] < 3:
                continue
            qq = np.arange(cum0[j], cum0[j + 1] + 1)
            zz = zt1[qq]
            A_ = np.c_[np.arange(len(qq), dtype=float), np.ones(len(qq))]
            ok_ = np.ones(len(qq), bool)
            for _ in range(3):
                co = np.linalg.lstsq(A_[ok_], zz[ok_], rcond=None)[0]
                ok_ = np.abs(A_ @ co - zz) < 0.3
                if ok_.sum() < 2:
                    break
            if ok_.mean() >= 0.75:
                zt[qq[1:-1]] = (A_ @ co)[1:-1]
            else:
                zt[qq[1:-1]] = ndimage.median_filter(zz, 3, mode='nearest')[1:-1]
        Bz = np.r_[zt, zt[:1]]  # (bord fermé : le dernier point rejoint le premier)
        B1 = np.r_[B, B[:1]]
        # ---- TOIT : bord + centres des cases à plus de 0,3 m du bord
        rI, cI = np.nonzero(m)
        ip = np.c_[X0 + cI * CELL, Y0 + rI * CELL]
        ins = points_in_poly(ip, Pl)
        if ins.any():
            import shapely
            from shapely.geometry import LinearRing
            ring = LinearRing(Pl)
            dd = shapely.distance(shapely.points(ip[ins]), ring)
            sel = np.nonzero(ins)[0][dd > 0.3]
        else:
            sel = np.zeros(0, int)
        tri, P2 = _toit(B, ip[sel])
        if len(tri) == 0:
            continue
        Z2 = np.r_[zt, zr[rI[sel], cI[sel]]][: len(P2)]
        add(np.c_[P2, Z2], tri, False)
        # ---- FAÇADES : points de chaque côté, retrait du mur
        pidx = cand[kstart[k]:kstart[k + 1]]
        if len(pidx):
            # (tri rapide : ni les points du toit, ni ceux à plus de FACADE_DIST à l'intérieur de l'emprise)
            prr = np.clip(np.round(by(y[pidx])).astype(int), 0, m.shape[0] - 1)
            pcc = np.clip(np.round(bx(x[pidx])).astype(int), 0, m.shape[1] - 1)
            din = dist_in[prr, pcc] * CELL
            # point le plus haut de la case du point (toit, terrasse, dalle de balcon vue d'en haut) : un point de façade
            # est en dessous (sous l'avant-toit ou sous le bord du toit) ; hors de l'emprise, aucune case : gardé
            gtop = t[np.clip(((y[pidx] - ey0) / CELL).astype(int), 0, ny - 1), np.clip(((x[pidx] - ex0) / CELL).astype(int), 0, nx - 1)]
            pidx = pidx[(din <= FACADE_DIST + CELL) & (z[pidx] < gtop - SOUS_TOIT)]
        fx, fy, fz = x[pidx], y[pidx], z[pidx]
        st['points_facade_bruts'] = st.get('points_facade_bruts', 0) + len(pidx)
        if len(pidx):
            rel = np.c_[fx, fy][:, None, :] - Pl[None, :, :]  # (np, Lp, 2)
            tt = np.einsum('pjk,jk->pj', rel, dirs)
            ss = np.einsum('pjk,jk->pj', rel, nrm)
            tcl = np.clip(tt, 0, slen[None, :])
            dseg = np.hypot(tt - tcl, ss)
            ej = np.argmin(dseg, 1)
            r_ = np.arange(len(pidx))
            pt, ps, pd = tt[r_, ej], ss[r_, ej], dseg[r_, ej]
            # bord du toit au-dessus du point (interpolé le long du côté) et sol sous le point
            cum = np.r_[0, np.cumsum(ncut)]
            fpos = cum[ej] + np.clip(pt / np.maximum(slen[ej], 1e-9), 0, 1) * ncut[ej]
            i0 = np.floor(fpos).astype(int).clip(0, len(Bz) - 2)
            ztp = Bz[i0] + (Bz[i0 + 1] - Bz[i0]) * (fpos - i0)
            zs = sol_z(fx, fy)
            # (classe 1 près du sol : voitures, barrières, tas de neige ; au-delà du bord du toit : rien du bâtiment)
            haut = np.where(c[pidx] == 1, 1.5, 0.3)
            okp = (ps >= -FACADE_DIST) & (ps <= DEBORD_PT) & (pd <= FACADE_DIST) & (fz < ztp - 0.3) & (fz > zs + haut)
        else:
            okp = np.zeros(0, bool)
            ej = pt = ps = ztp = np.zeros(0)
        st['points_facade'] += int(okp.sum())
        flat = pente <= PENTE_TOIT
        dmes = np.full(Lp, np.nan)
        # position du mur : médiane de l'écart de ses points « bâtiment » (classe 6), hors du mètre sous le bord du toit
        # (gouttières, corniches de neige) ; la classe 1 (garde-corps, objets contre le mur) n'y entre qu'à défaut
        c6 = (c[pidx] == 6) & (fz < ztp - 1.0) if len(pidx) else np.zeros(0, bool)
        for j in range(Lp):
            sj = okp & (ej == j)
            s6 = sj & c6
            use = s6 if s6.sum() >= max(FACADE_MIN, slen[j] / 1.0) else sj
            if use.sum() >= max(FACADE_MIN, slen[j] / 1.0):
                dmes[j] = float(np.clip(np.median(ps[use]), -RETRAIT_MAX, 0.0))
        st['murs'] += Lp
        st['murs_mesures'] += int(np.isfinite(dmes).sum())
        st['retraits'].extend(dmes[np.isfinite(dmes)].tolist())
        # côtés sans assez de points : retrait médian des murs mesurés du bâtiment, sinon celui de la v3
        if np.isfinite(dmes).any():
            dfill = float(np.median(dmes[np.isfinite(dmes)]))
        else:
            dfill = 0.0 if flat else -DEBORD
        dj = np.where(np.isfinite(dmes), dmes, dfill)
        if stats is not None and 'detail' in stats:
            stats['detail'].append({'k': k, 'n': Lp, 'mesures': dmes.tolist(), 'pente': pente})

        def coins(dj):
            """Coins des murs : intersection des lignes de murs voisines (bord du toit décalé de dj vers l'intérieur)."""
            W = np.zeros((Lp, 2))
            for j in range(Lp):
                i = (j - 1) % Lp
                oa = nrm[i] @ Pl[i] + dj[i]
                ob = nrm[j] @ Pl[j] + dj[j]
                p = _inter(nrm[i], oa, nrm[j], ob)
                if p is None or np.hypot(*(p - Pl[j])) > 3 * RETRAIT_MAX:
                    p = Pl[j] + 0.5 * (dj[i] * nrm[i] + dj[j] * nrm[j])
                W[j] = p
            return W

        def tient(W):
            from shapely.geometry import Polygon
            sw = np.roll(W, -1, 0) - W
            if np.any(np.einsum('jk,jk->j', sw, seg) <= 0):  # (un mur ne doit pas changer de sens)
                return False
            p = Polygon(W)
            return p.is_valid and p.area > 0.5 * Polygon(Pl).area

        W = coins(dj)
        if not tient(W):
            dj = np.full(Lp, float(np.median(dj)))
            W = coins(dj)
            if not tient(W):
                dj = np.zeros(Lp)
                W = Pl.copy()
        # ---- RIVE, SOUS-FACE, MUR (relief mesuré), côté par côté
        cum = np.r_[0, np.cumsum(ncut)]
        # haut des murs aux coins : une seule valeur par coin, commune aux deux murs (sinon un jour le long de l'arête)
        zc = np.minimum(roof_z(W[:, 0], W[:, 1]), surf_z(W[:, 0], W[:, 1])) - RIVE
        au_bord = np.hypot(*(W - Pl).T) < 0.05
        zc[au_bord] = Bz[cum[:-1]][au_bord] - RIVE
        for j in range(Lp):
            q = np.arange(cum[j], cum[j + 1] + 1)  # points du bord de ce côté (le dernier = premier du côté suivant)
            Bj = B1[q]
            zB = Bz[q]
            f = np.arange(ncut[j] + 1) / ncut[j]
            Wj = W[j] + f[:, None] * (W[(j + 1) % Lp] - W[j])
            # haut du mur : sous-face du toit (parallèle au toit, RIVE dessous)
            ztop = np.minimum(roof_z(Wj[:, 0], Wj[:, 1]), surf_z(Wj[:, 0], Wj[:, 1])) - RIVE
            if abs(dj[j]) < 0.05 and np.allclose(Wj, Bj, atol=0.05):
                ztop = zB - RIVE
            ztop[0], ztop[-1] = zc[j], zc[(j + 1) % Lp]
            zg = np.minimum(sol_z(Wj[:, 0], Wj[:, 1]) - 0.5, ztop - 1.0)
            # rive : tranche du toit
            strip(np.c_[Bj, zB], np.c_[Bj, zB - RIVE])
            # sous-face : du bas de la rive au haut du mur
            strip(np.c_[Bj, zB - RIVE], np.c_[Wj, ztop])
            # mur : grille de GRILLE m déplacée selon la carte de relief de ses points
            wl = np.hypot(*(W[(j + 1) % Lp] - W[j]))
            if wl < 1e-3:
                continue
            wd = (W[(j + 1) % Lp] - W[j]) / wl
            hmax = float(np.max(ztop - zg))
            nvr = max(1, int(np.ceil(hmax / GRILLE)))
            fr = np.arange(nvr + 1) / nvr
            Zg = ztop[None, :] + (zg - ztop)[None, :] * fr[:, None]  # (rangée, colonne) : du haut vers le bas
            disp = np.zeros_like(Zg)
            # (le mètre sous le bord du toit : gouttières, bandeau de rive, corniche de neige ; pas le mur)
            sj = okp & (ej == j) & (fz < ztp - 1.0)
            if sj.any() and ncut[j] >= 2 and nvr >= 2:
                pw = np.c_[fx[sj], fy[sj]] - W[j]
                u = pw @ wd
                e = pw @ nrm[j]  # écart au plan du mur (+ vers l'extérieur)
                inu = (u > -GRILLE) & (u < wl + GRILLE)
                z0 = float(np.min(zg))
                Dm = _carte_relief(u[inu], fz[sj][inu], e[inu], wl, z0, float(np.max(ztop)))
                if stats is not None and 'murs_detail' in stats:
                    stats['murs_detail'].append({'k': k, 'j': j, 'u': u[inu], 'z': fz[sj][inu], 'e': e[inu],
                                                 'c': c[pidx][sj][inu], 'D': Dm, 'z0': z0, 'wl': wl, 'd': dj[j],
                                                 'zg': zg, 'ztop': ztop, 'W0': W[j], 'W1': W[(j + 1) % Lp], 'n': nrm[j]})
                uu = (f * wl)[None, :].repeat(nvr + 1, 0)
                disp = _bilin(Dm, uu / GRILLE, (Zg - z0) / GRILLE)
                disp[0, :] = 0.0  # haut : raccord à la sous-face
                disp[-1, :] = 0.0  # pied (sous le sol)
                disp[:, 0] = 0.0  # coins : communs aux deux murs voisins
                disp[:, -1] = 0.0
            XY = Wj[None, :, :] + disp[:, :, None] * nrm[j][None, None, :]
            P3 = np.c_[XY.reshape(-1, 2), Zg.reshape(-1)]
            nc_ = ncut[j] + 1
            rr, cc = np.meshgrid(np.arange(nvr), np.arange(ncut[j]), indexing='ij')
            a0 = (rr * nc_ + cc).ravel()
            tri = np.r_[np.c_[a0, a0 + nc_, a0 + nc_ + 1], np.c_[a0, a0 + nc_ + 1, a0 + 1]]
            if not disp.any():
                # mur plat : une bande (haut, pied) suffit ; les coupes du haut restent (raccord à la sous-face)
                P3 = np.r_[np.c_[Wj, ztop], np.c_[Wj, zg]]
                kk = ncut[j] + 1
                i = np.arange(kk - 1)
                tri = np.r_[np.c_[i, kk + i, kk + i + 1], np.c_[i, kk + i + 1, i + 1]]
            st['triangles_murs'] += len(tri)
            add(P3, tri, True)
    if not V:
        return np.zeros((0, 3)), np.zeros((0, 3), np.int64), np.zeros(0, bool)
    V = np.array(V, np.float64) - np.array([ox, oy, oz])
    return V, np.array(T, np.int64), np.array(M, bool)
