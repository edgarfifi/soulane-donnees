# Relief HD des stations de ski alpin de France : zones et lots (26/11/2026)

Liste des zones à fabriquer pour avoir le Relief HD de toutes les stations de ski alpin françaises, en tuiles z12
complètes (les paquets sont par tuile z12), prête à donner au workflow `relief-hd.yml` par lots de 256 tuiles z14 au plus
(limite d'une matrice). **Rien n'a été fabriqué ni publié.**

## Sources et méthode

- **Pistes et remontées** : OpenStreetMap, par le fichier mondial quotidien d'OpenSnowMap (`planet_pistes.osm.gz`, celui
  du robot des pistes ; © contributeurs OpenStreetMap, ODbL). Pistes `piste:type=downhill`, remontées `aerialway=*`
  (télécabines, télésièges, téléskis, fils neige, tapis…), domaines `landuse=winter_sports`.
- **France** : départements d'ADMIN EXPRESS (IGN) ; seuls les objets dont le milieu est en France comptent, et seule la
  partie française de chaque zone (une tuile z12 qui déborde sur l'Italie ou la Suisse reste dans la liste : `bloc.py` y
  saute désormais les dalles hors du catalogue de l'IGN sans faire échouer la tuile).
- **Domaine skiable** : pistes, remontées et polygones `winter_sports` à moins de ~1 km les uns des autres (grille de
  200 m), avec au moins une remontée (hors tapis) et 1 km de pistes de descente. Les domaines reliés comptent pour un
  (3 Vallées, Paradiski, Portes du Soleil, Tignes - Val d'Isère…). Écartés : Amnéville (piste couverte du Snowhall),
  Blaye-les-Mines (piste synthétique de Cap Découverte).
- **Zone** : pistes et remontées + une **marge de 2 km** (hors-piste, sommets voisins, versants vus depuis les pistes) ;
  variante à 3 km dans `stations-france-3km.json`. Toute tuile z12 qui touche la zone est prise entière.
- **Massif** : département du centre du domaine (Alpes du Nord : 74, 73, 38, 26 ; Alpes du Sud : 05, 04, 06, 84 ;
  Pyrénées : 64, 65, 31, 09, 11, 66 ; Massif central, Jura, Vosges, Corse).
- **Déjà faites, exclues** : Courchevel (z12 2122-2124 × 1466-1467) et le pilote (2121/1467, 2121-2123 × 1468-1469,
  2122/1470, 2126-2127 × 1465-1467) : 20 tuiles z12, toutes dans les Alpes du Nord.
- **Nom** : polygones `winter_sports` nommés du domaine, sinon la commune du centre (géocodage inverse de l'IGN, puis
  communes d'ADMIN EXPRESS).

## Résultat (marge 2 km)

| massif | domaines (dont ≥ 10 remontées) | tuiles z12 | tuiles z14 (z12 complètes) | surface km² | tuiles z14 utiles | 16 machines avant → après | 40 machines avant → après |
|---|---:|---:|---:|---:|---:|---:|---:|
| Alpes du Nord | 52 (34) | 201 | 3216 | 9 440 | 1801 | 5.2 → 4.1 j | 2.1 → 1.6 j |
| Alpes du Sud | 38 (16) | 118 | 1888 | 5 749 | 894 | 3.0 → 2.4 j | 1.2 → 1.0 j |
| Pyrénées | 29 (18) | 80 | 1280 | 4 128 | 556 | 2.1 → 1.6 j | 0.8 → 0.7 j |
| Massif central | 14 (4) | 46 | 736 | 2 194 | 257 | 1.2 → 0.9 j | 0.5 → 0.4 j |
| Jura | 16 (3) | 44 | 704 | 1 989 | 290 | 1.1 → 0.9 j | 0.5 → 0.4 j |
| Vosges | 13 (4) | 34 | 544 | 1 458 | 237 | 0.9 → 0.7 j | 0.3 → 0.3 j |
| Corse | 3 (0) | 6 | 96 | 316 | 35 | 0.2 → 0.1 j | 0.1 → 0.0 j |
| **total** | **165 (79)** | **529** | **8464** | **25 274** | **4070** | **13.6 → 10.8 j** | **5.4 → 4.3 j** |
| *tuiles utiles seulement* | | | **4070** | | | **6.5 → 5.2 j** | **2.6 → 2.1 j** |

Durées : tuile z14 « avant » = 37 min (mesure du cloud, deux blocs à la fois), « après » = 29,5 min (accélérations de
`bloc.py` du 26/11, cf. `relief-hd/acceleration-26-11.md`) ; jours de fabrication continue, sans compter les tuiles à
refaire. Avant, ~23 % des tuiles manquaient de mémoire à deux blocs (tuile en échec, à refaire à un bloc : ~1 h de plus
chacune) : en moyenne ~51 min par tuile avant, soit **18,7 j sur 16 machines (7,5 j sur 40)** pour toutes les tuiles z12. Après,
aucun bloc n'a manqué de mémoire sur la tuile mesurée (pic d'un bloc : 6,3-7 → 5,1 Go au plus).

**Proposition d'ordre** : d'abord les `lots_utiles` (4 070 tuiles z14 : toutes les stations en **~5 jours sur 16 machines,
~2 sur 40**), grandes stations des Alpes du Nord en tête, puis le reste des tuiles z12 pendant l'hiver.

**Tuiles utiles seulement** : une tuile z12 n'est souvent touchée que sur un coin. `paquet-build.mjs` assemble aussi une
tuile z12 incomplète (il saute les tuiles z14 absentes) : ne fabriquer que les tuiles z14 qui touchent une zone diviserait
le travail par deux (`lots_utiles`), le reste des tuiles z12 pouvant venir pendant l'hiver.

Marge 3 km : 627 tuiles z12 (10032 z14), dont 5458 z14 utiles ; 16 machines après : 12.8 j (tuiles utiles : 7.0 j).

## Les plus grands domaines (remontées hors tapis, pistes de descente)

| domaine | massif | dép. | remontées | pistes (km) | tuiles z12 | tuiles z14 utiles |
|---|---|---|---:|---:|---:|---:|
| Les Houches (Chamonix) / Les Contamines / Cordon | Alpes du Nord | 74 | 257 | 704 | 20 | 222 |
| La Rosière / La Plagne / Les Arcs / Peisey-Vallandry | Alpes du Nord | 73 | 152 | 1036 | 18 | 157 |
| Les 3 Vallées / Val Thorens | Alpes du Nord | 73 | 137 | 1315 | 16 | 154 |
| La Chapelle d'Abondance / Les Gets-Morzine / Les Portes du Soleil | Alpes du Nord | 74 | 117 | 457 | 13 | 102 |
| Albiez-Montrond / Les Karellis / Les Sybelles | Alpes du Nord | 73 | 80 | 263 | 11 | 96 |
| Tignes - Val d'Isère | Alpes du Nord | 73 | 70 | 398 | 12 | 92 |
| Alpe d'Huez Grand Domaine | Alpes du Nord | 38 | 65 | 207 | 8 | 70 |
| Le Grand Massif / Flaine | Alpes du Nord | 74 | 56 | 383 | 8 | 73 |
| Serre Chevalier | Alpes du Sud | 05 | 55 | 335 | 8 | 56 |
| Les Deux Alpes / La Grave / Le Chazelet | Alpes du Sud | 05 | 49 | 209 | 8 | 78 |
| Gérardmer / La Bresse - Hohneck / La Bresse - Lispach | Vosges | 88 | 47 | 60 | 6 | 62 |
| Chastreix / Station de ski de Super-Besse / Le Grand Sancy | Massif central | 63 | 44 | 80 | 7 | 46 |
| Le Grand Domaine | Alpes du Nord | 73 | 42 | 245 | 7 | 56 |
| Espace Haute Maurienne Vanoise / Val Cenis / Bonneval-sur-Arc | Alpes du Nord | 73 | 40 | 132 | 9 | 87 |
| Roc d'Enfer / Praz de Lys Sommand / Les Portes du Soleil | Alpes du Nord | 74 | 37 | 78 | 6 | 58 |
| Brévent/Flégère (Chamonix) / Les Grands Montets / Les Chosalets (Chamo | Alpes du Nord | 74 | 36 | 143 | 8 | 82 |
| Domaine Skiable Espace Lumière | Alpes du Sud | 04 | 33 | 312 | 6 | 47 |
| Vars/Risoul / Vars / Risoul | Alpes du Sud | 05 | 33 | 134 | 5 | 49 |
| Valloire - Galibier Thabor | Alpes du Nord | 73 | 30 | 199 | 6 | 47 |
| Grand Tourmalet | Pyrénées | 65 | 30 | 76 | 8 | 43 |
| Ax 3 Domaines | Pyrénées | 09 | 25 | 73 | 4 | 30 |
| Domaine de Saint-Lary | Pyrénées | 65 | 24 | 80 | 4 | 38 |
| Montgenèvre | Alpes du Sud | 05 | 23 | 186 | 5 | 32 |
| Domaine de Beldina / Les 7 Laux | Alpes du Nord | 38 | 22 | 64 | 6 | 32 |
| Le Grand Bornand | Alpes du Nord | 74 | 22 | 61 | 6 | 33 |
| Orcières Merlette | Alpes du Sud | 05 | 22 | 50 | 4 | 29 |
| Dévoluy | Alpes du Sud | 05 | 21 | 91 | 5 | 44 |
| Domaine skiable Valberg | Alpes du Sud | 06 | 21 | 79 | 4 | 35 |
| Ancelle / Domaine Skiable Saint-Léger-Les-Mélèzes | Alpes du Sud | 05 | 21 | 46 | 6 | 31 |
| Villard de Lans - Corrençon | Alpes du Nord | 38 | 20 | 66 | 4 | 33 |

Liste complète (165 domaines, centre, département, commune, tuiles z12) dans `stations-france-2km.json`.

## Fichiers

- `stations-france-2km.json` (et `-3km`) : `massifs` (domaines, tuiles z12 à faire, surface, tuiles z14 utiles),
  `stations` (une ligne par domaine), `lots` (34 lots de 16 tuiles z12 complètes = 256 tuiles z14 au plus, grands domaines
  d'abord, Alpes du Nord puis Alpes du Sud, Pyrénées, Massif central, Jura, Vosges, Corse), `lots_utiles` (17 lots des
  seules tuiles z14 utiles, une tuile z12 jamais coupée entre deux lots).
- Un lot pour le workflow (champ « Tuiles du zoom 14 », tuiles séparées par des espaces) :

```bash
python3 -c "import json; print(json.load(open('relief-hd/stations/stations-france-2km.json'))['lots'][0]['tuiles'])"
```

- Refaire la liste : `extrait.py` (fichier d'OpenSnowMap → `stations-brut.json`), `stations.py` (zones, massifs, lots ;
  départements d'ADMIN EXPRESS en GeoJSON), `communes.py` puis `communes2.py` (noms de communes, gardés dans
  `communes-cache.json`) :

```bash
python3 relief-hd/stations/extrait.py planet_pistes.osm.gz stations-brut.json
```

```bash
python3 relief-hd/stations/stations.py stations-brut.json departements.json relief-hd/stations/stations-france-2km.json 2
```

## Points d'attention avant de lancer

- **Adresse des dalles** : `bloc_ign()` ne connaissait que les 4 blocs de diffusion autour de Courchevel ; `bloc.py`
  prend maintenant l'adresse de chaque dalle dans le catalogue de l'IGN (vérifié : Val d'Isère, Chamonix, Pyrénées,
  Corse). Sans ce changement, toute tuile hors de ce carré aurait échoué (« DALLE ABSENTE »).
- **Corse** : altitudes en IGN78 (nom des fichiers de l'IGN), pas IGN69 : rien à changer dans le calcul, à savoir pour
  comparer avec d'autres données.
- **Stations frontalières** (Chamonix, Portes du Soleil, Tignes - Val d'Isère, Pyrénées) : les blocs entièrement hors de
  France sont vides (« aucun point »), sans faire échouer la tuile.
- **Liste OpenStreetMap** : un domaine mal cartographié peut manquer ou être découpé ; les 165 domaines couvrent les
  grandes et moyennes stations et la plupart des petites (dont 79 de 10 remontées et plus).
