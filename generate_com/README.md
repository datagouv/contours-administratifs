# Compiler les COM

Voir la discussion sur https://github.com/etalab/contours-administratifs/issues/19

## La version courte

```bash
cd intermediate
bash ../generate_com.sh
bash ../generate_com_taaf_only.sh
bash ../get-nouvelle-caledonie-data-communes.sh
bash ../get-polynesie-data-communes.sh
bash ../merge_all_com.sh
cd ..
```

Pour Etalab, on rajoute une étape pour ensuite utiliser le "nouveau" shp des COM dans le traitement

```bash
cd dist/
scp communes-com-20220101-shp.zip our_server_alias:/srv/geo-data/contours-administratifs/2022/shp/
cd ..
```

Si vous voulez nettoyez les fichiers sources

```bash
cd intermediate
rm *.zip *.csv *.txt *.shp *.shx *.prj *.xml *.sbn *.sbx *.geojson *.cpg *.dbf
cd ..
```

## Utilisation de l'API Overpass avec requête générique pour récupérer toutes les COM hors TAAF

Nous avons d'abord récupéré le fichier https://github.com/etalab/contours-administratifs/issues/19#issuecomment-1097929131

Pour nous affranchir de cet export depuis la base PostgreSQL/PostGIS sur lesquel nous n'avons pas la maitrise, nous avons transformé les requêtes en une requête Overpass. Nous avons utilisé l'utilitaire [query-overpass](https://www.npmjs.com/package/query-overpass)


Nous avons lancé une première requête. Il s'avère qu'il manque les TAAF et que les contours Polynésie sont présents mais mal taggués: on a les contours maritimes des îles et pas les îles elle-même. Par ailleurs, pour la Polynésie, les contours des îles ont été dessinés depuis des photos aériennes dans OpenStreetMap alors qu'on dispose d'une donnée du service du cadastre de Polynésie française qui a été faite par photogrammétrie.

On procéde à quelques corrections automatiques et on exclut les données polynésie venant d'OpenStreetMap. Pour cela, voir `generate_com.sh`


## Pour les TAAF,

### Traitement

On est parti de l'inspection des données dans OpenStreetMap. Un récapitulatif des éléments exacts retenu est présent dans la section suivante. Concernant l'extraction sur les TAAF, voir le fichier `generate_com_taaf_only.sh`. On veille à avoir comme structure destination les colonnes `insee`, `nom`, `wikipedia`, `area_ha` et la géométrie.

Remarque concernant les données OpenStreetMap: il faut à terme mieux tagger les données dans OpenStreetMap pour pouvoir plus facilement à terme entretenir la base des COM en général. A voir avec la communauté: nous pouvons intervenir directement sur la base mais il faut mieux commencer un échange sur la [liste talk-fr-openstreetmap](https://lists.openstreetmap.org/listinfo/talk-fr) à ce propos.

### Relations/ways (au sens OpenStreetMap) dans les TAAF

Relation principale pour les TAAF

https://www.openstreetmap.org/relation/2186658#map=3/-30.37/59.94


- Saint Paul and New Amsterdam Islands https://www.openstreetmap.org/relation/1401924#map=9/-38.2673/77.5508
- Archipel des Kerguelen  https://www.openstreetmap.org/relation/938024#map=6/-50.430/74.663
- Archipel des Crozet https://www.openstreetmap.org/relation/6063094
- La Terre-Adélie https://www.openstreetmap.org/relation/3394114
- Îles Éparses de l'océan Indien https://www.openstreetmap.org/relation/6063099 Ce n'est pas un groupe de land mais de boundaries maritimes (liste îles via https://fr.wikipedia.org/wiki/%C3%8Eles_%C3%89parses_de_l%27oc%C3%A9an_Indien). Conséquence: on doit prendre île par île.
  - Bassas da India https://www.openstreetmap.org/relation/6077487
  - Île Europa https://www.openstreetmap.org/relation/6376308#map=13/-22.3674/40.3641
  - Îles Glorieuses https://www.openstreetmap.org/relation/3340293#map=16/-11.5560/47.3317
  - Île Juan de Nova https://www.openstreetmap.org/way/159357927#map=14/-17.0548/42.7245
  - Île Tromelin https://www.openstreetmap.org/way/160030161#map=10/-15.8748/54.5457

## Données Nouvelle Calédonie

Elles proviennent de https://georep-dtsi-sgt.opendata.arcgis.com/datasets/dtsi-sgt::limites-administratives-terrestres-1/about?layer=0

On passe par le script `get-nouvelle-caledonie-data-communes.sh`

## Données Polynésie Française

Elles proviennent de https://www.data.gouv.fr/fr/datasets/geographie-administrative-de-la-polynesie-francaise/

On passe par le script `get-polynesie-data-communes.sh`

## Fusion données OSM COM (hors TAAF, Polynésie Française et Nouvelle Calédonie), données TAAF OSM, Polynésie - LO, Nouvelle Calédonie - LO

Il faut avoir effectué les opérations précédentes pour pouvoir lancer le dernier script `merge_all_com.sh`

## Script pouvant avoir une utilité.

Nous avons à un moment, explorer comment obtenir les terres émergées qui sont à l'intérieur d'une limite administrative maritime dans OpenStreetMap. Nous avons voulu garder la requête dans le fichier `overpass_com_fix_demo.overpassql`. Il est exécutable avec la commande `query-overpass overpass_com.overpassql`
