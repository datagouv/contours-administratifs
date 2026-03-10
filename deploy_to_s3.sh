# Public URL https://contours-administratifs.s3.rbx.io.cloud.ovh.net/2025/geojson/communes-5m.geojson
# aws s3 ls --profile datagouv_cadastre contours-administratifs/2025/geojson/communes-5m.geojson
cd dist/
aws s3 cp --profile datagouv_cadastre \
          --exclude "*" \
          --include "*.geojson" \
          --content-type="Content-Type: application/geo+json" \
          --metadata-directive="REPLACE" \
          --recursive --acl=public-read  \
          . s3://contours-administratifs/2026/geojson/
aws s3 cp --profile datagouv_cadastre \
          --exclude "*" \
          --include "*.geojson.gz" \
          --content-type="Content-Type: application/octet-stream" \
          --metadata-directive="REPLACE" \
          --recursive --acl=public-read \
          . s3://contours-administratifs/2026/geojson/
