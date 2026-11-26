# Extrait du fichier mondial d'OpenSnowMap (planet_pistes.osm.gz) les pistes de descente, remontées et domaines skiables
# (landuse=winter_sports) dans un cadre autour de la France métropolitaine et de la Corse. Sortie : stations-brut.json
import osmium, json, sys, math
LON0, LON1, LAT0, LAT1 = -5.6, 9.9, 41.2, 51.2
REM = {'cable_car', 'gondola', 'mixed_lift', 'chair_lift', 'drag_lift', 't-bar', 'j-bar', 'platter', 'rope_tow', 'magic_carpet', 'funicular'}
out = {'pistes': [], 'remontees': [], 'domaines': []}
def dans(coords):
    return any(LON0 <= x <= LON1 and LAT0 <= y <= LAT1 for x, y in coords[:: max(1, len(coords) // 8)])
class H(osmium.SimpleHandler):
    def way(self, w):
        t = w.tags
        pt = t.get('piste:type', '')
        aw = t.get('aerialway', '')
        if 'downhill' not in pt and aw not in REM:
            return
        try:
            c = [(n.lon, n.lat) for n in w.nodes]
        except osmium.InvalidLocationError:
            return
        if len(c) < 2 or not dans(c):
            return
        f = {'id': w.id, 'nom': t.get('name') or t.get('piste:name') or '', 'c': [(round(x, 6), round(y, 6)) for x, y in c]}
        if 'downhill' in pt:
            f['aire'] = t.get('area') == 'yes'
            out['pistes'].append(f)
        if aw in REM:
            f2 = dict(f); f2['type'] = aw
            out['remontees'].append(f2)
    def area(self, a):
        if a.tags.get('landuse') != 'winter_sports':
            return
        try:
            for ring in a.outer_rings():
                c = [(n.lon, n.lat) for n in ring]
                if len(c) >= 3 and dans(c):
                    out['domaines'].append({'id': a.orig_id(), 'nom': a.tags.get('name', ''), 'c': [(round(x, 6), round(y, 6)) for x, y in c]})
        except osmium.InvalidLocationError:
            return
H().apply_file(sys.argv[1], locations=True)
json.dump(out, open(sys.argv[2], 'w'))
print({k: len(v) for k, v in out.items()})
