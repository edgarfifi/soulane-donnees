# Données ouvertes de Soulane

## Pistes de ski de la carte d'hiver

Tuiles vectorielles (MVT, couche `pistes`, zooms 10 à 14) des pistes de ski, de ski de randonnée, de ski nordique, de
raquettes et de luge des Alpes, des Pyrénées, du Jura, des Vosges, du Massif central et de la Corse, telles que les
dessinent les cartes de l'app [Soulane](https://soulane.app).

- **Dernière version** : [`pistes.tar.gz`](https://github.com/edgarfifi/soulane-donnees/releases/latest/download/pistes.tar.gz)
  (fichiers `z/x/y.pbf`) et son [`manifeste.json`](https://github.com/edgarfifi/soulane-donnees/releases/latest/download/manifeste.json)
  (date, nombre de pistes et de tuiles, empreinte du contenu).
- **Mise à jour** : chaque lundi, automatiquement ([`.github/workflows/pistes.yml`](.github/workflows/pistes.yml)) : le
  fichier quotidien des pistes d'[OpenSnowMap](https://www.opensnowmap.org) est téléchargé, découpé en tuiles
  ([`outils/pistes.mjs`](outils/pistes.mjs)), comparé à la version précédente puis publié s'il a changé et si les chiffres
  restent proches ([`outils/publier.mjs`](outils/publier.mjs)). L'état du dernier passage est dans [`etat.json`](etat.json).
  Les 8 versions les plus récentes sont gardées.
- **Licence** : données © [contributeurs OpenStreetMap](https://www.openstreetmap.org/copyright). Ces tuiles sont une base de
  données dérivée d'OpenStreetMap, mise à disposition sous la licence
  [Open Database License (ODbL) 1.0](https://opendatacommons.org/licenses/odbl/1-0/).

## Itinéraires de ski de randonnée (Alpes françaises et Pyrénées)

Tuiles vectorielles (MVT, couche `itineraires`, zooms 8 à 14) du réseau des itinéraires de ski de randonnée des Alpes
françaises et des Pyrénées, passages à pied compris (propriété `foot` : 1 = à pied, 0 = à ski), telles que les dessine le
calque « Itinéraires ski de rando » de l'app [Soulane](https://soulane.app).

- **Version publiée** : dans la version fixe [`skirando`](https://github.com/edgarfifi/soulane-donnees/releases/tag/skirando) :
  [`manifeste.json`](https://github.com/edgarfifi/soulane-donnees/releases/download/skirando/manifeste.json) (versions des
  données, chiffres, empreinte) nomme l'archive à prendre (`archive`, fichiers `z/x/y.pbf`) ; les 3 archives les plus
  récentes sont gardées.
- **Mise à jour** : chaque mardi, automatiquement ([`.github/workflows/skirando.yml`](.github/workflows/skirando.yml)) : la
  dernière version des fichiers lissés de chaque région est téléchargée sur
  [download.skitourenguru.com](https://download.skitourenguru.com/public/), découpée en tuiles
  ([`outils/skirando.mjs`](outils/skirando.mjs)), comparée à la version publiée puis publiée si elle a changé et si les
  chiffres restent plausibles ([`outils/publier.mjs`](outils/publier.mjs)). L'état du dernier passage est dans
  [`etat-skirando.json`](etat-skirando.json).
- **Auteurs et licence** : itinéraires créés et entretenus par la [Fondation Petzl](https://www.petzl.com/fondation/), en
  collaboration avec [Skitourenguru GmbH](https://www.skitourenguru.com), publiés sous la licence
  [Creative Commons Attribution - Pas de modification 4.0 International (CC BY-ND 4.0)](https://creativecommons.org/licenses/by-nd/4.0/deed.fr)
  ([conditions](https://download.skitourenguru.com/public/License.html)). Géométrie **non modifiée** : les tracés sont
  seulement projetés (Lambert-93 vers degrés) et découpés en tuiles, les modifications techniques que permet la licence
  (section 2(a)(4)) ; ni lissage, ni correction, ni simplification. Les auteurs ne garantissent ni l'exhaustivité ni
  l'exactitude des données et déclinent toute responsabilité à ce sujet. Une erreur dans un itinéraire se signale à la
  Fondation Petzl : randohiver@fondation-petzl.org.

## Sentiers de rando balisés

Tuiles vectorielles (MVT, couche `sentiers`, zooms 8 à 12, le zoom 12 à 8 192 unités par tuile) des itinéraires de
randonnée balisés d'OpenStreetMap (relations `route=hiking` et `route=foot` : GR, GRP, PR, SL, sentiers locaux) de la
France, de l'Espagne, de l'Andorre, de la Suisse, du Liechtenstein, de l'Italie, de l'Autriche, de la Bavière et de Monaco,
telles que les dessine le calque « Sentiers de rando » de l'app [Soulane](https://soulane.app). Propriété `n` : réseau le
plus important qui emprunte le chemin (0 international, 1 national, 2 régional, 3 local) ; `l` : les numéros des
itinéraires (« GR 11 · PR-HU 12 »), ou leur nom.

- **Version publiée** : dans la version fixe [`sentiers`](https://github.com/edgarfifi/soulane-donnees/releases/tag/sentiers) :
  [`manifeste.json`](https://github.com/edgarfifi/soulane-donnees/releases/download/sentiers/manifeste.json) (dates des
  extraits, chiffres, empreinte) nomme l'archive à prendre (`archive`, fichiers `z/x/y.pbf`) ; les 3 archives les plus
  récentes sont gardées.
- **Mise à jour** : chaque mercredi, automatiquement ([`.github/workflows/sentiers.yml`](.github/workflows/sentiers.yml)) :
  les extraits de [Geofabrik](https://download.geofabrik.de/) sont téléchargés un à un, lus
  ([`outils/sentiers.mjs`](outils/sentiers.mjs)), comparés à la version publiée puis publiés s'ils ont changé et si les
  chiffres restent proches ([`outils/publier.mjs`](outils/publier.mjs)). L'état du dernier passage est dans
  [`etat-sentiers.json`](etat-sentiers.json).
- **Licence** : données © [contributeurs OpenStreetMap](https://www.openstreetmap.org/copyright). Ces tuiles sont une base de
  données dérivée d'OpenStreetMap, mise à disposition sous la licence
  [Open Database License (ODbL) 1.0](https://opendatacommons.org/licenses/odbl/1-0/).

## Topos de ski de randonnée de Skitour

Tuiles vectorielles (MVT, couche `topos`, zooms 8 à 14), index et tracés des topos du topoguide collaboratif de
[Skitour](https://skitour.fr), tels que les montre le calque « Topos » de l'app [Soulane](https://soulane.app). Propriétés des
tuiles : `id` numéro du topo (page : `https://skitour.fr/topos/<id>`), `g` difficulté du ski, `o` orientation, `d` dénivelé.
`index.json` : tous les topos qui ont une position ; `traces/<id>.json` : le tracé de chaque topo qui a un GPX, en entiers au
1/100 000 de degré, chaque point en écart au précédent.

- **Version publiée** : dans la version fixe [`skitour`](https://github.com/edgarfifi/soulane-donnees/releases/tag/skitour) :
  [`manifeste.json`](https://github.com/edgarfifi/soulane-donnees/releases/download/skitour/manifeste.json) nomme l'archive à
  prendre (`archive`) ; les 3 archives les plus récentes sont gardées.
- **Mise à jour** : chaque jeudi, automatiquement ([`.github/workflows/skitour.yml`](.github/workflows/skitour.yml)) : la liste
  des topos est lue par leur API (clé dans le secret `SKITOUR_API_KEY`, ≈ 82 appels), leurs GPX publics un par seconde, seulement
  ceux qui ont changé ([`outils/skitour.mjs`](outils/skitour.mjs)) ; puis comparaison à la version publiée et publication
  ([`outils/publier.mjs`](outils/publier.mjs)). L'état du dernier passage est dans [`etat-skitour.json`](etat-skitour.json).
- **Licence** : topoguide © les contributeurs de Skitour,
  [Creative Commons Attribution - Partage dans les mêmes conditions 4.0 International (CC BY-SA 4.0)](https://creativecommons.org/licenses/by-sa/4.0/deed.fr).
  Ces fichiers restent sous la même licence. Modifications : seules les positions et le point haut des GPX sont gardés, sans
  simplification. Jamais les sorties ni les photos de Skitour (autre licence).

## Train, car et skibus

Tuiles vectorielles (MVT, couches `lignes` et `arrets`, zooms 8 à 13) et index des gares, arrêts de car et de skibus,
téléphériques et funiculaires des zones de montagne (Alpes, Pyrénées, Jura, Vosges, Massif central, Corse), tels que les montre
le calque « Train, car et skibus » de l'app [Soulane](https://soulane.app). Propriétés des tuiles : lignes `m` mode (`train`,
`car`, `cable`, `tram`), `c` couleur, `n` numéro ; arrêts `i` indice dans l'index, `n` nom, `m` mode principal. `index.json` :
réseaux (nom, page des horaires, source, licence), lignes (numéro, nom, couleurs, mode, période de validité), arrêts (position
au 1/100 000 de degré, nom, lignes). Pas d'horaires.

- **Version publiée** : dans la version fixe [`transports`](https://github.com/edgarfifi/soulane-donnees/releases/tag/transports) :
  [`manifeste.json`](https://github.com/edgarfifi/soulane-donnees/releases/download/transports/manifeste.json) nomme l'archive à
  prendre (`archive`) et compte les arrêts de chaque réseau ; les 3 archives les plus récentes sont gardées.
- **Mise à jour** : chaque vendredi, automatiquement ([`.github/workflows/transports.yml`](.github/workflows/transports.yml)) :
  les horaires théoriques (GTFS) de chaque réseau sont téléchargés un à un et lus en flux ([`outils/transports.mjs`](outils/transports.mjs)),
  puis comparés à la version publiée : un réseau qui disparaît ou perd plus de la moitié de ses arrêts arrête la publication
  ([`outils/publier.mjs`](outils/publier.mjs)). L'état du dernier passage est dans [`etat-transports.json`](etat-transports.json).
- **Sources et licences** : [transport.data.gouv.fr](https://transport.data.gouv.fr) (France ; Licence Ouverte 2.0 ou ODbL
  selon le réseau, relue à chaque passage, un jeu sous une autre licence n'est pas lu), [opentransportdata.swiss](https://opentransportdata.swiss)
  (Suisse ; conditions d'utilisation de la plateforme), [ÖBB-Personenverkehr AG](https://data.oebb.at) (Autriche ; CC BY 4.0).
  La liste des réseaux et de leurs producteurs : [soulane.app/sources](https://soulane.app/sources/). Cette base dérivée est mise
  à disposition sous [Open Database License (ODbL) 1.0](https://opendatacommons.org/licenses/odbl/1-0/).

## Couloirs d'avalanche de France (CLPA)

Tuiles vectorielles (MVT, couches `zones`, `lignes`, `fleches` et `numeros`, zooms 10 à 14) de la
[Carte de localisation des phénomènes d'avalanche](https://www.avalanches.fr/donnees-publiques-clpa/) (CLPA) des Alpes
françaises et des Pyrénées, telles que les montre le calque « Couloirs d'avalanche connus » de l'app
[Soulane](https://soulane.app). Propriétés : `s` origine (1 photo-interprétation et analyse de terrain, 2 recueil de
témoignages), `c` code de la légende officielle, `a` cap de la flèche au bout d'un écoulement ou d'une liaison, `n` numéro de
l'emprise.

- **Version publiée** : dans la version fixe [`clpa`](https://github.com/edgarfifi/soulane-donnees/releases/tag/clpa) :
  [`manifeste.json`](https://github.com/edgarfifi/soulane-donnees/releases/download/clpa/manifeste.json) nomme l'archive à
  prendre (`archive`), la version des fichiers de l'INRAE (`version`) et la date du dernier objet mis à jour (`maj`) ; les
  3 archives les plus récentes sont gardées.
- **Mise à jour** : le 3 de chaque mois, automatiquement ([`.github/workflows/clpa.yml`](.github/workflows/clpa.yml)) : les
  quatre couches sont lues dans le service WFS de l'INRAE ([`outils/clpa.mjs`](outils/clpa.mjs)), puis comparées à la version
  publiée : une carte qui rétrécit ou un massif absent arrête la publication ([`outils/publier.mjs`](outils/publier.mjs)).
  L'état du dernier passage est dans [`etat-clpa.json`](etat-clpa.json).
- **Source et droit** : CLPA © INRAE / ministère de la Transition écologique. Informations publiques réutilisées avec leur
  source et leur date de mise à jour, sans en dénaturer le sens (code des relations entre le public et l'administration,
  articles L. 321-1 et suivants). Géométrie non modifiée : découpage en tuiles et arrondi à leur grille seulement. Les objets
  hors de la légende officielle (code 16) ne sont pas repris, comme sur la carte de l'INRAE. La CLPA est un document
  informatif, sans valeur réglementaire ; elle ne couvre pas toute la montagne. Avant tout usage, lire son guide
  d'utilisation et sa légende sur [avalanches.fr](https://www.avalanches.fr/donnees-publiques-clpa/).

## Neige prévue (prochaines 24 et 48 heures)

Grille de la neige fraîche prévue sur la France, les Alpes et les Pyrénées (grille de 0,025°, environ 2,5 km), pour les
prochaines 24 et 48 heures, selon l'altitude : pour chaque case, la hauteur de neige fraîche (cm) à 17 altitudes de
référence (0 à 4 800 m, tous les 300 m), telle que la montre le calque « Neige prévue » de l'app
[Soulane](https://soulane.app), qui la lit à l'altitude de chaque point de son relief.

- **Version publiée** : branche [`neige-prevue`](https://github.com/edgarfifi/soulane-donnees/tree/neige-prevue), remplacée à
  chaque prévision : `neige.bin.gz` (format décrit dans `src/shared/core/snowForecast.ts` du dépôt de l'app) et
  `manifeste.json` (prévision, fenêtres, taille, empreinte, contrôle).
- **Mise à jour** : chaque heure, soulane.app regarde si Météo-France a publié une nouvelle prévision AROME (une toutes les
  3 heures) et, si oui, lance le robot ([`.github/workflows/neige.yml`](.github/workflows/neige.yml), qui a aussi son propre
  planning, en secours) ; il la lit
  ([`outils/neige-extraire.py`](outils/neige-extraire.py)), calcule la neige ([`outils/neige.mjs`](outils/neige.mjs)) et la
  publie, sauf si les chiffres sont suspects.
- **Méthode** : précipitation et part solide (neige et grésil) de chaque heure selon AROME sur son propre relief, ramenées à
  chaque altitude par la température humide (« wet-bulb ») et son gradient vertical ; densité de la neige fraîche selon la
  température de l'air (Hedstrom et Pomeroy, 1998) ; ni tassement ni fonte au sol. Une prévision, pas une mesure.
- **Source et licence** : prévisions du modèle AROME de [Météo-France](https://meteo.data.gouv.fr), réutilisées sous la
  [Licence Ouverte 2.0](https://www.etalab.gouv.fr/licence-ouverte-open-licence/) (Etalab) ; données modifiées (calcul de la
  neige selon l'altitude). Cette grille est mise à disposition sous la même licence.

Les fichiers de ce dépôt sont tenus dans le dépôt de l'app Soulane (`scripts/soulane-donnees/`) ; `outils/pistes.mjs`,
`outils/skirando.mjs`, `outils/sentiers.mjs`, `outils/skitour.mjs`, `outils/transports.mjs`, `outils/clpa.mjs` et `outils/neige.mjs` y sont générés à partir du code de l'app : ne pas les
modifier ici.

## Relief HD : maillages 3D du LiDAR HD (outil de fabrication)

Outil seulement (aucune donnée publiée ici) : [`relief-hd/`](relief-hd/) et
[`.github/workflows/relief-hd.yml`](.github/workflows/relief-hd.yml), lancé à la main. Il tire du nuage de points classé
du [LiDAR HD de l'IGN](https://geoservices.ign.fr/lidarhd) la surface 3D du sol et de la roche (reconstruction de Poisson,
normales orientées vers le capteur, pyramide de niveaux de détail compressée par meshoptimizer) et les arbres (hauteur et
couronne de chacun), pour le « Relief HD » de l'app [Soulane](https://soulane.app).

- **Source et licence** : LiDAR HD © IGN, [Licence Ouverte 2.0](https://www.etalab.gouv.fr/licence-ouverte-open-licence/)
  (mention : « IGN LiDAR HD »).
