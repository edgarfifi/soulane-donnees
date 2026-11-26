# Commune (géocodage inverse de l'IGN) au centre de chaque domaine ; gardé dans communes-cache.json
import json, sys, time, urllib.request, os
cache = json.load(open('communes-cache.json')) if os.path.exists('communes-cache.json') else {}
for fn in sys.argv[1:]:
    r = json.load(open(fn))
    for s in r['stations']:
        k = f"{s['centre'][0]},{s['centre'][1]}"
        if k not in cache:
            u = f"https://data.geopf.fr/geocodage/reverse?lon={s['centre'][0]}&lat={s['centre'][1]}&index=address&limit=1"
            try:
                d = json.loads(urllib.request.urlopen(urllib.request.Request(u, headers={'User-Agent': 'Mozilla/5.0 (relief-hd)'}), timeout=30).read())
                cache[k] = d['features'][0]['properties'].get('city', '') if d.get('features') else ''
            except Exception:
                cache[k] = ''
            time.sleep(0.15)
        s['commune'] = cache[k]
    json.dump(r, open(fn, 'w'), ensure_ascii=False, indent=1)
json.dump(cache, open('communes-cache.json', 'w'), ensure_ascii=False)
print(len(cache), 'communes')
