# Tableau par massif (markdown) : stations, tuiles z12 / z14, surface, durées sur 16 et 40 machines avant / après.
# python tableau.py stations-france-2km.json <min par tuile z14 avant> <min après>
import json, sys
r = json.load(open(sys.argv[1])); ta, tp = float(sys.argv[2]), float(sys.argv[3])
def j(n, t, m):  # jours de fabrication (n tuiles z14 de t min sur m machines)
    return n * t / m / 60 / 24
lig = ['| massif | domaines (dont ≥ 10 remontées) | tuiles z12 | tuiles z14 (z12 complètes) | surface km² | tuiles z14 utiles | 16 machines avant → après | 40 machines avant → après |',
       '|---|---:|---:|---:|---:|---:|---:|---:|']
T = {'s': 0, 'g': 0, 'z12': 0, 'km2': 0, 'u': 0}
for m, p in r['massifs'].items():
    if not p['stations']:
        continue
    n12 = len(p['z12']); n14 = 16 * n12
    T['s'] += p['stations']; T['g'] += p['grandes']; T['z12'] += n12; T['km2'] += p['surface_km2']; T['u'] += p['z14_utiles']
    lig.append(f"| {m} | {p['stations']} ({p['grandes']}) | {n12} | {n14} | {p['surface_km2']:,} | {p['z14_utiles']} | "
               f"{j(n14, ta, 16):.1f} → {j(n14, tp, 16):.1f} j | {j(n14, ta, 40):.1f} → {j(n14, tp, 40):.1f} j |".replace(',', ' '))
n14 = 16 * T['z12']
lig.append(f"| **total** | **{T['s']} ({T['g']})** | **{T['z12']}** | **{n14}** | **{T['km2']:,}** | **{T['u']}** | "
           f"**{j(n14, ta, 16):.1f} → {j(n14, tp, 16):.1f} j** | **{j(n14, ta, 40):.1f} → {j(n14, tp, 40):.1f} j** |".replace(',', ' '))
lig.append(f"| *tuiles utiles seulement* | | | **{T['u']}** | | | **{j(T['u'], ta, 16):.1f} → {j(T['u'], tp, 16):.1f} j** | **{j(T['u'], ta, 40):.1f} → {j(T['u'], tp, 40):.1f} j** |")
print('\n'.join(lig))
