url_admin_express='https://data.geopf.fr/telechargement/download/ADMIN-EXPRESS-COG/ADMIN-EXPRESS-COG_3-2__SHP_WGS84G_FRA_2025-04-02/ADMIN-EXPRESS-COG_3-2__SHP_WGS84G_FRA_2025-04-02.7z'
filename=$(basename $url_admin_express)
wget -N -P data/ "${url_admin_express}"

cd data
7z e $filename CHFLIEU_COMMUNE.* COMMUNE.* CHFLIEU_ARRONDISSEMENT_MUNICIPAL.* ARRONDISSEMENT_MUNICIPAL.* -r -aoa

rm chflieu_*.geojson

# Mairies communes métropole sans les communes mortes pour la France + correction manuelle pour passage 2022 à 2023
ogr2ogr -f GeoJSON \
        -dialect SQLite \
        -sql "SELECT \"COMMUNE\".\"INSEE_COM\" AS commune, \"COMMUNE\".\"NOM\" AS nom, CASE WHEN chf.geometry IS NULL THEN 'centre' ELSE 'mairie' END AS type, CASE WHEN chf.geometry IS NULL THEN PointOnSurface(\"COMMUNE\".geometry) ELSE chf.geometry END AS geometry FROM \"COMMUNE\" LEFT JOIN 'CHFLIEU_COMMUNE.shp'.\"CHFLIEU_COMMUNE\" chf ON chf.\"ID_COM\" = \"COMMUNE\".\"ID\" WHERE \"COMMUNE\".\"INSEE_COM\" NOT IN ('55189', '55039', '55050', '55239', '55307', '55139', '01039', '02077', '09255', '16140', '50015', '51063', '51637', '71492', '85037', '85053')" \
        chflieu_commune.geojson \
        COMMUNE.shp \
        -lco RFC7946=YES \
        -lco WRITE_NAME=NO

# Mairies Arrondissements
ogr2ogr -f GeoJSON \
        -dialect SQLite \
        -sql "SELECT \"ARRONDISSEMENT_MUNICIPAL\".\"INSEE_ARM\" AS commune, \"ARRONDISSEMENT_MUNICIPAL\".\"NOM\" AS nom, 'mairie' AS type, chf.geometry AS geometry FROM \"ARRONDISSEMENT_MUNICIPAL\" LEFT JOIN 'CHFLIEU_ARRONDISSEMENT_MUNICIPAL.shp'.\"CHFLIEU_ARRONDISSEMENT_MUNICIPAL\" chf ON chf.\"ID_ARM\" = \"ARRONDISSEMENT_MUNICIPAL\".\"ID\"" \
        chflieu_arrondissement_municipal.geojson \
        ARRONDISSEMENT_MUNICIPAL.shp \
        -lco RFC7946=YES \
        -lco WRITE_NAME=NO

# Obtenir les coordonnées du mémorial de chaque commune morte pour la France
while IFS=, read -r insee nom id_node
do
    echo "$insee with OSM node $id_node"
    echo 'node(id:'$id_node');out;' | query-overpass | jq -c -r '{"type":"Feature","properties":{"commune":"'$insee'", "nom":"'$nom'","type":"memorial"},"geometry":.features[0].geometry}' >| "memorial_"$insee".geojson";
    sleep 30;
done <<EOF
55189,Fleury-devant-Douaumont,915457748
55039,Beaumont-en-Verdunois,4735299808
55050,Bezonvaux,1300835620
55239,Haumont-près-Samogneux,1300745684
55307,Louvemont-Côte-du-Poivre,1300745706
55139,Cumières-le-Mort-Homme,1301164907
EOF

jq -c -r --slurp . memorial_*.geojson \
  | jq -c -r '{"type":"FeatureCollection","features": .}' \
  >| communes_mortes_pour_la_france.geojson

wget -N http://etalab-datasets.geo.data.gouv.fr/contours-administratifs/2022/shp/communes-com-20220101-shp.zip
unzip -o communes-com-20220101-shp.zip

ogr2ogr -f GeoJSON \
        -dialect SQLite \
        -sql "SELECT insee AS commune, nom, 'centre' AS type, PointOnSurface(geometry) AS geometry FROM \"communes-com\"" \
        communes_com_centre.geojson \
        communes-com.shp \
        -lco RFC7946=YES \
        -lco WRITE_NAME=NO

ogrmerge.py -overwrite_ds \
           -o mairies.geojson \
            -single \
            chflieu_commune.geojson \
            communes_mortes_pour_la_france.geojson \
            chflieu_arrondissement_municipal.geojson \
            communes_com_centre.geojson \
            -lco RFC7946=YES \
            -lco WRITE_NAME=NO

cd ..
