url=$(curl https://www.data.gouv.fr/api/1/datasets/621d1a7f0754a2ebbeb3b791/ | jq -r -c '.resources[] | select( .url | contains("commune")) | .url')

wget -N $url
unp loc-commune-associee.zip
ogr2ogr "loc_commune_all.shp" \
        -dialect SQLite \
        -sql "SELECT nom, code_com_i AS insee, '' AS wikipedia, Area(geometry, TRUE) / 10000 AS surf_ha, geometry FROM (SELECT nom, code_com_i, ST_Union(geometry) AS geometry FROM loc_commune_associee GROUP BY nom, code_com_i) AS foo" \
        loc_commune_associee.shp;

ogr2ogr -f CSV loc_commune_all.csv \
        -dialect SQLite \
        -sql "SELECT distinct insee FROM loc_commune_all ORDER BY insee" \
        loc_commune_all.shp

sed -i '1d' loc_commune_all.csv
sed -i 's#"##g' loc_commune_all.csv

wget -N https://github.com/etalab/decoupage-administratif/raw/master/sources/collectivites-outremer.csv
xsv search -s code_collectivite 987 collectivites-outremer.csv \
    | xsv select code_commune \
    | sed '1d' \
    | sort \
    >| reference_decoupage_admin_com_polynesie.txt

comm reference_decoupage_admin_com_polynesie.txt loc_commune_all.csv >| delta_com.csv
