# contours-administratifs

Script permettant de générer les principaux contours administratifs selon différents niveaux de généralisation.

## Présentation

### Types de contours

- Communes (ADMIN EXPRESS)
- Arrondissements municipaux (ADMIN EXPRESS)
- EPCI (calculés à partir de ADMIN EXPRESS)
- Départements (calculés à partir de ADMIN EXPRESS)
- Régions (calculés à partir de ADMIN EXPRESS)
- Communes des collectivités d'outre-mer (OSM)

### Niveaux de généralisation

- 1000m
- 100m
- 50m
- 5m

## Utilisation

### Pré-requis

- Node.js 12 et supérieur
- 7zip
- tippecanoe (pour générer les tuiles vectorielles)

### Préparation des données

Actuellement ce script ne gère pas la préparation en amont des données (téléchargement, packaging).

#### ADMIN EXPRESS

Étape 1 : on [télécharge](https://data.cquest.org/ign/adminexpress/ADMIN-EXPRESS-COG_3-0__SHP__FRA_WM_2021-05-19.7z) le millésime COG 2021 de ADMIN EXPRESS en WGS-84.

Étape 2 : on décompresse (par exemple avec `unar`) l'archive 7z

Étape 3 : on créé deux archives `sources/ign-communes-shp.zip` avec les fichiers `**/COMMUNE.*` et `sources/ign-arrondissements-municipaux-shp.zip` avec les fichiers `**/ARRONDISSEMENT_MUNICIPAL.*`.

#### OpenStreetMap France

```bash
curl https://osm13.openstreetmap.fr/~cquest/openfla/export/communes-com-20220101-shp.zip > sources/osm-communes-com-shp.zip
```

### Génération des données + généralisation

```
yarn --prod && yarn build
```
