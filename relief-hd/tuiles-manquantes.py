# Relief HD : TUILES MANQUANTES des lots déjà lancés (jobs « liste » et « suite » du workflow, 27/11/2026).
#
#   python3 relief-hd/tuiles-manquantes.py <parties.txt> <chaine.txt> [<lot en cours>]
#
# <parties.txt> : objets de R2 sous v2-parties/ (14_<x>_<y>.tar faite, .vide hors du LiDAR HD).
# <chaine.txt>  : objets sous v2-chaine/ (lot_<n>.lance : lot déjà lancé par la chaîne).
# Écrit les tuiles « x/y » des lots lancés (sauf <lot en cours>) qui ne sont ni faites ni vides, séparées par des espaces.
# Pourquoi : une tuile dont la MACHINE entière a été arrêtée (manque de mémoire, 27/11/2026 : tuile 8596/6056 du lot 16,
# code 143, aucune étape suivante, pas même la seconde fabrication à un bloc) n'a rien laissé sur R2 ; elle est reprise
# au lot suivant, un bloc à la fois, puis une dernière fois après le dernier lot.
import json, os, re, sys

here = os.path.dirname(os.path.abspath(__file__))
st = json.load(open(os.path.join(here, 'stations', 'stations-france-2km.json'), encoding='utf-8'))
faites = set()
for n in open(sys.argv[1], encoding='utf-8').read().split():
    m = re.fullmatch(r'14_(\d+)_(\d+)\.(tar|vide)', n)
    if m:
        faites.add(f'{m[1]}/{m[2]}')
lances = set()
for n in open(sys.argv[2], encoding='utf-8').read().split():
    m = re.fullmatch(r'lot_(\d+)\.lance', n)
    if m:
        lances.add(int(m[1]))
if len(sys.argv) > 3 and sys.argv[3].strip():
    lances.discard(int(sys.argv[3]))
manquent = [t for i in sorted(lances) for t in st['lots_utiles'][i]['tuiles'].split() if t not in faites]
print(' '.join(manquent))
