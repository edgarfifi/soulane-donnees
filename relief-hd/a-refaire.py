# Relief HD : liste les tuiles z14 à refaire, d'après les journaux de fabrication (<parties>/14_<x>_<y>.journal.json),
# pour relancer SEULEMENT celles-là (workflow « Relief HD », champ « tuiles »).
#   python a-refaire.py <dossier des parties> [echecs] [batiments] [arbres]
#     echecs    : un bloc raté (dalle tronquée, lecture impossible…) ou une tuile non empaquetée ;
#     batiments : la tuile a des bâtiments (après une retouche de batiments.py) ;
#     arbres    : un bloc dont la détection des arbres a échoué.
# Sans critère : echecs. Sortie : les tuiles « x/y » séparées par des espaces, prêtes à coller.
import sys, os, json, glob, re

d = sys.argv[1]
crit = set(sys.argv[2:]) or {'echecs'}
out = set()
for f in glob.glob(os.path.join(d, '14_*.journal.json')):
    j = json.load(open(f, encoding='utf-8'))
    t = j['tuile']
    if 'echecs' in crit and (not j.get('paquet_ok', True) or any(not b['bloc_ok'] for b in j['blocs'])):
        out.add(t)
    if 'arbres' in crit and any(not b['arbres_ok'] for b in j['blocs']):
        out.add(t)
    if 'batiments' in crit:
        for b in j['blocs']:
            m = re.search(r'"batiments_sommets": (\d+)', b.get('fin', ''))
            if m and int(m.group(1)) > 0:
                out.add(t)
                break
print(' '.join(sorted(out)))
