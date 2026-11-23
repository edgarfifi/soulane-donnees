# Relief HD : retire, dans des tables d'arbres DÉJÀ fabriquées (.arb de arbres.py), les « arbres » à moins de CABLE_COULOIR
# de l'axe d'une remontée mécanique (BD TOPO) : même règle que arbres.py depuis le 23/11/2026, sans refaire la fabrication.
# Les tables d'origine sont gardées à côté (.arb.avant-cables).
#   python cables-arb.py <dossier des .arb> <dossier de travail (cache des remontées)>
import sys, os, json, math, glob, shutil
import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from arbres import cables, pres_cable, TO_L93  # noqa: E402
from bloc import tile_lonlat, R_EARTH  # noqa: E402

D, W = sys.argv[1], sys.argv[2]
total = 0
for fn in sorted(glob.glob(os.path.join(D, '16_*.arb'))):
    x16, y16 = map(int, os.path.basename(fn)[3:-4].split('_'))
    buf = open(fn, 'rb').read()
    nl = buf.index(b'\n')
    head = json.loads(buf[:nl])
    n = head['arbres']
    if not n or 'ecartes_sous_cable' in head:
        continue
    out = np.frombuffer(buf[nl + 1:nl + 1 + n * 20], np.float32).reshape(n, 5)
    nat = np.frombuffer(buf[nl + 1 + n * 20:nl + 1 + n * 21], np.uint8)
    seed = np.frombuffer(buf[nl + 1 + n * 21:nl + 1 + n * 22], np.uint8)
    lignes = cables(x16 >> 2, y16 >> 2, W)
    if not lignes:
        continue
    x12, y12 = x16 >> 4, y16 >> 4
    _, la = tile_lonlat(12, x12, y12)
    _, lb = tile_lonlat(12, x12 + 1, y12 + 1)
    k = 2 * math.pi * R_EARTH * math.cos(math.radians((la + lb) / 2))
    mx = out[:, 0].astype(np.float64) / k + x12 / 4096
    my = y12 / 4096 - out[:, 1].astype(np.float64) / k
    lon = mx * 360 - 180
    lat = np.degrees(np.arctan(np.sinh(math.pi * (1 - 2 * my))))
    X, Y = TO_L93.transform(lon, lat)
    pc = pres_cable(np.asarray(X), np.asarray(Y), lignes)
    head['ecartes_sous_cable'] = int(pc.sum())
    if pc.any():
        keep = ~pc
        head['arbres'] = int(keep.sum())
        shutil.copy(fn, fn + '.avant-cables')
        with open(fn, 'wb') as f:
            f.write((json.dumps(head) + '\n').encode())
            f.write(out[keep].tobytes()); f.write(nat[keep].tobytes()); f.write(seed[keep].tobytes())
        total += int(pc.sum())
        print(os.path.basename(fn), int(pc.sum()), flush=True)
print('total retirés', total)
