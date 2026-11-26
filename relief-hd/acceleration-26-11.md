# Relief HD : fabrication plus rapide, même relief (26/11/2026)

Chantier d'Edgar (relayé par la session « fluidité et optimisation ») : fabriquer le Relief HD des stations de ski de France
avant la saison, gratuitement sur GitHub Actions, **sans rien perdre de la forme du relief** (règle d'Edgar : relief
exact). Seul `bloc.py` (la surface) change, plus une étape du workflow. Liste des zones : `relief-hd/stations/README.md`.

**Mesures faites sur la machine du cloud de cette session (4 cœurs, 16 Go, comme les machines de GitHub Actions des dépôts
publics), sans lancer le workflow** : la consigne de cette session l'interdit sans accord d'Edgar, et le pilote tourne.

## Où passait le temps (bloc 33974/23469 seul, version de main)

| étape | secondes | cœurs utilisés |
|---|---:|---:|
| lecture des dalles | 4 à 13 | 1 |
| points durs, sol interpolé, murs guidés, normales | 37 | ~0,8 |
| reconstruction de Poisson (profondeur 11) | 89 à 99 | ~2,3 sur 4 |
| rognage, **dont le bouchage des trous** | 54, **dont 52** | ~1,7 |
| canopée, repère | 4 | 1 |
| occlusion ambiante (24 rayons par sommet) | 18 à 20 | **~1** |
| triangles du bloc, écriture | 8 | 1 |
| **total** | **226 à 239** | pic de mémoire **6,3 Go** |

Deux blocs à la fois (le réglage du workflow) : 13,5 Go au plus fort sur une tuile entière ; sur la tuile mesurée,
**2 blocs sur 16 tués faute de mémoire** (~7 Go chacun au même moment) : la tuile échoue, comme ~23 % des tuiles du pilote.

## Changements (résultat identique)

1. **Bouchage des trous** : `np.isin` sur ~25 millions d'arêtes (43 s sur un seul cœur, plus d'un Go) remplacé par un tri et
   une recherche dichotomique : même ensemble d'arêtes de bord, dans le même ordre. 52 s → ~5 s.
2. **Occlusion seulement pour les sommets gardés** : les triangles du bloc sont choisis AVANT l'occlusion (avant, ~40 % des
   rayons partaient des sommets de la marge de 60 m, jetés ensuite). Mêmes rayons (mêmes tirages), même scène, marge
   comprise : même occlusion pour chaque sommet gardé. Rayons lancés sur tous les cœurs (`nthreads=0` n'en occupait qu'un).
   Le nombre de rayons (24) n'a pas été réduit : l'occlusion ne pèse plus que ~7 % du bloc, le gain ne vaudrait pas
   l'écart d'image.
3. **Mémoire rendue avant Poisson** (le pic) : arbre et grille du sol interpolé, copies du nuage, normales, colonnes de points
   qui ne servent plus ; maillage et scène des rayons rendus dès qu'ils ne servent plus. Pic d'un bloc : 6,3 → 4,2 Go.
   L'en-tête de chaque bloc donne maintenant son pic (`memoire_max_mo`).
4. **Workflow** : l'étape « Accès aux dalles » téléchargeait une dalle ENTIÈRE (~150 Mo) à chaque tuile pour la jeter
   (~1 To pour les stations de France) : 4 premiers Mo seulement, même diagnostic.
5. **Adresse des dalles** (indispensable hors de Courchevel) : catalogue des dalles du LiDAR HD de l'IGN (WFS
   `IGNF_LIDAR-HD_METADONNEE:metadata`, champ `url_npl`), gardé en cache ; dalle hors du catalogue (frontière, mer) : bloc
   sans points, sans faire échouer la tuile.

## Mesures avant / après

| mesure (même machine, mêmes dalles déjà téléchargées) | avant (main) | après |
|---|---:|---:|
| bloc 33974/23469 seul | 226 s, 6,3 Go | **167 s (−26 %), 4,2 Go (−33 %)** |
| tuile z14 8493/5867 (Courchevel 1850, 16 blocs deux à la fois, arbres et paquet compris) | 2 528 s (42,1 min), **en échec : 2 blocs tués faute de mémoire** | **2 016 s (33,6 min, −20 %), 16 blocs sur 16** |
| un bloc, deux à la fois (moyenne) | 307 s | 242 s (−21 %) |
| pic de mémoire de la tuile (deux blocs ensemble) | 13,5 Go (tués à ~7 Go chacun) | 8,8 Go (5,1 Go au plus par bloc) |

Dans le cloud (37 min par tuile à deux blocs, mesure du pilote), cela donne **~29,5 min par tuile**, et surtout plus de
tuile à refaire à un seul bloc (~1 h de plus pour ~23 % des tuiles) : en moyenne **~51 → ~30 min par tuile**. Le
téléchargement des dalles n'est pas compté (déjà sur le disque ici) ; il ne change pas.


## Contrôle de la forme (comparaison des maillages)

Les 14 blocs réussis des deux côtés (`compare_blk.py`, ajouté au dossier) :

| bloc | sommets avant / après | arêtes de bord | aire (m²) | écart max des sommets | sommets à plus de 5 cm | occlusion : sommets à plus de 8 / 255 |
|---|---|---|---|---:|---:|---:|
| 33972/23468 | 2 477 820 / 2 477 820 | 7440 / 7440 | 200 847 / 200 847 | 0.5 mm | 0 | 143 |
| 33972/23469 | 2 491 564 / 2 491 564 | 7446 / 7446 | 202 023 / 202 023 | 0.5 mm | 0 | 127 |
| 33972/23471 | 2 703 381 / 2 703 381 | 7709 / 7709 | 209 330 / 209 330 | 0.5 mm | 0 | 139 |
| 33973/23468 | 2 511 835 / 2 511 834 | 7401 / 7400 | 200 930 / 200 930 | 43.6 mm | 0 | 78 |
| 33973/23469 | 2 374 497 / 2 374 496 | 7056 / 7054 | 198 355 / 198 355 | 621.3 mm | 1 | 69 |
| 33973/23470 | 2 535 208 / 2 535 209 | 7241 / 7242 | 205 662 / 205 662 | 187.2 mm | 1 | 75 |
| 33974/23468 | 2 326 572 / 2 326 572 | 7305 / 7305 | 199 561 / 199 561 | 230.7 mm | 2 | 91 |
| 33974/23469 | 2 385 770 / 2 385 770 | 7220 / 7218 | 205 363 / 205 363 | 258.4 mm | 1 | 138 |
| 33974/23470 | 2 256 742 / 2 256 743 | 7126 / 7127 | 196 878 / 196 878 | 0.5 mm | 0 | 103 |
| 33974/23471 | 2 242 175 / 2 242 175 | 7180 / 7180 | 200 078 / 200 078 | 108.8 mm | 1 | 84 |
| 33975/23468 | 2 744 290 / 2 744 289 | 7766 / 7766 | 251 955 / 251 957 | 899.5 mm | 3 | 650 |
| 33975/23469 | 2 470 939 / 2 470 938 | 7769 / 7768 | 232 337 / 232 337 | 273.0 mm | 1 | 478 |
| 33975/23470 | 2 211 837 / 2 211 837 | 7126 / 7127 | 202 116 / 202 116 | 0.5 mm | 0 | 156 |
| 33975/23471 | 2 295 678 / 2 295 678 | 7111 / 7109 | 194 355 / 194 355 | 333.4 mm | 1 | 73 |

Bruit de fond (même code passé deux fois) : bloc 33974/23469, version de main contre elle-même : 2 sommets à plus de 5 cm,
150 sommets d'occlusion différents ; bloc du village 33975/23468, nouvelle version contre elle-même : 585 sommets
d'occlusion différents. La reconstruction de Poisson en multi-fils et le lancer de rayons ne sont pas exactement
déterministes (un rayon rasant touche ou rate une face selon le dernier chiffre d'une normale ; près des murs, plus
souvent). Par construction, Poisson reçoit exactement les mêmes points et normales qu'avant, le bouchage des trous et
l'occlusion font le même calcul : les écarts avant / après sont ceux d'une passe à l'autre, de cet ordre, ni plus ni
ailleurs (1 à 3 sommets sur ~2,5 millions qui bougent, comme d'une passe à l'autre du même code) : **aucune perte de forme** (mêmes sommets à ±1,
mêmes trous, même aire ; les quelques sommets à plus de 5 cm sont les variations ordinaires de Poisson, d'une passe à
l'autre).


## Pas fait, proposé

- **Poisson sur tous les cœurs** (60 % du temps restant, ~2,3 cœurs sur 4) : la version de référence multi-cœurs de
  Kazhdan (PoissonRecon 18, même méthode, mêmes réglages : profondeur 11, degré 1, bord de Neumann, `samplesPerNode` 1,5,
  `pointWeight` 2) se compile en ~2 min dans le workflow. Elle n'est pas dans cette session (dépôt GitHub hors de son
  accès) ; elle ne donnera pas un fichier identique (autre version du code) : à valider sur quelques tuiles avec
  `compare_blk.py` (écart des sommets, trous, aire) avant de l'adopter. Gain attendu : ~40 s par bloc.
- **Trois blocs à la fois** : avec ~4,2 à 5 Go par bloc, trois tiendraient souvent, mais pas les blocs les plus denses ;
  à essayer seulement avec un garde-fou (mémoire libre vérifiée avant de lancer un bloc).
- **Sol interpolé et murs guidés** (~28 s sur un seul cœur) : calculs exacts à garder ; ils se recouvrent déjà avec le
  Poisson de l'autre bloc quand deux blocs tournent ensemble.
