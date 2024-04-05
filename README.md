# contours-administratifs

Script permettant de générer les principaux contours administratifs selon différents niveaux de généralisation.

## Présentation

### Types de contours

- Communes (ADMIN EXPRESS)
- Communes associées ou déléguées (ADMIN EXPRESS)
- Arrondissements municipaux (ADMIN EXPRESS)
- EPCI (calculés à partir de ADMIN EXPRESS)
- Départements (calculés à partir de ADMIN EXPRESS)
- Régions (calculés à partir de ADMIN EXPRESS)
- Mairies (déduites de ADMIN EXPRESS sauf pour les mairies mortes pour la France ou centre du mémorial utilisé et centroïde pour les COM où la position des mairies n'est pas exploitable dans les sources trouvées à ce jour)
- Communes des collectivités d'outre-mer (OSM) à l'exception des îles de la Polynésie Française (données ["Géographie administrative de la Polynésie-française"](https://www.data.gouv.fr/fr/datasets/geographie-administrative-de-la-polynesie-francaise/)) et de la Nouvelle Calédonie (données [Limites des provinces et des communes de Nouvelle-Calédonie](https://georep-dtsi-sgt.opendata.arcgis.com/datasets/dtsi-sgt::limites-administratives-terrestres-1/about?layer=0))

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

### Installation des dépendances Node.js

```bash
yarn
```

### Préparation des sources

La préparation des sources inclut la récupération des données auprès des serveurs OpenStreetMap et OpenDatArchives et la décompression des fichiers utiles dans le dossier `sources`.

```bash
yarn prepare-sources
```

### Génération des données + généralisation

```bash
yarn build
```

Si vous voulez générer les communes associées ou déléguées, vous devez executer la même commande avec la variable d'environnement `COMMUNES_ASSOCIEES_DELEGUEES`

```
export COMMUNES_ASSOCIEES_DELEGUEES=YES
yarn run build
```

Pour compresser les fichiers en gz avant envoi, faire

```bash
cd dist
for i in *.geojson;
  do gzip -k $i;
done;
cd ..
```

Pour déployer, faire en changeant `alias_ssh:/chemin_dossier/annee/geojson/`

```bash
scp dist/*.geojson* alias_ssh:/chemin_dossier/annee/geojson/
```

### Mise à disposition des sources sous forme de tuiles vecteur

Nous générons des tuiles vectorielles depuis les fichiers de contour. Elles sont servies depuis https://openmaptiles.geo.data.gouv.fr/data/decoupage-administratif/#4.63/46.18/-1.66

Elles contiennent :

- les communes
- les communes déléguées ou associées
- les EPCI
- les départements
- les régions
- les positions ponctuelles des mairies

Nous ne cherchons pas à intégrer toutes les couches administratives possibles pour des raisons d'optimisation de taille des tuiles vecteur.

Pour savoir à quelles zooms les couches sont disponibles, nous utilisons les zooms suivants :


|Nom couches                  |Z3 |Z4 |Z5 |Z6 |Z7 |Z8 |Z9 |Z10|Z11|Z12|
|-----------------------------|---|---|---|---|---|---|---|---|---|---|
|regions                      |V  |V  |V  |V  |V  |V  |V  |V  |V  |V  |
|departements                 |V  |V  |V  |V  |V  |V  |V  |V  |V  |V  |
|epcis                        |V  |V  |V  |V  |V  |V  |V  |V  |V  |V  |
|communes                     |   |   |   |   |   |V  |V  |V  |V  |V  |
|communes_associees_deleguees |   |   |   |   |   |V  |V  |V  |V  |V  |
|mairies                      |   |   |   |   |   |V  |V  |V  |V  |V  |

Il est possible par un mécanisme d'overzoom d'accéder aux tuiles de zoom 3 au zoom 0, 1 ou 2 ou pour un zoom de niveau 16, d'accéder aux tuiles de niveau 12.

Pour un exemple d'intégration de ces tuiles avec des styles, voir en particulier l'exemple mentionnant "limites administratives" https://guides.etalab.gouv.fr/apis-geo/3-tuiles-vecteur.html#comment-utiliser-les-tuiles-vectorielles-d-etalab

### Structure des couches

Chaque fois nous passons par un utilitaire appelé `ogrinfo` qui nous permet de lister les colonnes pour chaque couche.

#### Communes et arrondissements municipaux

La couche commune contient en fait à la fois les communes et les arrondissements municipaux

```
ogrinfo -so -al /vsigzip/./dist/communes-5m.geojson.gz
```

```
code: String (0.0)
nom: String (0.0)
departement: String (0.0)
region: String (0.0)
epci: String (0.0)
plm: Integer(Boolean) (1.0)
commune: String (0.0)
```

`plm` contient 1 si les communes sont des communes ayant des arrondissements. Si la colonne `commune` contient un code, c'est un arrondissement municipal

#### Mairies

```
ogrinfo -so -al /vsigzip/./dist/mairies.geojson.gz
```

```
commune: String (0.0)
nom: String (0.0)
type: String (0.0)
```

La colonne type indique soit `mairie`, soit `memorial`, soit `centre`

#### Communes associées et déléguées

La couche commune contient en fait à la fois les [communes associées](https://www.insee.fr/fr/metadonnees/definition/c2297) et [les communes déléguées](https://www.insee.fr/fr/metadonnees/definition/c2298)

```
ogrinfo -so -al /vsigzip/./dist/communes-associees-deleguees-5m.geojson.gz
```

```
code: String (0.0)
nom: String (0.0)
type: String (0.0)
departement: String (0.0)
region: String (0.0)
epci: String (0.0)
```

#### EPCI

```
ogrinfo -so -al /vsigzip/./dist/epci-5m.geojson.gz
```

```
code: String (0.0)
nom: String (0.0)
```

Le code de l'EPCI est le code SIREN de l'EPCI

#### Départements

```
ogrinfo -so -al /vsigzip/./dist/departements-5m.geojson.gz
```

```
code: String (0.0)
nom: String (0.0)
region: String (0.0)
```

#### Régions

```
ogrinfo -so -al /vsigzip/./dist/regions-5m.geojson.gz
```

```
code: String (0.0)
nom: String (0.0)
```
