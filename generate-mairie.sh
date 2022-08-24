wget -N -P data/ http://files.opendatarchives.fr/professionnels.ign.fr/adminexpress/ADMIN-EXPRESS-COG_3-1__SHP__FRA_WM_2022-04-15.7z
cd data
7z e ADMIN-EXPRESS-COG_3-1__SHP__FRA_WM_2022-04-15.7z CHFLIEU_COMMUNE.* COMMUNE.* CHFLIEU_ARRONDISSEMENT_MUNICIPAL.* ARRONDISSEMENT_MUNICIPAL.* -r -aoa

rm chflieu_*.geojson

# Mairies communes métropole sans les communes mortes pour la France
ogr2ogr -f GeoJSON \
        -dialect SQLite \
        -sql "SELECT \"INSEE_COM\" AS insee_com, CASE WHEN chf.geometry IS NULL THEN 'centre' ELSE 'mairie' END AS type, CASE WHEN chf.geometry IS NULL THEN PointOnSurface(\"COMMUNE\".geometry) ELSE chf.geometry END AS geometry FROM \"COMMUNE\" LEFT JOIN 'CHFLIEU_COMMUNE.shp'.\"CHFLIEU_COMMUNE\" chf ON chf.\"ID_COM\" = \"COMMUNE\".\"ID\" WHERE \"INSEE_COM\" NOT IN ('55189', '55039', '55050', '55239', '55307', '55139')" \
        chflieu_commune.geojson \
        COMMUNE.shp \
        -lco RFC7946=YES \
        -lco WRITE_NAME=NO

# Mairies Arrondissements
ogr2ogr -f GeoJSON \
        -dialect SQLite \
        -sql "SELECT \"INSEE_ARM\" AS insee_com, 'mairie' AS type, chf.geometry AS geometry FROM \"ARRONDISSEMENT_MUNICIPAL\" LEFT JOIN 'CHFLIEU_ARRONDISSEMENT_MUNICIPAL.shp'.\"CHFLIEU_ARRONDISSEMENT_MUNICIPAL\" chf ON chf.\"ID_COM\" = \"ARRONDISSEMENT_MUNICIPAL\".\"ID\"" \
        chflieu_arrondissement_municipal.geojson \
        ARRONDISSEMENT_MUNICIPAL.shp \
        -lco RFC7946=YES \
        -lco WRITE_NAME=NO

# Obtenir les coordonnées du mémorial de chaque commune morte pour la France
while IFS=, read -r insee id_node
do
    echo "$insee with OSM node $id_node"
    echo 'node(id:'$id_node');out;' | query-overpass | jq -c -r '{"type":"Feature","properties":{"insee_com":"'$insee'","type":"mairie"},"geometry":.features[0].geometry}' >| "memorial_"$insee".geojson";
    sleep 30;
done <<EOF
55189,915457748
55039,4735299808
55050,1300835620
55239,1300745684
55307,1300745706
55139,1301164907
EOF

jq -c -r --slurp . memorial_*.geojson \
  | jq -c -r '{"type":"FeatureCollection","features": .}' \
  >| communes_mortes_pour_la_france.geojson

wget http://etalab-datasets.geo.data.gouv.fr/contours-administratifs/2022/shp/communes-com-20220101-shp.zip
unzip communes-com-20220101-shp.zip

ogr2ogr -f GeoJSON \
        -dialect SQLite \
        -sql "SELECT insee AS insee_com, 'centre' AS type, PointOnSurface(geometry) AS geometry FROM \"communes-com\"" \
        communes_com_centre.geojson \
        communes-com.shp \
        -lco RFC7946=YES \
        -lco WRITE_NAME=NO

ogrmerge.py -overwrite_ds\
           -o chflieux-communes-arrondissements-municipaux.geojson \
            -single \
            chflieu_commune.geojson \
            communes_mortes_pour_la_france.geojson \
            chflieu_arrondissement_municipal.geojson \
            communes_com_centre.geojson \
            -lco RFC7946=YES \
            -lco WRITE_NAME=NO

cd ..
