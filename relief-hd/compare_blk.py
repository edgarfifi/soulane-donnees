# Relief HD : compare deux blocs .blk de bloc.py (avant / après un changement de la fabrication) : sommets, triangles, arêtes
# de bord (trous), aire, écart géométrique des sommets, occlusion, canopée. Deux passes identiques de bloc.py diffèrent déjà
# de quelques sommets (Poisson en multi-fils n'est pas déterministe) : juger un changement à ce bruit de fond.
#   python compare_blk.py avant.blk apres.blk
import sys, json, numpy as np
from scipy.spatial import cKDTree
def lit(fn):
    b = open(fn, 'rb').read(); nl = b.index(b'\n'); h = json.loads(b[:nl]); n, m = h['sommets'], h['triangles']
    o = nl + 1
    W = np.frombuffer(b, np.float32, n * 3, o).reshape(n, 3); o += n * 12
    N = np.frombuffer(b, np.float32, n * 3, o).reshape(n, 3); o += n * 12
    ao = np.frombuffer(b, np.uint8, n, o); o += n
    can = np.frombuffer(b, np.uint8, n, o); o += n
    T = np.frombuffer(b, np.uint32, m * 3, o).reshape(m, 3)
    return h, W, N, ao, can, T, b[nl + 1:]
def bords(T):
    e = np.r_[T[:, [0, 1]], T[:, [1, 2]], T[:, [2, 0]]].astype(np.int64)
    n = int(T.max()) + 1
    key = e[:, 0] * n + e[:, 1]; rev = e[:, 1] * n + e[:, 0]
    sk = np.sort(key); i = np.searchsorted(sk, rev).clip(0, len(sk) - 1)
    return int((sk[i] != rev).sum())
def aire(W, T):
    return float(0.5 * np.linalg.norm(np.cross(W[T[:, 1]] - W[T[:, 0]], W[T[:, 2]] - W[T[:, 0]]), axis=1).sum())
def compare(fa, fb):
    ha, Wa, Na, aoa, ca, Ta, ba = lit(fa); hb, Wb, Nb, aob, cb, Tb, bb = lit(fb)
    r = {'identique_octet': ba == bb, 'sommets': (ha['sommets'], hb['sommets']), 'triangles': (ha['triangles'], hb['triangles']),
         'aretes_de_bord': (bords(Ta), bords(Tb)), 'aire_m2': (round(aire(Wa, Ta), 1), round(aire(Wb, Tb), 1))}
    d, j = cKDTree(Wb).query(Wa, k=1)
    d2, _ = cKDTree(Wa).query(Wb, k=1)
    r['ecart_sommets_m'] = {'median': float(np.median(d)), 'p99': float(np.percentile(d, 99)), 'p99.99': float(np.percentile(d, 99.99)), 'max_a_vers_b': float(d.max()), 'max_b_vers_a': float(d2.max()),
                            'plus_de_5cm': int((d > 0.05).sum() + (d2 > 0.05).sum())}
    m = d < 1e-4
    r['occlusion_ecart'] = {'sommets_communs': int(m.sum()), 'max': int(np.abs(aoa[m].astype(int) - aob[j[m]].astype(int)).max()) if m.any() else None,
                            'moyen': float(np.abs(aoa[m].astype(int) - aob[j[m]].astype(int)).mean()) if m.any() else None,
                            'plus_de_8': int((np.abs(aoa[m].astype(int) - aob[j[m]].astype(int)) > 8).sum())}
    r['canopee_ecart_max'] = int(np.abs(ca[m].astype(int) - cb[j[m]].astype(int)).max()) if m.any() else None
    r['secondes'] = (ha.get('secondes', {}).get('total'), hb.get('secondes', {}).get('total'))
    return r
if __name__ == '__main__':
    print(json.dumps(compare(sys.argv[1], sys.argv[2]), indent=1, default=str))
