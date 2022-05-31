# Get polynesie data

mkdir polynesie-data
cd polynesie-data

sample=$(curl https://www.data.gouv.fr/api/1/datasets/5ebddd1b7894ec1982180840/ | jq -r -c '[.resources[] | select( .url | contains("shp")) | [.title, .url]]' | sed 's#BD Carto - \|BD Carto -\| (format SHP)##g' | sed 's# - \| #-#g' | tr '[:upper:]' '[:lower:]')

for row in $(echo "${sample}" | jq -r '.[] | @base64'); do
    _jq() {
     echo ${row} | base64 --decode | jq -r ${1}
    }
   wget -O $(_jq '.[0]') $(_jq '.[1]');
done;

unp archipel*.zip

for i in $(find -name '*COMMUNE*' | grep shp);
  do echo "\"$(pwd)/$(echo $i | sed 's#\./##g')\"";
done;

for i in $(find -name '*COMMUNE*' | grep shp | grep -v "LIMITE\|wgs84");
   do ogr2ogr -t_srs "EPSG:4326" \
              $(pwd)/$(echo $i | sed 's#\./##g' | sed 's#Tetiaroa_LOC\|Mehetia_LOC\|Moorea_LOC\|Maiao_LOC#LOC#g' | sed 's#LOC_COMMUNE.shp#LOC_COMMUNE_wgs84.shp#g') \
              "$(pwd)/$(echo $i | sed 's#\./##g')";
done;


INDEX=0
for i in $(find -name '*COMMUNE*' | grep shp | grep -v "LIMITE\|wgs84");
  do origin_shp="$(pwd)/$(echo $i | sed 's#\./##g' | sed 's#Tetiaroa_LOC\|Mehetia_LOC\|Moorea_LOC\|Maiao_LOC#LOC#g' | sed 's#LOC_COMMUNE.shp#LOC_COMMUNE_wgs84.shp#g')";
     ogr2ogr "LOC_COMMUNE_wgs84__${INDEX}.shp" -dialect SQLite -sql "SELECT nom, ST_Union(geometry) AS geometry FROM \"LOC_COMMUNE_wgs84\" GROUP BY nom" $origin_shp;
     let INDEX=${INDEX}+1;
done;

ogrmerge.py -single -overwrite_ds -nln polynesie -o LOC_COMMUNE_ALL.shp LOC_COMMUNE_wgs84__*.shp
ogr2ogr -f CSV LOC_COMMUNE_ALL.csv \
        -dialect SQLite \
        -sql "SELECT distinct nom FROM LOC_COMMUNE_ALL ORDER BY nom" \
        LOC_COMMUNE_ALL.shp

sed -i '1d' LOC_COMMUNE_ALL.csv

wget https://github.com/etalab/decoupage-administratif/raw/master/sources/collectivites-outremer.csv
xsv search -s code_collectivite 987 collectivites-outremer.csv \
    | xsv select nom_commune \
    | sed '1d' \
    | sort \
    >| reference_decoupage_admin_com_polynesie.txt

comm reference_decoupage_admin_com_polynesie.txt LOC_COMMUNE_ALL.csv >| delta_com.csv
cd ..

ogr2ogr "LOC_COMMUNE_ALL_CLEANED.shp" \
        -dialect SQLite \
        -sql "SELECT nom, ST_Union(geometry) AS geometry FROM \"LOC_COMMUNE_ALL\" WHERE nom NOT IN ('Avera - Rurutu', 'Hauti', 'Moerai') GROUP BY nom" \
        LOC_COMMUNE_ALL.shp;
