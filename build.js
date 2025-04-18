#!/usr/bin/env node --max_old_space_size=8192
require('dotenv').config()
const {join} = require('path')
const {chain} = require('lodash')
const Keyv = require('keyv')
const bluebird = require('bluebird')
const {outputJson, readFile} = require('fs-extra')
const {truncate, feature} = require('@turf/turf')
const extractFeaturesFromShapefiles = require('./lib/extract-features-from-shapefiles')
const mergeFeatures = require('./lib/merge-features')
const composeFeatures = require('./lib/compose-features')
const {communes, communesAssocieesDeleguees, epci, departements, regions, communesIndexes, epciIndexes} = require('./lib/decoupage-administratif')

const SOURCES_PATH = join(__dirname, 'sources')
const DIST_PATH = join(__dirname, 'dist')

async function getSimplifiedGeometries(featuresFiles, interval) {
  const readFeatures = await extractFeaturesFromShapefiles(featuresFiles, interval)

  return chain(readFeatures)
    .map(({properties: p, geometry}) => {
      return [
        p.INSEE_ARM || p.INSEE_CAD || p.INSEE_COM || p.insee,
        geometry
      ]
    })
    .fromPairs()
    .value()
}

async function computeCommunesIndex(featuresFiles, interval) {
  const geometriesIndex = await getSimplifiedGeometries(featuresFiles, interval)
  const unmergedFeatures = []

  communes.forEach(commune => {
    const geometries = []
    const codes = []

    if (geometriesIndex[commune.code]) {
      geometries.push(geometriesIndex[commune.code])
    } else {
      console.log(`Géométrie non trouvée pour la commune ${commune.code}`)
    }

    if (commune.anciensCodes) {
      for (const ancienCode of commune.anciensCodes) {
        const geometry = geometriesIndex[ancienCode]

        if (geometry) {
          geometries.push(geometry)
          codes.push(ancienCode)
          console.log(commune.code, ancienCode)
        }
      }
    }

    if (codes.length > 0) {
      console.log(`Contours des codes ${codes.join(',')} fusionnés en ${commune.code}`)
    }

    if (geometries.length === 0) {
      throw new Error(`Aucune géométrie pour construire le contour de la commune ${commune.code}`)
    }

    for (const geometry of geometries) {
      unmergedFeatures.push(feature(geometry, {code: commune.code}))
    }
  })

  const mergedFeatures = await mergeFeatures(unmergedFeatures, 'code')

  return chain(mergedFeatures)
    .map(f => [f.properties.code, f.geometry])
    .fromPairs()
    .value()
}

async function computeCommunesAssocieesDelegueesIndex(featuresFiles, interval) {
  const geometriesIndex = await getSimplifiedGeometries(featuresFiles, interval)
  const unmergedFeatures = []

  communesAssocieesDeleguees.forEach(commune => {
    const geometries = []

    if (geometriesIndex[commune.code]) {
      geometries.push(geometriesIndex[commune.code])
    } else {
      console.log(`Géométrie non trouvée pour la commune ${commune.code}`)
    }

    if (geometries.length === 0) {
      throw new Error(`Aucune géométrie pour construire le contour de la commune ${commune.code}`)
    }

    for (const geometry of geometries) {
      unmergedFeatures.push(feature(geometry, {code: commune.code}))
    }
  })

  const mergedFeatures = await mergeFeatures(unmergedFeatures, 'code')

  return chain(mergedFeatures)
    .map(f => [f.properties.code, f.geometry])
    .fromPairs()
    .value()
}

async function writeLayer(features, interval, layerName) {
  const precision = getPrecision(interval)
  const truncatedFeatures = features.map(f => truncate(f, {precision, coordinates: 2, mutate: false}))

  const db = new Keyv(`sqlite://${layerName}-${interval}m.sqlite`)
  await Promise.all(truncatedFeatures.map(async feature => {
    await db.set(feature.properties.code, feature)
  }))

  await outputJson(
    join(DIST_PATH, `${layerName}-${interval}m.geojson`),
    {type: 'FeatureCollection', features: truncatedFeatures}
  )
}

async function buildAndWriteEPCI(communesIndex, interval) {
  const features = await composeFeatures(
    epci.map(e => ({
      id: e.code,
      members: e.membres.map(m => m.code),
      properties: {
        code: e.code,
        nom: e.nom
      }
    })),
    communesIndex
  )

  await writeLayer(features, interval, 'epci')
}

async function buildAndWriteDepartements(communesIndex, interval) {
  const features = await composeFeatures(
    departements.map(d => ({
      id: d.code,
      members: communesIndexes.departement[d.code]
        .filter(c => c.type === 'commune-actuelle')
        .map(c => c.code),
      properties: {
        code: d.code,
        nom: d.nom,
        region: d.region
      }
    })),
    communesIndex
  )

  await writeLayer(features, interval, 'departements')
}

async function buildAndWriteRegions(communesIndex, interval) {
  const features = await composeFeatures(
    regions.map(r => ({
      id: r.code,
      members: communesIndexes.region[r.code]
        .filter(c => c.type === 'commune-actuelle')
        .map(c => c.code),
      properties: {
        code: r.code,
        nom: r.nom
      }
    })),
    communesIndex
  )

  await writeLayer(features, interval, 'regions')
}

async function buildAndWriteCommunes(communesIndex, interval) {
  const communesFeatures = communes.map(commune => {
    const geometry = communesIndex[commune.code]

    const properties = {
      code: commune.code,
      nom: commune.nom,
      departement: commune.departement,
      region: commune.region
    }

    if (['75056', '13055', '69123'].includes(commune.code)) {
      properties.plm = true
    }

    if (commune.commune) {
      properties.commune = commune.commune
    }

    if (commune.code in epciIndexes.commune) {
      properties.epci = epciIndexes.commune[commune.code].code
    }

    if (commune.collectiviteOutremer) {
      properties.collectiviteOutremer = commune.collectiviteOutremer.code
    }

    return feature(geometry, properties)
  })

  await writeLayer(communesFeatures, interval, 'communes')
}

async function buildAndWriteCommunesAssocieesDeleguees(communesAssocieesDelegueesIndex, interval) {
  const communesFeatures = communesAssocieesDeleguees.map(commune => {
    const geometry = communesAssocieesDelegueesIndex[commune.code]

    const properties = {
      code: commune.code,
      nom: commune.nom,
      type: commune.type,
      departement: commune.departement,
      region: commune.region
    }

    if (commune.chefLieu in epciIndexes.commune) {
      properties.epci = epciIndexes.commune[commune.chefLieu].code
    }

    return feature(geometry, properties)
  })

  await writeLayer(communesFeatures, interval, 'communes-associees-deleguees')
}

function getPrecision(interval) {
  if (interval < 10) {
    return 6
  }

  if (interval < 100) {
    return 5
  }

  if (interval < 1000) {
    return 4
  }

  return 3
}

async function buildContours(featuresFiles, interval) {
  console.log(`  Extraction et simplification des communes : ${interval}m`)
  const communesIndex = await computeCommunesIndex(featuresFiles, interval)

  await buildAndWriteCommunes(communesIndex, interval)
  await buildAndWriteEPCI(communesIndex, interval)
  await buildAndWriteDepartements(communesIndex, interval)
  await buildAndWriteRegions(communesIndex, interval)
}

async function buildContoursCommunesAssocieesDeleguees(featuresFiles, interval) {
  console.log(`  Extraction et simplification des communes associées et déléguées: ${interval}m`)
  const communesAssocieesDelegueesIndex = await computeCommunesAssocieesDelegueesIndex(featuresFiles, interval)

  await buildAndWriteCommunesAssocieesDeleguees(communesAssocieesDelegueesIndex, interval)
}

async function readSourcesFiles(fileNames) {
  return bluebird.mapSeries(fileNames, async fileName => {
    const filePath = join(SOURCES_PATH, fileName)
    const fileData = await readFile(filePath)
    return {name: fileName, data: fileData}
  })
}

async function main() {
  const featuresFiles = await readSourcesFiles([
    'COMMUNE.cpg',
    'COMMUNE.shp',
    'COMMUNE.dbf',
    'COMMUNE.prj',
    'COMMUNE.shx',
    'ARRONDISSEMENT_MUNICIPAL.cpg',
    'ARRONDISSEMENT_MUNICIPAL.shp',
    'ARRONDISSEMENT_MUNICIPAL.dbf',
    'ARRONDISSEMENT_MUNICIPAL.prj',
    'ARRONDISSEMENT_MUNICIPAL.shx',
    'osm-communes-com.cpg',
    'osm-communes-com.shp',
    'osm-communes-com.dbf',
    'osm-communes-com.prj',
    'osm-communes-com.shx'
  ])

  const featuresCommunesAssocieesDelegueesFiles = await readSourcesFiles([
    'COMMUNE_ASSOCIEE_OU_DELEGUEE.cpg',
    'COMMUNE_ASSOCIEE_OU_DELEGUEE.shp',
    'COMMUNE_ASSOCIEE_OU_DELEGUEE.dbf',
    'COMMUNE_ASSOCIEE_OU_DELEGUEE.prj',
    'COMMUNE_ASSOCIEE_OU_DELEGUEE.shx'
  ])

  if (process.env.COMMUNES_ASSOCIEES_DELEGUEES) {
    await buildContoursCommunesAssocieesDeleguees(featuresCommunesAssocieesDelegueesFiles, 1000)
    await buildContoursCommunesAssocieesDeleguees(featuresCommunesAssocieesDelegueesFiles, 100)
    await buildContoursCommunesAssocieesDeleguees(featuresCommunesAssocieesDelegueesFiles, 50)
    await buildContoursCommunesAssocieesDeleguees(featuresCommunesAssocieesDelegueesFiles, 5)
  }

  await buildContours(featuresFiles, 1000)
  await buildContours(featuresFiles, 100)
  await buildContours(featuresFiles, 50)
  await buildContours(featuresFiles, 5)
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
