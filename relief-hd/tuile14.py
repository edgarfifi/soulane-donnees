# Relief HD : fabrique une tuile du zoom 14 (16 blocs z16) de bout en bout, sur une machine distante (workflow
# « Relief HD » du dépôt soulane-donnees) ou sur place : surface dure (bloc.py), arbres (arbres.py), puis niveaux
# z18 → z14 du paquet (paquet-build.mjs partiel). Sortie : <sortie>/14_<x>_<y>.noeuds, .z14, et les .arb des blocs.
#
#   python tuile14.py <x14> <y14> <dossier des dalles> <dossier de travail> <sortie> [--paquet <paquet-build.mjs>]
import sys, os, subprocess, time, json, shutil

here = os.path.dirname(os.path.abspath(__file__))


def main():
    x14, y14 = int(sys.argv[1]), int(sys.argv[2])
    dalles, travail, sortie = sys.argv[3], sys.argv[4], sys.argv[5]
    paquet = sys.argv[sys.argv.index('--paquet') + 1] if '--paquet' in sys.argv else os.path.join(here, 'paquet.mjs')
    os.makedirs(travail, exist_ok=True)
    os.makedirs(sortie, exist_ok=True)
    T0 = time.time()
    journal = []
    for j in range(4):
        for i in range(4):
            x16, y16 = x14 * 4 + i, y14 * 4 + j
            t = time.time()
            r = subprocess.run([sys.executable, os.path.join(here, 'bloc.py'), str(x16), str(y16), dalles, travail], capture_output=True, text=True)
            r2 = subprocess.run([sys.executable, os.path.join(here, 'arbres.py'), str(x16), str(y16), dalles, travail], capture_output=True, text=True)
            last = (r.stdout.strip().splitlines() or [''])[-1][:300]
            journal.append({'bloc': f'{x16}/{y16}', 'secondes': round(time.time() - t), 'bloc_ok': r.returncode == 0, 'arbres_ok': r2.returncode == 0, 'fin': last,
                            'erreur': (r.stderr.strip().splitlines() or [''])[-1][:300] if r.returncode else ''})
            print(json.dumps(journal[-1], ensure_ascii=False), flush=True)
    r = subprocess.run(['node', paquet, 'partiel', travail, sortie, f'{x14}/{y14}'], capture_output=True, text=True)
    print(r.stdout[-2000:], r.stderr[-2000:], flush=True)
    for f in os.listdir(travail):
        if f.endswith('.arb'):
            shutil.copy(os.path.join(travail, f), sortie)
    with open(os.path.join(sortie, f'14_{x14}_{y14}.journal.json'), 'w', encoding='utf-8') as f:
        json.dump({'tuile': f'{x14}/{y14}', 'secondes': round(time.time() - T0), 'blocs': journal, 'paquet_ok': r.returncode == 0}, f, ensure_ascii=False, indent=1)
    if r.returncode or not any(b['bloc_ok'] for b in journal):
        sys.exit(1)


if __name__ == '__main__':
    main()
