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

### Installation des dépendances Node.js

```bash
yarn
```

### Préparation des sources

La préparation des sources inclut la récupération des données auprès des serveurs OpenStreetMap et OpenDatArchives et la décompression des fichiers utiles dans le dossier `sources`.

```bash
yarn prepare-sources
```

Il est possible de travailler avec exclusivement des sources OSM ou Admin Express pour la France, les DOM avec OSM pour les COM.
Pour travailler en OSM pur, il faut faire

```bash
DATASOURCES_TYPE=osm yarn prepare-sources
```

ou ajouter DATASOURCES_TYPE=osm dans le fichier `.env` copié depuis le fichier modèle `.env.sample` 

### Génération des données + généralisation

```
yarn build
```
