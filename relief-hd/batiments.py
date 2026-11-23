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
#
# Version 5 (23/11/2026, Edgar : « il faut qu'il n'y ait JAMAIS de défaut… hyper cohérent et hyper transférable ») :
# - DESSOUS MESURÉS : entre un point mesuré (sol, végétation, eau) et l'avion, rien de solide. Ces RAYONS LIBRES
#   (direction de l'avion : bloc.vers_capteur) disent où il y a du vide sous un toit : plateforme ou gare au-dessus de la
#   pente, passerelle, hall ouvert. Là, le mur s'arrête au-dessus du vide (au lieu d'un « rideau » descendu jusqu'au sol)
#   et le bâtiment est fermé par un DESSOUS tourné vers le bas (`_dessous`, `_croisements`, `_pied`). Sans rayon libre,
#   rien ne change (mur jusqu'au sol, comme la v4) : rien n'est inventé.
# - JUGEMENT de chaque bâtiment au moment de le construire (controle_batiments.py : murs repliés, aiguilles, jours entre
#   les morceaux, toit loin des points, triangles) et REPLI sur une forme plus sûre de ce qui est en cause seulement : murs
#   plats (relief des façades retiré), contour simple (Douglas-Peucker, retrait fixe), toit mesuré (surface mesurée au
#   lieu des pans). Ce qui a été replié et pourquoi : stats['par_batiment'], rapport du bloc.
# - Correction : les hauteurs des points intérieurs du toit étaient décalées quand `_toit` en écartait un (v4).
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

# Dessous (version 5) : rayons libres
CLASSES_LIBRES = (2, 3, 4, 5, 9)  # sol, végétation, eau : le rayon de ces points vers l'avion ne traverse rien de solide
LIBRE_DIST = 10.0  # m : points libres gardés à moins de ça d'une emprise (un rayon à 29° parcourt 5,5 m pour 10 m de haut)
DZ = 0.5  # m : pas vertical des échantillons d'un rayon
PROF_MIN = 2.0  # m : un échantillon compte à plus de ça à l'intérieur de l'emprise des murs (avant-toits, balcons, mur mal posé : non)
POUTRE = 0.5  # m : épaisseur gardée au moins sous le haut du mur (0,25 m sous le toit) (bord de plateforme, poutre) ; jamais de vide plus haut
LEVE_MIN = 2.0  # m : vide mesuré d'au moins ça au-dessus du sol pour qu'une case compte comme levée
LEVE_CASES = 16  # cases (4 m²) : plus petit morceau de dessous levé
LEVE_MIN_MUR = 1.5  # m : pied de mur levé d'au moins ça au-dessus du sol (sinon le mur descend jusqu'au sol)
PROLONGE = 4.0  # m : zone levée prolongée d'autant à l'intérieur (dessous des plateformes dont le sol n'a pas été vu)
TROU_COUPES = 8  # coupes (4 m) : trou sans mur mesuré entre deux morceaux levés d'un mur, levé aussi
PILIER_COUPES = 5  # coupes (2 m) : pilier mesuré plus étroit entre deux morceaux levés : levé aussi (sinon un pan de mur
#                    isolé pendrait sous le dessous, ouvert des deux côtés)

# Jugement de chaque bâtiment (contrôles) : au-delà, repli sur une forme plus sûre (_echoue)
RET_MAX, RET_PART = 20, 0.15  # murs repliés (relief) : plus de max(20, 15 %) des triangles des murs
AIG_MAX, AIG_PART = 20, 0.15  # aiguilles et faces dégénérées des murs : plus de max(20, 15 %)
JOURS_MAX = 1.0  # m de jours au-dessus du sol
TOIT_P90_MAX = 1.5  # m : écart du toit aux points mesurés (90 % des cases sous ça)
TRI_MAX = 80000  # triangles d'un bâtiment (au-delà : murs plats)

# Sortes de triangles (stats['types_triangles'], contrôles)
TOIT, RIVE_, SOUS_FACE, MUR, DESSOUS = 0, 1, 2, 3, 4


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
TOITS_CONTRAINTS = [0, 0]  # (toits faits par triangulation contrainte, points intérieurs ajoutés) : compte rendu


def _toit(B, IP):
    """Triangles du toit : sommets du bord B (Nb, 2, sens trigonométrique, côtés recoupés tous les 0,5 m) puis points
    intérieurs IP. Delaunay gardée dans le contour ; chaque segment du bord doit être une arête d'un triangle gardé (le toit
    se raccorde exactement à la rive), sinon triangulation contrainte du seul bord (shapely). Rend (indices, sommets 2D,
    indices dans IP des points intérieurs gardés : les sommets 2D sont B puis IP[gardés])."""
    nb = len(B)
    ok = False
    tri = None
    kept = np.arange(len(IP))
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
        e = np.sort(np.r_[tri[:, [0, 1]], tri[:, [1, 2]], tri[:, [2, 0]]], 1)
        have = set(map(tuple, e.tolist()))
        miss = [i for i in range(nb) if (min(i, (i + 1) % nb), max(i, (i + 1) % nb)) not in have]
        if not miss:
            # (version 5 : un TROU dans le toit, triangle écarté parce que son centre tombait hors d'un contour très creusé :
            # arête intérieure d'un seul triangle ; vu le 23/11 au Praz, 30 m de jours. Repli : triangulation contrainte.)
            a_, b_, c_ = P2[tri[:, 0]], P2[tri[:, 1]], P2[tri[:, 2]]
            aire = 0.5 * np.abs((b_[:, 0] - a_[:, 0]) * (c_[:, 1] - a_[:, 1]) - (b_[:, 1] - a_[:, 1]) * (c_[:, 0] - a_[:, 0]))
            aire_poly = 0.5 * abs(np.sum(B[:, 0] * np.roll(B[:, 1], -1) - np.roll(B[:, 0], -1) * B[:, 1]))
            ok = aire_poly - aire.sum() < max(0.5, 0.005 * aire_poly)
            break
        # arête du bord absente : les points intérieurs trop proches d'elle s'en vont, et on recommence
        if not len(IP):
            break
        far = np.ones(len(IP), bool)
        for i in miss:
            a_, b_ = B[i], B[(i + 1) % nb]
            far &= np.hypot(*(IP - (a_ + b_) / 2).T) > np.hypot(*(b_ - a_)) / 2 + 0.3
        IP = IP[far]
        kept = kept[far]
    if not ok:
        TOITS_CONTRAINTS[0] += 1
        import shapely
        from shapely.geometry import Polygon
        pos = {(round(float(a), 6), round(float(b), 6)): i for i, (a, b) in enumerate(B)}
        try:
            g = shapely.constrained_delaunay_triangles(Polygon(B))
            tri = np.array([[pos[(round(float(a), 6), round(float(b), 6))] for a, b in list(t.exterior.coords)[:3]]
                            for t in g.geoms], np.int64)
        except Exception:
            return np.zeros((0, 3), np.int64), B, np.zeros(0, np.int64)
        P2 = B
        # (les points intérieurs sont perdus : toit plan entre ses bords, comme la v4. Les remettre, triangle par triangle,
        # a été essayé le 23/11 : toit plus fidèle mais dix fois plus d'aiguilles ; piste pour plus tard.)
        kept = np.zeros(0, np.int64)
    a, b2, c2 = P2[tri[:, 0]], P2[tri[:, 1]], P2[tri[:, 2]]
    cross = (b2[:, 0] - a[:, 0]) * (c2[:, 1] - a[:, 1]) - (b2[:, 1] - a[:, 1]) * (c2[:, 0] - a[:, 0])
    tri = tri[np.abs(cross) > 1e-9]
    cross = cross[np.abs(cross) > 1e-9]
    tri[cross < 0] = tri[cross < 0][:, [0, 2, 1]]
    return tri, P2, kept


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


# ----------------------------------------------------------------------------------------------------------------------
# Dessous (version 5) : là où le LiDAR a vu du VIDE sous le bâtiment
# ----------------------------------------------------------------------------------------------------------------------
def _second_max(cle, h):
    """Par clé : (clés, deuxième plus grande valeur, nombre de valeurs). Une seule valeur : nombre 1 (valeur sans objet)."""
    o = np.lexsort((-h, cle))
    cs, hs = cle[o], h[o]
    u, st, cnt = np.unique(cs, return_index=True, return_counts=True)
    sec = np.where(cnt >= 2, hs[np.minimum(st + 1, len(hs) - 1)], -np.inf)
    return u, sec, cnt


def _dessous(Px, Py, Pz, Sx, Sy, Sz, inW, dW, zr_box, sol_box, X0, Y0):
    """Vide mesuré sous le toit d'un bâtiment. Rayons libres (point du sol ou de la végétation → avion : rien de solide entre
    les deux) échantillonnés tous les DZ m de hauteur ; un échantillon compte s'il tombe dans l'emprise des murs (W), à plus
    de PROF_MIN m de son bord (un avant-toit, un mur posé à quelques décimètres près ne comptent pas), sous le toit moins
    POUTRE. Par case : deuxième plus haute hauteur atteinte par des rayons DIFFÉRENTS (un écho égaré ne suffit pas).
    Rend (hauteur libre par case (−inf sans mesure), rayons utiles (indices), hauteur libre par case en comptant aussi les
    échantillons à moins de PROF_MIN du bord : un dessous ne coupe jamais ces rayons-là)."""
    ny, nx = inW.shape
    zfree = np.full((ny, nx), -np.inf)
    if not len(Px):
        return zfree, np.zeros(0, np.int64), zfree.copy()
    zmax = float(np.max(zr_box[inW])) - POUTRE if inW.any() else -np.inf
    n = np.ceil((zmax - Pz) / DZ).astype(int)
    ok = n > 0
    if not ok.any():
        return zfree, np.zeros(0, np.int64), zfree.copy()
    ri = np.nonzero(ok)[0]
    n = np.minimum(n[ok], 200)
    rr = np.repeat(ri, n)
    step = np.arange(n.sum()) - np.repeat(np.cumsum(n) - n, n) + 1
    dh = step * DZ
    h = Pz[rr] + dh
    X = Px[rr] + Sx[rr] / Sz[rr] * dh
    Y = Py[rr] + Sy[rr] / Sz[rr] * dh
    cc = np.round((X - X0) / CELL).astype(int)
    rw = np.round((Y - Y0) / CELL).astype(int)
    v = (cc >= 0) & (cc < nx) & (rw >= 0) & (rw < ny) & (dh >= 0.5)
    rr, h, cc, rw = rr[v], h[v], cc[v], rw[v]
    v = inW[rw, cc] & (h < zr_box[rw, cc] - POUTRE) & (h > sol_box[rw, cc] + 0.3)
    rr, h, cc, rw = rr[v], h[v], cc[v], rw[v]
    zbord = np.full((ny, nx), -np.inf)
    if not len(rr):
        return zfree, np.zeros(0, np.int64), zbord

    def par_case(rr, h, cc, rw, dest):
        cell = rw * nx + cc
        # (plus haut échantillon de chaque rayon dans chaque case, puis deuxième rayon le plus haut par case)
        k1 = cell * (int(rr.max()) + 1) + rr
        o = np.lexsort((-h, k1))
        first = np.r_[True, k1[o][1:] != k1[o][:-1]]
        sel = o[first]
        u, sec, cnt = _second_max(cell[sel], h[sel])
        good = cnt >= 2
        dest.ravel()[u[good]] = sec[good]

    # toutes les cases de l'emprise des murs (bords compris) : ce que le dessous ne doit jamais couper, là où il y en a un
    par_case(rr, h, cc, rw, zbord)
    deep = dW[rw, cc] >= PROF_MIN
    rr, h, cc, rw = rr[deep], h[deep], cc[deep], rw[deep]
    if not len(rr):
        return zfree, np.zeros(0, np.int64), zbord
    par_case(rr, h, cc, rw, zfree)
    return zfree, np.unique(rr), zbord


def _croisements(Px, Py, Pz, Sx, Sy, Sz, A, B, ztop_ab):
    """Hauteurs où des rayons libres croisent le mur vertical posé sur le segment A → B (L93), sous son haut moins POUTRE.
    Rend (position le long du segment 0 à 1, hauteur)."""
    if not len(Px):
        return np.zeros(0), np.zeros(0)
    ax, ay = Sx / Sz, Sy / Sz  # (déplacement horizontal par mètre de hauteur)
    d = B - A
    # P.xy + a × t = A + s × d  (t : hauteur au-dessus du point)
    det = ax * (-d[1]) - ay * (-d[0])
    ok = np.abs(det) > 1e-9
    rx, ry = A[0] - Px, A[1] - Py
    t = np.where(ok, (rx * (-d[1]) - ry * (-d[0])) / np.where(ok, det, 1), -1)
    s = np.where(ok, (ax * ry - ay * rx) / np.where(ok, det, 1), -1)
    hz = Pz + t
    top = ztop_ab[0] + (ztop_ab[1] - ztop_ab[0]) * np.clip(s, 0, 1)
    v = ok & (s >= 0) & (s <= 1) & (t >= 0.5) & (hz < top - POUTRE)
    return s[v], hz[v]


def _pied(zb, lowf, zs, ztop):
    """Pied d'un mur, coupe par coupe. zb : haut du vide mesuré (−inf sans mesure), lowf : plus bas point de façade (inf sans),
    zs : sol, ztop : haut du mur. Un mur est LEVÉ là où les rayons du laser ont vu du vide à plus de LEVE_MIN_MUR au-dessus
    du sol : il s'arrête en haut de ce vide (des points de façade plus bas sur la même coupe sont un pilier, un escalier :
    les rayons sont passés à côté). Coupes sans vide mesuré entre deux morceaux levés (moins de TROU_COUPES coupes) : levées
    aussi, arrêtées aux derniers points mesurés de leur façade, sauf si ces points descendent jusqu'au sol sur plus de
    PILIER_COUPES coupes (vrai mur : il reste jusqu'au sol ; un pilier plus étroit ne ferait qu'un pan isolé). Morceaux levés de moins de 3 coupes : non. Jamais à moins de POUTRE du haut.
    Rend (levé, pied, mur mesuré jusqu'au sol) par coupe."""
    n = len(zb)
    bas = np.isfinite(lowf) & (lowf - zs < LEVE_MIN_MUR)
    vide = np.isfinite(zb) & (zb - zs >= LEVE_MIN_MUR)
    lv = vide.copy()
    zbot = np.full(n, -np.inf)
    if not lv.any():
        return lv, zbot, bas
    ii = np.arange(n)
    zv = np.where(vide, zb, np.interp(ii, ii[vide], zb[vide]))
    idx = np.nonzero(vide)[0]
    haut = np.isfinite(lowf) & ~bas  # (façade mesurée, mais pas jusqu'au sol : bord de plateforme, poutre)
    for a, b in zip(idx[:-1], idx[1:]):
        if b - a <= 1:
            continue
        mid = np.arange(a + 1, b)
        # trou entre deux morceaux levés : levé s'il n'a que des coupes à façade haute ou sans point (moins de TROU_COUPES
        # de suite), ou un pilier étroit
        inconnu = ~haut[mid] & ~bas[mid]
        bords = np.diff(np.r_[0, inconnu.astype(int), 0])
        plus_long = int(np.max(np.nonzero(bords == -1)[0] - np.nonzero(bords == 1)[0])) if inconnu.any() else 0
        long_inconnu = plus_long > TROU_COUPES
        if (not bas[mid].any() and not long_inconnu) or b - a <= PILIER_COUPES:
            lv[mid] = True
            zv[mid] = np.where(haut[mid], np.minimum(zv[mid], lowf[mid] - 0.3), zv[mid])
    lab1, n1 = ndimage.label(lv)
    for q in range(1, n1 + 1):
        if (lab1 == q).sum() < 3:
            lv[lab1 == q] = False
    if not lv.any():
        return lv, zbot, bas
    # (lissage : médiane de 5 coupes parmi les coupes levées)
    zs5 = np.array([np.median(zv[max(0, i - 2):i + 3][lv[max(0, i - 2):i + 3]]) if lv[i] else zv[i] for i in range(n)])
    zbot = np.minimum(np.maximum(zs5, zs + LEVE_MIN_MUR), ztop - POUTRE)
    lv &= zbot - zs >= LEVE_MIN_MUR
    return lv, zbot, bas


# ----------------------------------------------------------------------------------------------------------------------
# Jugement d'un bâtiment (contrôles de controle_batiments.py, sur ce bâtiment seul)
# ----------------------------------------------------------------------------------------------------------------------
def _juge(Vb, Tb, Mb, Kb, sol_local, ecart_toit, dans_local=None):
    """Défauts d'un bâtiment construit (repère L93 décalé), comptés par sorte de triangles : les murs (relief des façades)
    à part du reste (toit : celui de la v4 validée, jugé par son écart aux points). Rend un dict."""
    import controle_batiments as cb
    deg, aig = cb.formes(Vb, Tb)
    ret = cb.retournees(Vb, Tb, Mb)
    jl, _ = cb.jours(Vb, Tb, sol_local, dans=dans_local)
    e = np.abs(ecart_toit)
    mur = Kb == MUR
    return {'triangles': int(len(Tb)), 'triangles_murs': int(mur.sum()), 'retournees': int(ret.sum()),
            'retournees_murs': int((ret & mur).sum()), 'aiguilles': int((aig | deg).sum()),
            'aiguilles_murs': int(((aig | deg) & mur).sum()), 'jours_m': round(jl, 2),
            'toit_p90': round(float(np.percentile(e, 90)), 2) if len(e) else 0.0}


def _echoue(j, opts):
    """Le bâtiment jugé j doit-il se replier ? Rend [(raison, repli)] : murs repliés ou en aiguille, trop de triangles →
    « murs plats » (sans relief) ; jours → « contour simple » (Douglas-Peucker, retrait fixe de la v3) ; toit loin des
    points → « toit mesuré » (surface mesurée au lieu des pans). Chaque repli ne touche que ce qui est en cause."""
    r = []
    nm = max(1, j['triangles_murs'])
    if not opts['plat'] and j['retournees_murs'] > max(RET_MAX, RET_PART * nm):
        r.append(('retournees', 'plat'))
    if not opts['plat'] and j['aiguilles_murs'] > max(AIG_MAX, AIG_PART * nm):
        r.append(('aiguilles', 'plat'))
    if not opts['plat'] and j['triangles'] > TRI_MAX:
        r.append(('triangles', 'plat'))
    if j['jours_m'] > JOURS_MAX:
        r.append(('jours', 'simple' if not opts['simple'] else ('plat' if not opts['plat'] else None)))
    if j['toit_p90'] > TOIT_P90_MAX:
        r.append(('toit', 'mesure' if not opts['mesure'] else None))
    return r


REPLIS = {'plat': 'murs plats', 'simple': 'contour simple', 'mesure': 'toit mesuré'}


def _nom(opts):
    return ' + '.join(REPLIS[o] for o in ('plat', 'simple', 'mesure') if opts[o]) or 'complet'




def batiments(x, y, z, c, sol_z, ex0, ey0, ex1, ey1, ox, oy, oz, stats=None, capteur=None):
    """x, y, z, c : points (L93) ; sol_z(X, Y) → altitude du sol (L93). Rend (V, T, mur) en repère local (−ox, −oy, −oz).
    capteur : direction (unitaire) de chaque point vers l'avion (bloc.vers_capteur) : dessous mesurés (version 5) ; sans
    elle, murs jusqu'au sol comme la version 4. stats : dict facultatif, rempli de mesures et des contrôles par bâtiment."""
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
    # Rayons libres (version 5) : points du sol, de la végétation, de l'eau à moins de LIBRE_DIST d'une emprise, rangés par
    # bâtiment le plus proche
    if capteur is not None:
        lib = np.nonzero(np.isin(c, CLASSES_LIBRES) & (capteur[:, 2] > 0.3))[0]
        near2 = lab[nr, nc].copy()
        near2[dist * CELL > LIBRE_DIST] = 0
        lk = near2[((y[lib] - ey0) / CELL).astype(int).clip(0, ny - 1), ((x[lib] - ex0) / CELL).astype(int).clip(0, nx - 1)]
        lib, lk = lib[lk > 0], lk[lk > 0]
        o = np.argsort(lk, kind='stable')
        lib, lk = lib[o], lk[o]
        lstart = np.searchsorted(lk, np.arange(n + 2))
    st = {} if stats is None else stats
    for k_ in ('batiments', 'regularises', 'murs', 'murs_mesures', 'points_facade', 'triangles_murs', 'points_facade_bruts',
               'avec_dessous', 'colonnes_levees', 'rayons_libres', 'replis'):
        st.setdefault(k_, 0)
    st.setdefault('retraits', [])
    st.setdefault('niveaux', {})
    st.setdefault('defauts_restants', {})
    st.setdefault('par_batiment', [])
    sl = ndimage.find_objects(lab)
    Vg, Tg, Mg, Kg = [], [], [], []
    nvg = [0]

    def construit(k, opts, prep):
        """Un bâtiment avec les replis `opts` (plat : murs sans relief ; simple : contour de Douglas-Peucker, retrait fixe de
        la v3 ; mesure : toit = surface mesurée). Rend (V, T, M, infos) en L93, ou None."""
        V, T, M, K = [], [], [], []
        nv = 0
        info = {'colonnes_levees': 0, 'dessous': False, 'rayons': 0}

        def add(P3, tri, wall, kind):
            """Morceau de maillage (sommets propres) ; kind : sorte de ses triangles (TOIT, RIVE, SOUS_FACE, MUR, DESSOUS)."""
            nonlocal nv
            V.extend(map(tuple, P3))
            M.extend([wall] * len(P3))
            T.extend((np.asarray(tri, np.int64) + nv).tolist())
            K.extend([kind] * len(tri))
            nv += len(P3)

        def strip(A, Bp, kind):
            """Bande de quadrilatères entre deux polylignes 3D A (bord du haut) et Bp (bord du bas), même nombre de points ;
            face vers l'extérieur quand A et Bp vont dans le sens du contour (sens trigonométrique vu de dessus)."""
            kk = len(A)
            P3 = np.r_[A, Bp]
            i = np.arange(kk - 1)
            tri = np.r_[np.c_[i, kk + i, kk + i + 1], np.c_[i, kk + i + 1, i + 1]]
            a, b_, c_ = P3[tri[:, 0]], P3[tri[:, 1]], P3[tri[:, 2]]
            ar = np.linalg.norm(np.cross(b_ - a, c_ - a), axis=1)
            tri = tri[ar > 1e-6]
            if len(tri):
                add(P3, tri, True, kind)

        (r0, r1, c0, c1, m, tk, zr, plab, plans, pente, zmes, zhi, zlo, C, bord, Vr, dp, X0, Y0) = prep
        if opts['mesure']:
            zr = zmes
            plab = -np.ones_like(plab)
        bx = lambda X: (X - X0) / CELL  # noqa: E731  (L93 → colonne de la boîte)
        by = lambda Y: (Y - Y0) / CELL  # noqa: E731
        if not opts['simple'] and valide(Vr, C):
            poly = Vr
            info['regularise'] = True
        else:
            poly = dp
            info['regularise'] = False
        if len(poly) < 3:
            return None
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
        Bl, Be = [], []
        for j in range(Lp):
            f = np.arange(ncut[j]) / ncut[j]
            Bl.append(Pl[j] + f[:, None] * seg[j])
            Be.append(np.full(ncut[j], j))
        B = np.concatenate(Bl)
        zt = roof_z(B[:, 0], B[:, 1])
        # Bord du toit (rive) : une DROITE quand les trois quarts des hauteurs mesurées le long du côté sont à moins de
        # 0,3 m d'une droite ; sinon un léger lissage. Les coins restent communs aux deux côtés.
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
        Bz = np.r_[zt, zt[:1]]
        B1 = np.r_[B, B[:1]]
        # ---- TOIT : bord + centres des cases à plus de 0,3 m du bord
        import shapely
        from shapely.geometry import LinearRing
        rI, cI = np.nonzero(m)
        ip = np.c_[X0 + cI * CELL, Y0 + rI * CELL]
        ins = points_in_poly(ip, Pl)
        if ins.any():
            ring = LinearRing(Pl)
            dd = shapely.distance(shapely.points(ip[ins]), ring)
            sel = np.nonzero(ins)[0][dd > 0.3]
        else:
            sel = np.zeros(0, int)
        tri, P2, kin = _toit(B, ip[sel])
        if len(tri) == 0:
            return None
        # (v4 : hauteurs des points intérieurs prises dans la liste d'avant le tri de _toit : décalées dès qu'un point
        # était écarté ; corrigé le 23/11, version 5)
        Z2 = np.r_[zt, zr[rI[sel][kin], cI[sel][kin]]]
        add(np.c_[P2, Z2], tri, False, TOIT)
        # écart du toit au point le plus haut des cases mesurées (contrôle) : cases intérieures gardées dans le toit
        tcell = tk[rI[sel][kin], cI[sel][kin]]
        info['ecart_toit'] = (Z2[len(B):] - tcell)[tcell > -1e8]
        # ---- FAÇADES : points de chaque côté, retrait du mur
        pidx = cand[kstart[k]:kstart[k + 1]]
        if len(pidx):
            prr = np.clip(np.round(by(y[pidx])).astype(int), 0, m.shape[0] - 1)
            pcc = np.clip(np.round(bx(x[pidx])).astype(int), 0, m.shape[1] - 1)
            din = dist_in[prr, pcc] * CELL
            gtop = t[np.clip(((y[pidx] - ey0) / CELL).astype(int), 0, ny - 1), np.clip(((x[pidx] - ex0) / CELL).astype(int), 0, nx - 1)]
            pidx = pidx[(din <= FACADE_DIST + CELL) & (z[pidx] < gtop - SOUS_TOIT)]
        fx, fy, fz = x[pidx], y[pidx], z[pidx]
        info['points_facade_bruts'] = len(pidx)
        if len(pidx):
            rel = np.c_[fx, fy][:, None, :] - Pl[None, :, :]
            tt = np.einsum('pjk,jk->pj', rel, dirs)
            ss = np.einsum('pjk,jk->pj', rel, nrm)
            tcl = np.clip(tt, 0, slen[None, :])
            dseg = np.hypot(tt - tcl, ss)
            ej = np.argmin(dseg, 1)
            r_ = np.arange(len(pidx))
            pt, ps, pd = tt[r_, ej], ss[r_, ej], dseg[r_, ej]
            cum = np.r_[0, np.cumsum(ncut)]
            fpos = cum[ej] + np.clip(pt / np.maximum(slen[ej], 1e-9), 0, 1) * ncut[ej]
            i0 = np.floor(fpos).astype(int).clip(0, len(Bz) - 2)
            ztp = Bz[i0] + (Bz[i0 + 1] - Bz[i0]) * (fpos - i0)
            zs = sol_z(fx, fy)
            haut = np.where(c[pidx] == 1, 1.5, 0.3)
            okp = (ps >= -FACADE_DIST) & (ps <= DEBORD_PT) & (pd <= FACADE_DIST) & (fz < ztp - 0.3) & (fz > zs + haut)
        else:
            okp = np.zeros(0, bool)
            ej = pt = ps = ztp = np.zeros(0)
        info['points_facade'] = int(okp.sum())
        flat = pente <= PENTE_TOIT
        dmes = np.full(Lp, np.nan)
        c6 = (c[pidx] == 6) & (fz < ztp - 1.0) if len(pidx) else np.zeros(0, bool)
        if not opts['simple']:
            for j in range(Lp):
                sj = okp & (ej == j)
                s6 = sj & c6
                use = s6 if s6.sum() >= max(FACADE_MIN, slen[j] / 1.0) else sj
                if use.sum() >= max(FACADE_MIN, slen[j] / 1.0):
                    dmes[j] = float(np.clip(np.median(ps[use]), -RETRAIT_MAX, 0.0))
        info['murs'] = Lp
        info['murs_mesures'] = int(np.isfinite(dmes).sum())
        info['retraits'] = dmes[np.isfinite(dmes)].tolist()
        if np.isfinite(dmes).any():
            dfill = float(np.median(dmes[np.isfinite(dmes)]))
        else:
            dfill = 0.0 if flat else -DEBORD
        dj = np.where(np.isfinite(dmes), dmes, dfill)

        def coins(dj):
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
            if np.any(np.einsum('jk,jk->j', sw, seg) <= 0):
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
        cum = np.r_[0, np.cumsum(ncut)]
        zc = np.minimum(roof_z(W[:, 0], W[:, 1]), surf_z(W[:, 0], W[:, 1])) - RIVE
        au_bord = np.hypot(*(W - Pl).T) < 0.05
        zc[au_bord] = Bz[cum[:-1]][au_bord] - RIVE
        # ---- haut et pied de chaque mur, coupe par coupe (le pied : sous le sol, ou au-dessus du vide mesuré)
        Wjs, ztops, zgs, zss = [], [], [], []
        for j in range(Lp):
            f = np.arange(ncut[j] + 1) / ncut[j]
            Wj = W[j] + f[:, None] * (W[(j + 1) % Lp] - W[j])
            ztop = np.minimum(roof_z(Wj[:, 0], Wj[:, 1]), surf_z(Wj[:, 0], Wj[:, 1])) - RIVE
            Bj = B1[np.arange(cum[j], cum[j + 1] + 1)]
            if abs(dj[j]) < 0.05 and np.allclose(Wj, Bj, atol=0.05):
                ztop = Bz[np.arange(cum[j], cum[j + 1] + 1)] - RIVE
            ztop[0], ztop[-1] = zc[j], zc[(j + 1) % Lp]
            zs_ = sol_z(Wj[:, 0], Wj[:, 1])
            Wjs.append(Wj)
            ztops.append(ztop)
            zss.append(zs_)
            zgs.append(np.minimum(zs_ - 0.5, ztop - 1.0))
        # ---- DESSOUS (version 5) : murs arrêtés au-dessus du vide que le LiDAR a vu
        leve = [np.zeros(ncut[j] + 1, bool) for j in range(Lp)]
        zfield = None
        if capteur is not None:
            li = lib[lstart[k]:lstart[k + 1]]
            ny_, nx_ = m.shape
            gx_, gy_ = np.meshgrid(X0 + np.arange(nx_) * CELL, Y0 + np.arange(ny_) * CELL)
            inW = points_in_poly(np.c_[gx_.ravel(), gy_.ravel()], W).reshape(ny_, nx_)
            if len(li) and inW.any():
                zrmax = float(np.max(zr[m])) if m.any() else -np.inf
                li = li[z[li] < zrmax - POUTRE - 1.0]
            if len(li) and inW.any():
                info['rayons'] = len(li)
                dW = ndimage.distance_transform_edt(inW) * CELL - 0.5 * CELL
                # toit au-dessus de chaque case de l'emprise des murs (cases hors de m : celle de m la plus proche)
                zr_box = zr[ir_m, ic_m]
                sol_box = np.full((ny_, nx_), -1e9)
                sol_box[inW] = sol_z(gx_[inW], gy_[inW])
                Sx, Sy, Sz = capteur[li, 0], capteur[li, 1], capteur[li, 2]
                zfree, utiles, zbord = _dessous(x[li], y[li], z[li], Sx, Sy, Sz, inW, dW, zr_box, sol_box, X0, Y0)
                levc = np.isfinite(zfree) & (zfree - sol_box >= LEVE_MIN)
                if levc.any():
                    lb, nl = ndimage.label(levc, np.ones((3, 3)))
                    tailles = np.bincount(lb.ravel(), minlength=nl + 1)
                    levc &= tailles[lb] >= LEVE_CASES
                if levc.any():
                    # champ du dessous. Chaque hauteur libre n'est qu'un MINIMUM du dessous : loin des bords, aucun rayon ne
                    # monte jusqu'à lui (il faut sortir par le côté), d'où des creux qui ne sont pas dans le bâtiment. Le
                    # dessous suit donc le toit, à l'ÉPAISSEUR la plus faible mesurée sur la zone levée (20 % des cases :
                    # là où les rayons approchent le dessous, près des bords), jamais sous les hauteurs libres mesurées ;
                    # zone levée prolongée de PROLONGE m (bords des murs, où le champ commence à PROF_MIN ; dessous de
                    # plateforme où le sol n'a pas été vu : pas de pilier inventé jusqu'au sol au milieu du vide), trous
                    # bouchés.
                    dlev, (il, jl) = ndimage.distance_transform_edt(~levc, return_indices=True)
                    proche = ndimage.binary_fill_holes((dlev * CELL <= PROLONGE) | levc) & inW
                    zl = ndimage.maximum_filter(np.where(levc, zfree, -np.inf), 5)
                    zl = np.where(np.isfinite(zl), zl, zfree[il, jl])
                    lz, nz_ = ndimage.label(proche, np.ones((3, 3)))
                    # ailleurs dans l'emprise des murs : la hauteur libre de la case levée la plus proche (le dessous ne
                    # redescend jamais en rampe jusqu'au sol au milieu du vide, où les rayons entrés par un mur levé le
                    # traverseraient ; là où les murs restent jusqu'au sol, ce creux est fermé et ne se voit pas)
                    zfield = np.where(inW, zfree[il, jl], -np.inf)
                    for q in range(1, nz_ + 1):
                        cq = lz == q
                        eq = (zr_box - zfree)[cq & levc]
                        if not len(eq):
                            continue
                        ep = max(float(np.percentile(eq, 20)), POUTRE + RIVE)
                        zfield[cq] = np.maximum(zr_box[cq] - ep, zl[cq])
                    # (près des murs, le dessous passe au-dessus de tous les rayons mesurés)
                    zfield = np.where(proche & np.isfinite(zbord), np.maximum(zfield, zbord), zfield)
                    zfield = np.minimum(zfield, zr_box - POUTRE)
                    # rayons qui ont traversé une case levée : leurs passages au travers des murs comptent aussi
                    ru = utiles
                    zbs_, lowfs_ = [None] * Lp, [None] * Lp
                    for j in range(Lp):
                        Wj, ztop = Wjs[j], ztops[j]
                        # champ au pied du mur : case levée la plus proche à moins de 2 m (le champ commence à PROF_MIN)
                        cw = np.clip(np.round(bx(Wj[:, 0])).astype(int), 0, nx_ - 1)
                        rw_ = np.clip(np.round(by(Wj[:, 1])).astype(int), 0, ny_ - 1)
                        dd_ = dlev[rw_, cw] * CELL
                        zb = np.where(dd_ <= 2.0, zfield[il[rw_, cw], jl[rw_, cw]], -np.inf)
                        zb = np.where(np.isfinite(zb), zb, -np.inf)
                        if len(ru):
                            s_, h_ = _croisements(x[li][ru], y[li][ru], z[li][ru], Sx[ru], Sy[ru], Sz[ru], W[j],
                                                  W[(j + 1) % Lp], (ztop[0], ztop[-1]))
                            if len(s_):
                                col = np.clip(np.round(s_ * ncut[j]).astype(int), 0, ncut[j])
                                u_, sec, cnt = _second_max(col, h_)
                                # (deux rayons différents sur la coupe ou ses voisines)
                                hc = np.full(ncut[j] + 1, -np.inf)
                                for dc in (-1, 0, 1):
                                    cc_ = np.clip(col + dc, 0, ncut[j])
                                    u2, s2, n2 = _second_max(cc_, h_)
                                    hc[u2[n2 >= 2]] = np.maximum(hc[u2[n2 >= 2]], s2[n2 >= 2])
                                zb = np.maximum(zb, hc)
                        # points de façade de chaque coupe (et de ses voisines) : le plus bas
                        lowf = np.full(ncut[j] + 1, np.inf)
                        sj = okp & (ej == j) if len(okp) else np.zeros(0, bool)
                        if sj.any():
                            wl_ = np.hypot(*(W[(j + 1) % Lp] - W[j]))
                            uu_ = (np.c_[fx[sj], fy[sj]] - W[j]) @ ((W[(j + 1) % Lp] - W[j]) / max(1e-9, wl_))
                            ee_ = (np.c_[fx[sj], fy[sj]] - W[j]) @ nrm[j]
                            ff = np.abs(ee_) < 1.5
                            cu = np.clip(np.round(uu_[ff] / max(wl_, 1e-9) * ncut[j]).astype(int), 0, ncut[j])
                            for dc in (-1, 0, 1):
                                np.minimum.at(lowf, np.clip(cu + dc, 0, ncut[j]), fz[sj][ff])
                        zbs_[j], lowfs_[j] = zb, lowf
                    # Pieds des murs : tout le tour du bâtiment d'un seul tenant (coupes de chaque mur sans la dernière, qui
                    # est la première du mur suivant), en boucle : les coins et les murs courts suivent leurs voisins.
                    def tour(L_):
                        return np.concatenate([L_[j][:-1] for j in range(Lp)])
                    ZB, LF, ZS, ZT = tour(zbs_), tour(lowfs_), tour(zss), tour(ztops)
                    nt = len(ZB)
                    lv3, zb3, bas3 = _pied(np.r_[ZB, ZB, ZB], np.r_[LF, LF, LF], np.r_[ZS, ZS, ZS], np.r_[ZT, ZT, ZT])
                    lvT, zbT = lv3[nt:2 * nt], zb3[nt:2 * nt]
                    for j in range(Lp):
                        q = (cum[j] + np.arange(ncut[j] + 1)) % nt
                        leve[j] = lvT[q]
                        zgs[j] = np.where(leve[j], zbT[q], zgs[j])
                        if stats is not None and 'pieds' in stats:
                            stats['pieds'].append({'k': k, 'j': j, 'niveau': _nom(opts), 'W0': W[j], 'W1': W[(j + 1) % Lp],
                                                   'zs': zss[j], 'ztop': ztops[j], 'zb': zbs_[j], 'lowf': lowfs_[j],
                                                   'lv': leve[j].copy()})
            # coins : une seule hauteur de pied pour les deux murs (la même coupe du tour, au millimètre près)
            for j in range(Lp):
                i = (j - 1) % Lp
                v_ = zgs[j][0] if leve[j][0] else min(zgs[i][-1], zgs[j][0])
                zgs[i][-1] = zgs[j][0] = v_
        # ---- RIVE, SOUS-FACE, MUR (relief mesuré), côté par côté
        tri_murs = 0
        for j in range(Lp):
            q = np.arange(cum[j], cum[j + 1] + 1)
            Bj = B1[q]
            zB = Bz[q]
            f = np.arange(ncut[j] + 1) / ncut[j]
            Wj, ztop, zg = Wjs[j], ztops[j], zgs[j]
            strip(np.c_[Bj, zB], np.c_[Bj, zB - RIVE], RIVE_)
            strip(np.c_[Bj, zB - RIVE], np.c_[Wj, ztop], SOUS_FACE)
            wl = np.hypot(*(W[(j + 1) % Lp] - W[j]))
            if wl < 1e-3:
                continue
            wd = (W[(j + 1) % Lp] - W[j]) / wl
            hmax = float(np.max(ztop - zg))
            nvr = max(1, int(np.ceil(hmax / GRILLE)))
            fr = np.arange(nvr + 1) / nvr
            Zg = ztop[None, :] + (zg - ztop)[None, :] * fr[:, None]
            disp = np.zeros_like(Zg)
            sj = okp & (ej == j) & (fz < ztp - 1.0) if len(okp) else np.zeros(0, bool)
            # (mur levé au-dessus du vide : plat ; ses coupes n'ont pas la même hauteur, la grille du relief s'y plierait)
            if not opts['plat'] and sj.any() and ncut[j] >= 2 and nvr >= 2 and not leve[j].any():
                pw = np.c_[fx[sj], fy[sj]] - W[j]
                u = pw @ wd
                e = pw @ nrm[j]
                inu = (u > -GRILLE) & (u < wl + GRILLE)
                z0 = float(np.min(zg))
                Dm = _carte_relief(u[inu], fz[sj][inu], e[inu], wl, z0, float(np.max(ztop)))
                if stats is not None and 'murs_detail' in stats:
                    stats['murs_detail'].append({'k': k, 'j': j, 'u': u[inu], 'z': fz[sj][inu], 'e': e[inu],
                                                 'c': c[pidx][sj][inu], 'D': Dm, 'z0': z0, 'wl': wl, 'd': dj[j],
                                                 'zg': zg, 'ztop': ztop, 'W0': W[j], 'W1': W[(j + 1) % Lp], 'n': nrm[j]})
                uu = (f * wl)[None, :].repeat(nvr + 1, 0)
                disp = _bilin(Dm, uu / GRILLE, (Zg - z0) / GRILLE)
                disp[0, :] = 0.0
                disp[-1, :] = 0.0
                disp[:, 0] = 0.0
                disp[:, -1] = 0.0
            XY = Wj[None, :, :] + disp[:, :, None] * nrm[j][None, None, :]
            P3 = np.c_[XY.reshape(-1, 2), Zg.reshape(-1)]
            nc_ = ncut[j] + 1
            rr, cc = np.meshgrid(np.arange(nvr), np.arange(ncut[j]), indexing='ij')
            a0 = (rr * nc_ + cc).ravel()
            tri = np.r_[np.c_[a0, a0 + nc_, a0 + nc_ + 1], np.c_[a0, a0 + nc_ + 1, a0 + 1]]
            if not disp.any():
                P3 = np.r_[np.c_[Wj, ztop], np.c_[Wj, zg]]
                kk = ncut[j] + 1
                i = np.arange(kk - 1)
                tri = np.r_[np.c_[i, kk + i, kk + i + 1], np.c_[i, kk + i + 1, i + 1]]
            # (pied au ras du haut : quadrilatères écrasés écartés)
            a, b_, c_ = P3[tri[:, 0]], P3[tri[:, 1]], P3[tri[:, 2]]
            tri = tri[np.linalg.norm(np.cross(b_ - a, c_ - a), axis=1) > 1e-6]
            tri_murs += len(tri)
            add(P3, tri, True, MUR)
        info['triangles_murs'] = tri_murs
        # ---- DESSOUS : surface tournée vers le bas, du pied des murs aux hauteurs libres mesurées à l'intérieur
        nlev = int(sum(int(lv.sum()) for lv in leve))
        info['colonnes_levees'] = nlev
        if nlev:
            BW = np.concatenate([Wjs[j][:-1] for j in range(Lp)])
            zBW = np.concatenate([zgs[j][:-1] for j in range(Lp)])
            ny_, nx_ = m.shape
            gx_, gy_ = np.meshgrid(X0 + np.arange(nx_) * CELL, Y0 + np.arange(ny_) * CELL)
            pin = points_in_poly(np.c_[gx_.ravel(), gy_.ravel()], W).reshape(ny_, nx_)
            ri_, ci_ = np.nonzero(pin)
            pts = np.c_[gx_[ri_, ci_], gy_[ri_, ci_]]
            if len(pts):
                dd = shapely.distance(shapely.points(pts), LinearRing(W))
                kp = dd > 0.3
                ri_, ci_, pts = ri_[kp], ci_[kp], pts[kp]
            zin = sol_z(pts[:, 0], pts[:, 1]) - 0.5 if len(pts) else np.zeros(0)
            if zfield is not None and len(pts):
                zf_ = zfield[ri_, ci_]
                zin = np.where(np.isfinite(zf_), np.maximum(zf_, zin), zin)
                zin = np.minimum(zin, zr[ir_m[ri_, ci_], ic_m[ri_, ci_]] - POUTRE)
            tri_d, P2d, kd = _toit(BW, pts)
            if len(tri_d):
                Zd = np.r_[zBW, zin[kd]]
                add(np.c_[P2d, Zd], tri_d[:, [0, 2, 1]], True, DESSOUS)  # (tourné vers le bas)
                info['dessous'] = True
                info['triangles_dessous'] = len(tri_d)
        if not V:
            return None
        info['types'] = np.array(K, np.int8)
        return np.array(V, np.float64), np.array(T, np.int64), np.array(M, bool), info

    for k in range(1, n + 1):
        box = sl[k - 1]
        if box is None:
            continue
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
        mes = m & (tk > -1e8)
        zhi = ndimage.maximum_filter(np.where(mes, tk, -1e9), 5)
        zlo = ndimage.minimum_filter(np.where(mes, tk, 1e9), 5)
        zhi = np.where(zhi > -1e8, zhi, zr)
        zlo = np.where(zlo < 1e8, zlo, zr)
        cs = find_contours(np.pad(m, 1).astype(float), 0.5)
        if not cs:
            continue
        cont = max(cs, key=len)[:-1] - 1
        C = np.c_[cont[:, 1], cont[:, 0]] * CELL
        if 0.5 * np.sum(C[:, 0] * np.roll(C[:, 1], -1) - np.roll(C[:, 0], -1) * C[:, 1]) < 0:
            C, cont = C[::-1], cont[::-1]
        if len(C) < 4:
            continue
        bord = (cont[:, 1] + c0 < 0.75) | (cont[:, 0] + r0 < 0.75) | (cont[:, 1] + c0 > nx - 1.75) | (cont[:, 0] + r0 > ny - 1.75)
        Vr, dp = regularise(C, bord=bord)
        X0 = ex0 + (c0 + 0.5) * CELL
        Y0 = ey0 + (r0 + 0.5) * CELL
        prep = (r0, r1, c0, c1, m, tk, zr, plab, plans, pente, zmes, zhi, zlo, C, bord, Vr, dp, X0, Y0)

        def sol_local(X, Y, _o=np.array([X0, Y0, 0.0])):
            return sol_z(X + _o[0], Y + _o[1])

        def dans_local(X, Y, _o=np.array([X0, Y0, 0.0])):
            return (X + _o[0] > ex0 + 1) & (X + _o[0] < ex1 - 1) & (Y + _o[1] > ey0 + 1) & (Y + _o[1] < ey1 - 1)

        res = None
        raisons_tot = []
        opts = {'plat': False, 'simple': False, 'mesure': False}
        for essai in range(4):
            r_ = construit(k, opts, prep)
            if r_ is None:
                break
            Vb, Tb, Mb, info = r_
            # (repère décalé : précision des calculs de contrôle)
            Vl = Vb - np.array([X0, Y0, 0.0])
            j_ = _juge(Vl, Tb, Mb, info['types'], sol_local, info.get('ecart_toit', np.zeros(0)), dans_local)
            raisons = _echoue(j_, opts)
            if res is None or len(raisons) < len(res[4]):
                res = (Vb, Tb, Mb, info, raisons, dict(opts), j_)
            nouveaux = {rp for _, rp in raisons if rp}
            if not nouveaux:
                break
            raisons_tot.append((_nom(opts), [r for r, _ in raisons], {a: b for a, b in j_.items() if a != 'triangles'}))
            for o in nouveaux:
                opts[o] = True
        if res is None:
            continue
        Vb, Tb, Mb, info, raisons, opts_, j_ = res
        nom = _nom(opts_)
        st['niveaux'][nom] = st['niveaux'].get(nom, 0) + 1
        st['replis'] += nom != 'complet'
        for r_, _ in raisons:
            st['defauts_restants'][r_] = st['defauts_restants'].get(r_, 0) + 1
        st['regularises'] += bool(info.get('regularise'))
        st['murs'] += info.get('murs', 0)
        st['murs_mesures'] += info.get('murs_mesures', 0)
        st['retraits'].extend(info.get('retraits', []))
        st['points_facade'] += info.get('points_facade', 0)
        st['points_facade_bruts'] += info.get('points_facade_bruts', 0)
        st['triangles_murs'] += info.get('triangles_murs', 0)
        st['avec_dessous'] += bool(info.get('dessous'))
        st['colonnes_levees'] += info.get('colonnes_levees', 0)
        st['rayons_libres'] += info.get('rayons', 0)
        cen = Vb.mean(0)
        st['par_batiment'].append({'k': int(k), 'ou': [round(float(v), 1) for v in cen], 'niveau': nom,
                                   'replis': [list(x) for x in raisons_tot], 'dessous': bool(info.get('dessous')),
                                   **j_})
        Vg.append(Vb)
        Tg.append(Tb + nvg[0])
        Mg.append(Mb)
        Kg.append(info['types'])
        nvg[0] += len(Vb)
    if not Vg:
        return np.zeros((0, 3)), np.zeros((0, 3), np.int64), np.zeros(0, bool)
    V = np.concatenate(Vg) - np.array([ox, oy, oz])
    st['types_triangles'] = np.concatenate(Kg)
    return V, np.concatenate(Tg), np.concatenate(Mg)
