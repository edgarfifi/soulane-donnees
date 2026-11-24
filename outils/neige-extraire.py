#!/usr/bin/env python3
# Calque « Neige prévue » de Soulane : lit la dernière prévision AROME de Météo-France (grille 0,025°, Licence Ouverte 2.0,
# fichiers publics de meteofrance-pnt.s3.rbx.io.cloud.ovh.net) et en extrait, heure par heure, ce dont le calcul a besoin :
# précipitation cumulée (tp), neige et grésil cumulés (tsnowp, tgrp : la part solide selon le modèle), température et
# humidité à 2 m (2t, 2r), et le relief du modèle (h). Rien d'autre : le calcul (neige selon l'altitude) est fait par outils/neige.mjs, avec la même
# logique que l'app (src/shared/core/snowForecast.ts du dépôt de l'app).
# Fichier tenu dans le dépôt de l'app Soulane (scripts/soulane-donnees/), envoyé ici par scripts/pistes-outil.mjs --publier.
#
#   python3 outils/neige-extraire.py <dossier de sortie> [--run 2026-11-24T06:00:00Z]
#   python3 outils/neige-extraire.py --derniere      écrit seulement l'heure de la dernière prévision complète (ou rien)
#
# Sortie : meta.json, oro.f32, puis tp_<h>.f32, t2_<h>.f32, rh_<h>.f32, sn_<h>.f32, gr_<h>.f32 (float32, lignes du nord au sud, colonnes
# d'ouest en est, découpées sur la zone de Soulane).
import json
import os
import sys
import urllib.request
from datetime import datetime, timedelta, timezone

import eccodes
import numpy as np

BASE = 'https://meteofrance-pnt.s3.rbx.io.cloud.ovh.net/pnt'
GROUPS = ['00H06H', '07H12H', '13H18H', '19H24H', '25H30H', '31H36H', '37H42H', '43H48H', '49H51H']
# Zone gardée (degrés) : la France, les Alpes jusqu'au bord est d'AROME, les Pyrénées, la Corse.
NORTH, SOUTH, WEST, EAST = 51.2, 41.0, -5.2, 16.0
# Grille d'AROME 0,025° (vérifiée à chaque fichier).
LAT0, LON0, STEP, NI, NJ = 55.4, -12.0, 0.025, 1121, 717


def url(run, pkg, group):
    return f'{BASE}/{run}/arome/0025/{pkg}/arome__0025__{pkg}__{group}__{run}.grib2'


def exists(u):
    try:
        req = urllib.request.Request(u, method='HEAD')
        with urllib.request.urlopen(req, timeout=30) as r:
            return r.status == 200
    except Exception:
        return False


def latest_run(now):
    """La prévision complète la plus récente (toutes les 3 h, publiée 3 à 5 h plus tard)."""
    t = now.replace(minute=0, second=0, microsecond=0)
    t -= timedelta(hours=t.hour % 3)
    for _ in range(12):
        run = t.strftime('%Y-%m-%dT%H:00:00Z')
        if exists(url(run, 'SP1', '43H48H')):
            return run
        t -= timedelta(hours=3)
    return None


def download(u, path):
    tmp = path + '.part'
    with urllib.request.urlopen(u, timeout=300) as r, open(tmp, 'wb') as f:
        while True:
            b = r.read(1 << 20)
            if not b:
                break
            f.write(b)
    os.replace(tmp, path)


J0, J1 = round((LAT0 - NORTH) / STEP), round((LAT0 - SOUTH) / STEP)
I0, I1 = round((WEST - LON0) / STEP), round((EAST - LON0) / STEP)


def crop(h):
    ni, nj = eccodes.codes_get(h, 'Ni'), eccodes.codes_get(h, 'Nj')
    if (ni, nj) != (NI, NJ) or abs(eccodes.codes_get(h, 'latitudeOfFirstGridPointInDegrees') - LAT0) > 1e-6:
        raise SystemExit(f'Grille inattendue ({ni} x {nj}) : à vérifier avant de publier.')
    a = eccodes.codes_get_values(h).reshape(NJ, NI)[J0:J1 + 1, I0:I1 + 1]
    return np.ascontiguousarray(a, dtype=np.float32)


def main():
    if '--derniere' in sys.argv:
        print(latest_run(datetime.now(timezone.utc)) or '')
        return
    out = sys.argv[1]
    os.makedirs(out, exist_ok=True)
    run = sys.argv[sys.argv.index('--run') + 1] if '--run' in sys.argv else latest_run(datetime.now(timezone.utc))
    if not run:
        raise SystemExit('Aucune prévision AROME complète trouvée dans les 36 dernières heures.')
    print('Prévision', run)
    hours = []
    # Relief du modèle (champ h, échéance 0 du paquet SP2).
    sp2 = os.path.join(out, 'sp2.grib2')
    download(url(run, 'SP2', '00H06H'), sp2)
    with open(sp2, 'rb') as f:
        while True:
            h = eccodes.codes_grib_new_from_file(f)
            if h is None:
                break
            if eccodes.codes_get(h, 'shortName') == 'h' and eccodes.codes_get(h, 'stepRange') == '0':
                crop(h).tofile(os.path.join(out, 'oro.f32'))
            eccodes.codes_release(h)
    os.remove(sp2)
    if not os.path.exists(os.path.join(out, 'oro.f32')):
        raise SystemExit('Relief du modèle introuvable dans le paquet SP2.')
    for g in GROUPS:
        u = url(run, 'SP1', g)
        if not exists(u):
            if g == '49H51H':
                break  # certaines prévisions s'arrêtent à 48 h
            raise SystemExit(f'Paquet manquant : {u}')
        path = os.path.join(out, 'sp1.grib2')
        download(u, path)
        with open(path, 'rb') as f:
            while True:
                h = eccodes.codes_grib_new_from_file(f)
                if h is None:
                    break
                sn = eccodes.codes_get(h, 'shortName')
                sr = eccodes.codes_get(h, 'stepRange')
                name = {'tp': 'tp', '2t': 't2', '2r': 'rh', 'tsnowp': 'sn', 'tgrp': 'gr'}.get(sn)
                if name:
                    hour = int(sr.split('-')[-1])
                    crop(h).tofile(os.path.join(out, f'{name}_{hour}.f32'))
                    if name == 't2':
                        hours.append(hour)
                eccodes.codes_release(h)
        os.remove(path)
        print('  ', g, 'lu')
    meta = {
        'run': run,
        'model': 'AROME 0,025° (Météo-France)',
        'lat0': round(LAT0 - J0 * STEP, 6),
        'lon0': round(LON0 + I0 * STEP, 6),
        'dlat': STEP,
        'dlon': STEP,
        'ni': I1 - I0 + 1,
        'nj': J1 - J0 + 1,
        'hours': sorted(set(hours)),
    }
    with open(os.path.join(out, 'meta.json'), 'w') as f:
        json.dump(meta, f)
    print('Extrait :', meta['ni'], 'x', meta['nj'], 'cases,', len(meta['hours']), 'heures')


if __name__ == '__main__':
    main()
