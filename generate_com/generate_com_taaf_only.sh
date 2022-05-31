interpreter=https://overpass.kumi.systems/api/interpreter
query-overpass --overpass-url $interpreter <(echo 'rel(id:1401924);(._;>;);out;') >| 98411.geojson
ogr2ogr -f GeoJSON \
        -lco WRITE_NAME=NO \
        98411_demo.geojson \
        98411.geojson \
        -dialect SQLite \
        -sql "SELECT cast('98411' AS text) AS insee, cast('Îles Saint-Paul et Nouvelle-Amsterdam' AS text) AS nom, cast('' AS text) AS wikipedia, Area(ST_Union(geometry), TRUE) / 10000 AS area_ha, ST_Union(geometry) AS geometry FROM (SELECT ST_BuildArea(geometry) AS geometry FROM (SELECT linemerge(geometry) AS geometry FROM (SELECT ST_collect(geometry) AS geometry FROM \"98411\" WHERE ST_GeometryType(geometry) = 'LINESTRING') AS foo) AS bar UNION ALL SELECT ST_collect(geometry) AS geometry FROM \"98411\" WHERE ST_GeometryType(geometry) = 'POLYGON') AS baz"

sleep 3
query-overpass --overpass-url $interpreter <(echo 'rel(id:938024);(._;>;);out;') >| 98412.geojson
ogr2ogr -f GeoJSON -lco WRITE_NAME=NO \
        98412_demo.geojson \
        98412.geojson  \
        -dialect SQLite \
        -sql "SELECT cast('98412' AS text) AS insee, cast('Archipel des Kerguelen' AS text) AS nom, cast('' AS text) AS wikipedia, Area(ST_Union(geometry), TRUE) / 10000 AS area_ha, ST_Union(geometry) AS geometry FROM (SELECT ST_BuildArea(geometry) AS geometry FROM (SELECT linemerge(geometry) AS geometry FROM (SELECT ST_collect(geometry) AS geometry FROM \"98412\" WHERE ST_GeometryType(geometry) = 'LINESTRING') AS foo) AS bar UNION ALL SELECT ST_collect(geometry) AS geometry FROM \"98412\" WHERE ST_GeometryType(geometry) = 'POLYGON') AS baz"

sleep 3
query-overpass --overpass-url $interpreter <(echo 'rel(id:6063094);(._;>;);out;') >| 98413.geojson
ogr2ogr -f GeoJSON \
        -lco WRITE_NAME=NO \
        98413_demo.geojson \
        98413.geojson \
        -dialect SQLite \
        -sql "SELECT cast('98413' AS text) AS insee, cast('Archipel des Crozet' AS text) AS nom, cast('' AS text) AS wikipedia, Area(ST_Union(geometry), TRUE) / 10000 AS area_ha, ST_Union(geometry) AS geometry FROM (SELECT ST_BuildArea(geometry) AS geometry FROM (SELECT linemerge(geometry) AS geometry FROM (SELECT ST_collect(geometry) AS geometry FROM \"98413\" WHERE ST_GeometryType(geometry) = 'LINESTRING') AS foo) AS bar UNION ALL SELECT ST_collect(geometry) AS geometry FROM \"98413\" WHERE ST_GeometryType(geometry) = 'POLYGON') AS baz"

sleep 3
query-overpass --overpass-url $interpreter <(echo 'rel(id:3394114);(._;>;);out;') >| 98414.geojson
ogr2ogr -f GeoJSON \
        -lco WRITE_NAME=NO \
        98414_demo.geojson \
        98414.geojson \
        -dialect SQLite \
        -sql "SELECT cast('98414' AS text) AS insee, cast('La Terre-Adélie' AS text) AS nom, cast('' AS text) AS wikipedia, Area(ST_Union(geometry), TRUE) / 10000 AS area_ha, ST_Union(geometry) AS geometry FROM (SELECT ST_BuildArea(geometry) AS geometry FROM (SELECT linemerge(geometry) AS geometry FROM (SELECT ST_collect(geometry) AS geometry FROM \"98414\" WHERE ST_GeometryType(geometry) = 'LINESTRING') AS foo) AS bar UNION ALL SELECT ST_collect(geometry) AS geometry FROM \"98414\" WHERE ST_GeometryType(geometry) = 'POLYGON') AS baz"

sleep 3
query-overpass --overpass-url $interpreter <(echo 'rel(id:6077487);(._;>;);out;') >| 98415_bassas_da_india.geojson
ogr2ogr -f GeoJSON \
        -lco WRITE_NAME=NO \
        98415_bassas_da_india_demo.geojson \
        98415_bassas_da_india.geojson \
        -dialect SQLite \
        -sql "SELECT cast('98415_bassas_da_india' AS text) AS insee, 'Bassas Da India' AS nom, cast('' AS text) AS wikipedia, Area(ST_Union(geometry), TRUE) / 10000 AS area_ha, ST_Union(geometry) AS geometry FROM (SELECT ST_BuildArea(geometry) AS geometry FROM (SELECT linemerge(geometry) AS geometry FROM (SELECT ST_collect(geometry) AS geometry FROM \"98415_bassas_da_india\" WHERE ST_GeometryType(geometry) = 'LINESTRING') AS foo) AS bar UNION ALL SELECT ST_collect(geometry) AS geometry FROM \"98415_bassas_da_india\" WHERE ST_GeometryType(geometry) = 'POLYGON') AS baz"

sleep 3
query-overpass --overpass-url $interpreter <(echo 'rel(id:6376308);(._;>;);out;') >| 98415_ile_europa.geojson
ogr2ogr -f GeoJSON \
        -lco WRITE_NAME=NO \
        98415_ile_europa_demo.geojson \
        98415_ile_europa.geojson \
        -dialect SQLite \
        -sql "SELECT cast('98415_ile_europa' AS text) AS insee, 'Île Europa' AS nom, cast('' AS text) AS wikipedia, Area(ST_Union(geometry), TRUE) / 10000 AS area_ha, ST_Union(geometry) AS geometry FROM (SELECT ST_BuildArea(geometry) AS geometry FROM (SELECT linemerge(geometry) AS geometry FROM (SELECT ST_collect(geometry) AS geometry FROM \"98415_ile_europa\" WHERE ST_GeometryType(geometry) = 'LINESTRING') AS foo) AS bar UNION ALL SELECT ST_collect(geometry) AS geometry FROM \"98415_ile_europa\" WHERE ST_GeometryType(geometry) = 'POLYGON') AS baz"

sleep 3
query-overpass --overpass-url $interpreter <(echo 'rel(id:3340293);(._;>;);out;') >| 98415_iles_glorieuses.geojson
ogr2ogr -f GeoJSON \
        -lco WRITE_NAME=NO \
        98415_iles_glorieuses_demo.geojson \
        98415_iles_glorieuses.geojson \
        -dialect SQLite \
        -sql "SELECT cast('98415_iles_glorieuses' AS text) AS insee, 'Îles glorieuses' AS nom, cast('' AS text) AS wikipedia, Area(ST_Union(geometry), TRUE) / 10000 AS area_ha, ST_Union(geometry) AS geometry FROM (SELECT ST_BuildArea(geometry) AS geometry FROM (SELECT linemerge(geometry) AS geometry FROM (SELECT ST_collect(geometry) AS geometry FROM \"98415_iles_glorieuses\" WHERE ST_GeometryType(geometry) = 'LINESTRING') AS foo) AS bar UNION ALL SELECT ST_collect(geometry) AS geometry FROM \"98415_iles_glorieuses\" WHERE ST_GeometryType(geometry) = 'POLYGON') AS baz"

sleep 3
query-overpass --overpass-url $interpreter <(echo 'way(id:159357927);(._;>;);out;') >| 98415_ile_juan_de_nova.geojson
ogr2ogr -f GeoJSON \
        -lco WRITE_NAME=NO \
        98415_ile_juan_de_nova_demo.geojson \
        98415_ile_juan_de_nova.geojson \
        -dialect SQLite \
        -sql "SELECT cast('98415_ile_juan_de_nova' AS text) AS insee, 'Île Juan de Nova' AS nom, cast('' AS text) AS wikipedia, Area(ST_Union(geometry), TRUE) / 10000 AS area_ha, ST_Union(geometry) AS geometry FROM (SELECT ST_BuildArea(geometry) AS geometry FROM (SELECT linemerge(geometry) AS geometry FROM (SELECT ST_collect(geometry) AS geometry FROM \"98415_ile_juan_de_nova\" WHERE ST_GeometryType(geometry) = 'LINESTRING') AS foo) AS bar UNION ALL SELECT ST_collect(geometry) AS geometry FROM \"98415_ile_juan_de_nova\" WHERE ST_GeometryType(geometry) = 'POLYGON') AS baz"

sleep 3
query-overpass --overpass-url $interpreter <(echo 'way(id:160030161);(._;>;);out;') >| 98415_ile_tromelin.geojson
ogr2ogr -f GeoJSON \
        -lco WRITE_NAME=NO \
        98415_ile_tromelin_demo.geojson \
        98415_ile_tromelin.geojson \
        -dialect SQLite \
        -sql "SELECT cast('98415_ile_tromelin' AS text) AS insee, 'Île Tromelin' AS nom, cast('' AS text) AS wikipedia, Area(ST_Union(geometry), TRUE) / 10000 AS area_ha, ST_Union(geometry) AS geometry FROM (SELECT ST_BuildArea(geometry) AS geometry FROM (SELECT linemerge(geometry) AS geometry FROM (SELECT ST_collect(geometry) AS geometry FROM \"98415_ile_tromelin\" WHERE ST_GeometryType(geometry) = 'LINESTRING') AS foo) AS bar UNION ALL SELECT ST_collect(geometry) AS geometry FROM \"98415_ile_tromelin\" WHERE ST_GeometryType(geometry) = 'POLYGON') AS baz"

ogrmerge.py -f GeoJSON \
            -overwrite_ds \
            -single \
            -lco WRITE_NAME=NO \
            -o 98415.geojson $(ls 98415_*_demo.geojson | grep -v '98415_demo.geojson\|98415.geojson')

ogr2ogr -f GeoJSON \
        -lco WRITE_NAME=NO 98415_demo.geojson 98415.geojson \
        -dialect SQLite \
        -sql "SELECT cast('98415' AS text) AS insee, cast('Îles Éparses de l''océan Indien' AS text) AS nom, 'fr:Îles Éparses de l''océan Indien' AS wikipedia, Area(ST_Union(geometry), TRUE) / 10000 AS area_ha, ST_Union(geometry) AS geometry FROM \"98415\""

ogrmerge.py -f GeoJSON \
            -overwrite_ds \
            -single \
            -lco WRITE_NAME=NO \
            -o taaf.geojson $(ls 9841[0-5]_demo.geojson)
