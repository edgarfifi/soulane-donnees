# Relief HD, phase 5 (plan § 5.2 a) : les BÂTIMENTS d'un bloc, en maillage, à partir des points classés « bâtiment »
# (classe 6) du LiDAR HD. Appelé par bloc.py (les bâtiments rejoignent la surface du bloc : niveaux de détail, occlusion,
# paquet).
#
# - Emprise : cases de 0,5 m qui ont des points du bâtiment, réunies par voisinage (un bâtiment = un morceau d'au moins
#   8 m²), trous bouchés (cours exceptées si grandes).
# - Contour simplifié (Douglas-Peucker, 0,4 m) : des MURS DROITS, pas un escalier de cases.
# - Toit : hauteur la plus haute de chaque case (médiane 3 × 3 contre les antennes et les échos isolés), triangulé sur les
#   sommets du contour et les centres des cases.
# - Murs : verticaux, du bord du toit jusqu'à 0,5 m sous le sol (le sol, interpolé sous le bâtiment, ne laisse aucun jour).
# Sortie : sommets (L93 local), triangles, et un drapeau « mur » par sommet (le moteur les teinte en neutre : la photo,
# prise d'en haut, n'a rien à y montrer).
import numpy as np
from scipy import ndimage
from scipy.spatial import Delaunay
from skimage.measure import find_contours, approximate_polygon, points_in_poly

CELL = 0.5


def batiments(x, y, z, c, sol_z, ex0, ey0, ex1, ey1, ox, oy, oz):
    """x, y, z, c : points (L93) ; sol_z(X, Y) → altitude du sol (L93). Rend (V, T, mur) en repère local (−ox, −oy, −oz)."""
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
    # toit : trous comblés par le maximum voisin, puis médiane 3 × 3
    t = np.where(np.isfinite(top), top, -1e9)
    for _ in range(3):
        t = np.where(t > -1e8, t, ndimage.maximum_filter(t, size=3))
    t = np.where(occ, ndimage.median_filter(t, size=3), -1e9)
    lab, n = ndimage.label(occ)
    V, T, M = [], [], []
    nv = 0
    for k in range(1, n + 1):
        m = lab == k
        if m.sum() < 32:  # < 8 m²
            continue
        # Cases du bâtiment SANS mesure du toit (grand toit sans écho, cour bouchée par fill_holes) : la hauteur médiane du
        # toit mesuré (22/11/2026 : elles valaient −1e9 ; ces sommets tiraient des murs vers l'abîme et la boîte d'un nœud
        # sur 1 000 000 km aplatissait toute sa tuile en plateau à l'altitude de son plus haut point).
        mesure = m & (t > -1e8)
        if not mesure.any():
            continue
        fill = float(np.median(t[mesure]))
        tk = np.where(mesure, t, np.where(m, fill, -1e9))
        cs = find_contours(np.pad(m, 1).astype(float), 0.5)
        if not cs:
            continue
        cont = max(cs, key=len)
        poly = approximate_polygon(cont, tolerance=0.8)[:-1] - 1  # (ligne, colonne) en cases, sans la bordure
        if len(poly) < 3:
            continue
        # sens : on veut le contour dans le sens trigonométrique vu d'en haut (x = colonne, y = ligne)
        px = ex0 + (poly[:, 1] + 0.5) * CELL
        py = ey0 + (poly[:, 0] + 0.5) * CELL
        area = 0.5 * np.sum(px * np.roll(py, -1) - np.roll(px, -1) * py)
        if area < 0:
            px, py, poly = px[::-1], py[::-1], poly[::-1]
        # hauteur du toit aux sommets du contour : la plus haute des cases du bâtiment à moins d'une case
        rr = np.clip(np.round(poly[:, 0]).astype(int), 0, ny - 1)
        cc = np.clip(np.round(poly[:, 1]).astype(int), 0, nx - 1)
        tmax = ndimage.maximum_filter(tk, size=3)
        zt = tmax[rr, cc]
        zt = np.where(zt < -1e8, fill, zt)
        zg = sol_z(px, py) - 0.5
        zg = np.minimum(zg, zt - 1.0)
        # murs : un quadrilatère par côté, sommets propres (normales plates)
        L = len(px)
        for i in range(L):
            j = (i + 1) % L
            q = [(px[i], py[i], zt[i]), (px[j], py[j], zt[j]), (px[j], py[j], zg[j]), (px[i], py[i], zg[i])]
            V.extend(q)
            M.extend([True] * 4)
            # extérieur à DROITE du sens du contour (contour trigonométrique : intérieur à gauche)
            T.append((nv, nv + 3, nv + 1))
            T.append((nv + 1, nv + 3, nv + 2))
            nv += 4
        # toit : sommets du contour + centres des cases intérieures, triangulation de Delaunay gardée dans le contour
        rI, cI = np.nonzero(m)
        ip = np.c_[ex0 + (cI + 0.5) * CELL, ey0 + (rI + 0.5) * CELL]
        polyxy = np.c_[px, py]
        inside = points_in_poly(ip, polyxy)
        ip = ip[inside]
        iz = tk[rI[inside], cI[inside]]
        P2 = np.r_[np.c_[px, py], ip]
        Z2 = np.r_[zt, iz]
        if len(P2) < 3:
            continue
        try:
            tri = Delaunay(P2).simplices
        except Exception:
            continue
        cen = P2[tri].mean(1)
        keep = points_in_poly(cen, polyxy)
        tri = tri[keep]
        # orientation : normale vers le haut
        a, b2, c2 = P2[tri[:, 0]], P2[tri[:, 1]], P2[tri[:, 2]]
        cross = (b2[:, 0] - a[:, 0]) * (c2[:, 1] - a[:, 1]) - (b2[:, 1] - a[:, 1]) * (c2[:, 0] - a[:, 0])
        tri[cross < 0] = tri[cross < 0][:, [0, 2, 1]]
        V.extend(zip(P2[:, 0], P2[:, 1], Z2))
        M.extend([False] * len(P2))
        T.extend((tri + nv).tolist())
        nv += len(P2)
    if not V:
        return np.zeros((0, 3)), np.zeros((0, 3), np.int64), np.zeros(0, bool)
    V = np.array(V, np.float64) - np.array([ox, oy, oz])
    return V, np.array(T, np.int64), np.array(M, bool)
