#!/bin/bash
COMMUNES_ASSOCIEES_DELEGUEES=${COMMUNES_ASSOCIEES_DELEGUEES:-NO}
YEAR=${YEAR:-latest}
echo "Téléchargement des fichiers sources"
mkdir -p sources
wget -P sources -N http://etalab-datasets.geo.data.gouv.fr/contours-administratifs/${YEAR}/geojson/communes-5m.geojson.gz
if [ "$COMMUNES_ASSOCIEES_DELEGUEES" != "NO" ]; then
    wget -P sources -N http://etalab-datasets.geo.data.gouv.fr/contours-administratifs/${YEAR}/geojson/communes-associees-deleguees-5m.geojson.gz
fi
wget -P sources -N http://etalab-datasets.geo.data.gouv.fr/contours-administratifs/${YEAR}/geojson/departements-5m.geojson.gz
wget -P sources -N http://etalab-datasets.geo.data.gouv.fr/contours-administratifs/${YEAR}/geojson/regions-5m.geojson.gz
wget -P sources -N http://etalab-datasets.geo.data.gouv.fr/contours-administratifs/${YEAR}/geojson/epci-5m.geojson.gz
wget -P sources -N http://etalab-datasets.geo.data.gouv.fr/contours-administratifs/${YEAR}/geojson/mairies.geojson.gz

echo "Génération des tuiles vectorielles découpage administratif"
mkdir -p dist

echo "Régions"
tippecanoe -l regions --generate-ids --no-tile-stats --drop-densest-as-needed --detect-shared-borders -Z3 -z12  -f -o dist/regions.mbtiles sources/regions-5m.geojson.gz

echo "Départements"
tippecanoe -l departements --generate-ids --no-tile-stats --drop-densest-as-needed --detect-shared-borders -Z3 -z12 -f -o dist/departements.mbtiles sources/departements-5m.geojson.gz

echo "EPCI"
tippecanoe -l epcis --generate-ids --no-tile-stats --drop-densest-as-needed --detect-shared-borders -Z3 -z12 -f -o dist/epcis.mbtiles sources/epci-5m.geojson.gz

echo "Communes"
tippecanoe -l communes --generate-ids --no-tile-stats --drop-densest-as-needed --detect-shared-borders -Z8 -z12 -f -o dist/communes.mbtiles sources/communes-5m.geojson.gz

if [ "$COMMUNES_ASSOCIEES_DELEGUEES" != "NO" ]; then
    echo "Inclusion communes associees ou deleguees";
    tippecanoe -l communes_associees_deleguees --generate-ids --no-tile-stats --drop-densest-as-needed --detect-shared-borders -Z8 -z12 -f -o dist/communes-associees-deleguees.mbtiles sources/communes-associees-deleguees-5m.geojson.gz;
else
    echo "Exclusion communes associees ou deleguees";
fi


echo "Mairies"
tippecanoe -l mairies --generate-ids --no-tile-stats -r1 -Z8 -z12 -f -o dist/mairies.mbtiles sources/mairies.geojson.gz

echo "Merge des tuiles vectorielles"
if [ "$COMMUNES_ASSOCIEES_DELEGUEES" != "NO" ]; then
    tile-join --attribution=Etalab --name=decoupage-administratif --no-tile-size-limit --no-tile-stats -f --output dist/decoupage-administratif.mbtiles dist/mairies.mbtiles dist/communes.mbtiles dist/communes-associees-deleguees.mbtiles dist/epcis.mbtiles dist/departements.mbtiles dist/regions.mbtiles;
else
    tile-join --attribution=Etalab --name=decoupage-administratif --no-tile-size-limit --no-tile-stats -f --output dist/decoupage-administratif.mbtiles dist/mairies.mbtiles dist/communes.mbtiles dist/epcis.mbtiles dist/departements.mbtiles dist/regions.mbtiles;
fi
echo "Terminé"
