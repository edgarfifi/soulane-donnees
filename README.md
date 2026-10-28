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

Les fichiers de ce dépôt sont tenus dans le dépôt de l'app Soulane (`scripts/soulane-donnees/`) ; `outils/pistes.mjs`,
`outils/skirando.mjs` et `outils/sentiers.mjs` y sont générés à partir du code de l'app : ne pas les modifier ici.
