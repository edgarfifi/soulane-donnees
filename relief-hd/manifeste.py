# Relief HD : MANIFESTE des paquets refait d'après ce qui est VRAIMENT sur R2 (job « manifeste » du workflow, 27/11/2026).
#
#   python3 relief-hd/manifeste.py <cles.txt> <ancien manifest.json> <nouveau manifest.json>
#
# <cles.txt> : clés de R2 sous <préfixe>/12/ (aws s3 ls --recursive). Un paquet compte quand son INDEX « <x>/<y>.srm » est
# là : il est envoyé en dernier, après ses parties « <y>-<n>.srm » ; ses arbres : « <y>.sra ».
# L'ancien manifeste (celui en ligne) garde son ordre, les nouveaux paquets suivent. Un paquet de l'ancien qui manquerait
# sur R2 arrête tout (code 3) : rien n'est retiré du manifeste en ligne. Sortie : « change=0|1 » et le bilan.
import json, re, sys

packs, trees = set(), set()
for k in open(sys.argv[1], encoding='utf-8').read().split():
    m = re.search(r'/12/(\d+)/(\d+)\.(srm|sra)$', k)
    if m:
        (packs if m[3] == 'srm' else trees).add(f'{m[1]}/{m[2]}')
ancien = json.load(open(sys.argv[2], encoding='utf-8'))
if ancien.get('version') != 2:
    sys.exit('ancien manifeste illisible')
perdus = [p for p in ancien['packs'] if p not in packs] + [t for t in ancien.get('trees', []) if t not in trees]
if perdus:
    print('PERDUS sur R2 :', ' '.join(perdus), file=sys.stderr)
    sys.exit(3)
cle = lambda p: tuple(map(int, p.split('/')))
np_ = list(ancien['packs']) + sorted(packs - set(ancien['packs']), key=cle)
nt = list(ancien.get('trees', [])) + sorted(trees - set(ancien.get('trees', [])), key=cle)
nouveau = {'version': 2, 'packs': np_, 'trees': nt}
json.dump(nouveau, open(sys.argv[3], 'w', encoding='utf-8'), separators=(',', ':'))
change = np_ != ancien['packs'] or nt != ancien.get('trees', [])
print(f'change={int(change)}')
print(f'paquets {len(ancien["packs"])} → {len(np_)}, arbres {len(ancien.get("trees", []))} → {len(nt)}', file=sys.stderr)
