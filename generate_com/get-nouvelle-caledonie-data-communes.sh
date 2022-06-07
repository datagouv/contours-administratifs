objectIds=$(curl 'https://services1.arcgis.com/TZcrgU6CIbqWt9Qv/arcgis/rest/services/limites_terrestres/FeatureServer/0/query?f=json&where=1%3D1&returnIdsOnly=true&geometry=-256724.014170,124883.718478,1025589.687163,527951.078064&geometryType=esriGeometryEnvelope&spatialRel=esriSpatialRelEnvelopeIntersects' -H 'User-Agent: Mozilla/5.0 QGIS/31603'  --compressed | jq -r '.objectIds | map(tostring) | join("%2C")')

ogr2ogr nc.shp \
	-s_srs "EPSG:3163" \
	-t_srs "EPSG:4326" \
	-dialect SQLite \
	-sql "SELECT nom_minus AS nom, code_com AS insee, '' AS wikipedia, \"Shape__Area\" / 10000 AS surf_ha, geometry FROM \"ESRIJSON\"" "https://services1.arcgis.com/TZcrgU6CIbqWt9Qv/ArcGIS/rest/services/limites_terrestres/FeatureServer/0/query?where=&objectIds=${objectIds}&time=&geometry=&geometryType=esriGeometryPolygon&inSR=&spatialRel=esriSpatialRelIntersects&resultType=none&distance=0.0&units=esriSRUnit_Meter&returnGeodetic=false&outFields=*&returnGeometry=true&returnCentroid=false&featureEncoding=esriDefault&multipatchOption=xyFootprint&maxAllowableOffset=&geometryPrecision=&outSR=&defaultSR=&datumTransformation=&applyVCSProjection=false&returnIdsOnly=false&returnUniqueIdsOnly=false&returnCountOnly=false&returnExtentOnly=false&returnQueryGeometry=false&returnDistinctValues=false&cacheHint=false&orderByFields=&groupByFieldsForStatistics=&outStatistics=&having=&resultOffset=&resultRecordCount=&returnZ=false&returnM=false&returnExceededLimitFeatures=true&quantizationParameters=&sqlFormat=none&f=json&token="

# We go through ArcGIS feature server retrieval. Alternative could be gettting the zip (commented)
# wget --content-disposition "https://opendata.arcgis.com/api/v3/datasets/e1d853903cc64d40af7fbb5ee57e3029_0/downloads/data?format=shp&spatialRefId=3163"
