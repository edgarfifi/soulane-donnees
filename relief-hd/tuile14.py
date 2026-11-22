# Relief HD : fabrique une tuile du zoom 14 (16 blocs z16) de bout en bout, sur une machine distante (workflow
# « Relief HD » du dépôt soulane-donnees) ou sur place : surface dure (bloc.py), arbres (arbres.py), puis niveaux
# z18 → z14 du paquet (paquet-build.mjs partiel). Sortie : <sortie>/14_<x>_<y>.noeuds, .z14, et les .arb des blocs.
#
#   python tuile14.py <x14> <y14> <dossier des dalles> <dossier de travail> <sortie> [--paquet <paquet-build.mjs>] [--arbres-seuls]
#
# --arbres-seuls (22/11/2026) : seulement les arbres (.arb des 16 blocs, journal « 14_<x>_<y>.arbres.json »), sans la
# surface ni le paquet : une retouche de arbres.py se refait en minutes, pas en heures.
import sys, os, subprocess, time, json, shutil

here = os.path.dirname(os.path.abspath(__file__))


def main():
    x14, y14 = int(sys.argv[1]), int(sys.argv[2])
    dalles, travail, sortie = sys.argv[3], sys.argv[4], sys.argv[5]
    paquet = sys.argv[sys.argv.index('--paquet') + 1] if '--paquet' in sys.argv else os.path.join(here, 'paquet.mjs')
    seuls = '--arbres-seuls' in sys.argv
    os.makedirs(travail, exist_ok=True)
    os.makedirs(sortie, exist_ok=True)
    T0 = time.time()

    def un_bloc(x16, y16):
        t = time.time()
        r2 = subprocess.run([sys.executable, os.path.join(here, 'arbres.py'), str(x16), str(y16), dalles, travail], capture_output=True, text=True)
        if seuls:
            fin = next((l for l in reversed(r2.stdout.strip().splitlines()) if l.startswith('{')), '')
            e = {'bloc': f'{x16}/{y16}', 'secondes': round(time.time() - t), 'arbres_ok': r2.returncode == 0, 'fin': fin[:300],
                 'erreur': (r2.stderr.strip().splitlines() or [''])[-1][:300] if r2.returncode else ''}
            print(json.dumps(e, ensure_ascii=False), flush=True)
            return e
        r = subprocess.run([sys.executable, os.path.join(here, 'bloc.py'), str(x16), str(y16), dalles, travail], capture_output=True, text=True)
        lignes = r.stdout.strip().splitlines()
        last = (lignes or [''])[-1][:300]
        # Un bloc sans aucun point n'est PAS réussi (22/11/2026 : dalles refusées au téléchargement, 16 blocs vides
        # comptés réussis) ; les lignes des dalles ratées sont gardées dans le journal.
        vide = last.startswith('aucun point')
        e = {'bloc': f'{x16}/{y16}', 'secondes': round(time.time() - t), 'bloc_ok': r.returncode == 0 and not vide, 'arbres_ok': r2.returncode == 0, 'fin': last,
             'dalles': [l[:300] for l in lignes if l.startswith('dalle') or l.startswith('DALLE')][:8],
             'erreur': (r.stderr.strip().splitlines() or [''])[-1][:300] if r.returncode else ''}
        print(json.dumps(e, ensure_ascii=False), flush=True)
        return e

    # Blocs fabriqués PAR DEUX (22/11/2026) : une machine du cloud a 4 cœurs et 16 Go, un bloc n'en occupait qu'une part.
    # Mêmes calculs, même résultat ; RELIEF_PARALLELE=1 pour revenir à un seul à la fois.
    from concurrent.futures import ThreadPoolExecutor
    blocs = [(x14 * 4 + i, y14 * 4 + j) for j in range(4) for i in range(4)]
    with ThreadPoolExecutor(max_workers=max(1, int(os.environ.get('RELIEF_PARALLELE', '2')))) as ex:
        journal = list(ex.map(lambda b: un_bloc(*b), blocs))
    if seuls:
        for f in os.listdir(travail):
            if f.endswith('.arb'):
                shutil.copy(os.path.join(travail, f), sortie)
        with open(os.path.join(sortie, f'14_{x14}_{y14}.arbres.json'), 'w', encoding='utf-8') as f:
            json.dump({'tuile': f'{x14}/{y14}', 'secondes': round(time.time() - T0), 'blocs': journal}, f, ensure_ascii=False, indent=1)
        sys.exit(0 if all(b['arbres_ok'] for b in journal) else 1)
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
