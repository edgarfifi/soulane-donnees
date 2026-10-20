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

Les fichiers de ce dépôt sont tenus dans le dépôt de l'app Soulane (`scripts/soulane-donnees/`) ; `outils/pistes.mjs`
y est généré à partir du code de l'app : ne pas le modifier ici.
