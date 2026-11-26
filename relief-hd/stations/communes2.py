# Commune par la couche des communes d'ADMIN EXPRESS (IGN) pour les domaines sans commune trouvée par le géocodage
import json, sys, time, urllib.request
cache = json.load(open('communes-cache.json'))
for k, v in list(cache.items()):
    if v:
        continue
    lon, lat = map(float, k.split(','))
    u = ('https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=ADMINEXPRESS-COG-CARTO.LATEST:commune'
         f'&OUTPUTFORMAT=application/json&COUNT=1&PROPERTYNAME=nom_officiel&BBOX={lat-0.0005},{lon-0.0005},{lat+0.0005},{lon+0.0005},urn:ogc:def:crs:EPSG::4326')
    try:
        d = json.loads(urllib.request.urlopen(urllib.request.Request(u, headers={'User-Agent': 'Mozilla/5.0 (relief-hd)'}), timeout=30).read())
        cache[k] = d['features'][0]['properties']['nom_officiel'] if d.get('features') else ''
    except Exception as e:
        print('erreur', k, e)
    time.sleep(0.15)
json.dump(cache, open('communes-cache.json', 'w'), ensure_ascii=False)
for fn in sys.argv[1:]:
    r = json.load(open(fn))
    for s in r['stations']:
        s['commune'] = cache.get(f"{s['centre'][0]},{s['centre'][1]}", '')
        if not s['nom']:
            s['nom'] = f"(domaine de {s['commune']})" if s['commune'] else '(sans nom)'
    json.dump(r, open(fn, 'w'), ensure_ascii=False, indent=1)
print(sum(1 for v in cache.values() if not v), 'sans commune')
