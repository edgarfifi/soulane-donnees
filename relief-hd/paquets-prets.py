# Relief HD : PAQUETS PRÊTS à raccorder et assembler (job « paquets-liste » du workflow, 27/11/2026).
#
#   python3 relief-hd/paquets-prets.py <parties.txt> <faits.txt> [<paquets>]
#
# <parties.txt> : noms des objets de R2 sous v2-parties/ (« 14_<x>_<y>.tar » parties brutes d'une tuile faite,
#                 « 14_<x>_<y>.vide » tuile sans aucun point du LiDAR HD, hors de sa couverture).
# <faits.txt>   : noms des objets sous v2-chaine/ (« 12_<x>_<y>.fait » : paquet mis en ligne par la chaîne).
# <paquets>     : vide = tous les paquets prêts ; sinon une liste « x12/y12 … » à refaire telle quelle (essai).
# Écrit « paquets=<json> » et « n=<nombre> » (pour $GITHUB_OUTPUT) ; le bilan va dans $GITHUB_STEP_SUMMARY.
#
# Règle : CHAQUE PAQUET N'EST MIS EN LIGNE QU'UNE FOIS. Un paquet est prêt quand TOUTES les tuiles prévues de son carré
# 6 × 6 (ses 16 tuiles et l'anneau de leurs voisines) sont faites (ou vides) : ses raccords sont alors définitifs (les
# raccords d'une tuile ne dépendent que de ses 8 voisines). Tuiles prévues : les lots_utiles des stations et les 320 tuiles
# déjà faites (Courchevel, pilote). Les paquets déjà en ligne qu'une tuile des lots touche sont refaits une fois, de même.
# Pourquoi pas de seconde mise en ligne : l'app lit l'index d'un paquet (gardé un jour en cache) puis ses parties ; un
# paquet refait en place mélangerait pendant un jour un ancien index et de nouvelles parties.
import json, os, re, sys

here = os.path.dirname(os.path.abspath(__file__))
st = json.load(open(os.path.join(here, 'stations', 'stations-france-2km.json'), encoding='utf-8'))

lots = {t for l in st['lots_utiles'] for t in l['tuiles'].split()}
deja = st['deja_faites_z12']
prevues = set(lots)
for p in deja:
    px, py = map(int, p.split('/'))
    prevues |= {f'{x}/{y}' for x in range(4 * px, 4 * px + 4) for y in range(4 * py, 4 * py + 4)}


def carre(p):
    px, py = map(int, p.split('/'))
    return [f'{x}/{y}' for y in range(4 * py - 1, 4 * py + 5) for x in range(4 * px - 1, 4 * px + 5)]


def interieur(p):
    px, py = map(int, p.split('/'))
    return [f'{x}/{y}' for y in range(4 * py, 4 * py + 4) for x in range(4 * px, 4 * px + 4)]


faites, vides = set(), set()
for n in open(sys.argv[1], encoding='utf-8').read().split():
    m = re.fullmatch(r'14_(\d+)_(\d+)\.(tar|vide)', n)
    if m:
        (faites if m[3] == 'tar' else vides).add(f'{m[1]}/{m[2]}')
faits = set()
for n in open(sys.argv[2], encoding='utf-8').read().split():
    m = re.fullmatch(r'12_(\d+)_(\d+)\.fait', n)
    if m:
        faits.add(f'{m[1]}/{m[2]}')

paquets_lots = sorted({p for l in st['lots_utiles'] for p in l['z12']})
a_refaire = sorted(p for p in deja if any(t in lots for t in carre(p)))
demande = (sys.argv[3] if len(sys.argv) > 3 else '').split()

prets, attente = [], []
for p in paquets_lots + a_refaire:
    if p in faits:
        continue
    manque = [t for t in carre(p) if t in prevues and t not in faites and t not in vides]
    if manque:
        attente.append((p, manque))
    elif any(t in faites for t in interieur(p)):
        prets.append(p)
choix = demande if demande else prets
if len(choix) > 256:
    choix = choix[:256]  # (une matrice : 256 travaux au plus ; les autres au run suivant)

print('paquets=' + json.dumps(choix))
print(f'n={len(choix)}')
somme = os.environ.get('GITHUB_STEP_SUMMARY')
if somme:
    with open(somme, 'a', encoding='utf-8') as f:
        f.write(f'### Paquets du Relief HD\n\n')
        f.write(f'- tuiles faites sur R2 : {len(faites)}, vides : {len(vides)}, prévues : {len(prevues)}\n')
        f.write(f'- paquets en ligne par la chaîne : {len(faits)} ; prêts : {len(prets)} ; en attente : {len(attente)}\n')
        f.write(f'- choisis pour ce run : {len(choix)}{" (liste demandée)" if demande else ""}\n')
        for p, manque in attente[:15]:
            f.write(f'  - {p} attend {len(manque)} tuile(s) : {" ".join(manque[:6])}\n')
