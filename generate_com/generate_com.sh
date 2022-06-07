query-overpass ../overpass_com.ql >| com.geojson

# SELECT json_each(t.tags) FROM com AS t;

# ogrinfo /tmp/com.geojson \
#         -dialect SQLite \
#         -sql "SELECT json_extract(t.tags, '$.\"ref:INSEE\"') FROM com AS t"

ogr2ogr com.shp \
        -dialect SQLite \
        -sql "SELECT id, type, json_extract(com.tags, '$.\"ref:INSEE\"') AS insee, json_extract(com.tags, '$.name') AS nom, json_extract(com.tags, '$.wikipedia') AS wikipedia, floor(st_area(st_transform(geometry,3857))/10000) as surf_ha, ST_Multi(geometry) AS geometry FROM com WHERE GeometryType(ST_Multi(geometry)) = 'MULTIPOLYGON'" \
        -lco ENCODING=UTF-8 \
        -nln "com" \
        com.geojson
# Attention, nécessite une version de GDAL récente car partie
# ROW_NUMBER() OVER (PARTITION BY insee ORDER BY surf_ha ASC)
# liée à une version récente de SQlite dont dépend GDAL
ogr2ogr osm_communes_com.shp \
        -dialect SQLite \
        -sql "select insee, nom, wikipedia, surf_ha, geometry from ( select insee, nom, wikipedia, surf_ha, geometry, ROW_NUMBER() OVER (PARTITION BY insee ORDER BY surf_ha ASC) as rn from com ) as a where rn = 1 AND insee != '975'" \
        -lco ENCODING=UTF-8 com.shp

ogr2ogr osm_communes_com_no_polynesie_and_nc.shp \
        -dialect SQLite \
	-sql "SELECT * FROM osm_communes_com WHERE substr(insee, 1, 3) NOT IN ('987', '988')" \
        -lco ENCODING=UTF-8 osm_communes_com.shp

