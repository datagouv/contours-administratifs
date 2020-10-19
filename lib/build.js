#!/usr/bin/env node --max_old_space_size=8192
require('dotenv').config()
const {join, resolve} = require('path')
const {writeFile, mkdirp} = require('fs-extra')
const decompress = require('decompress')
const {truncate, feature} = require('@turf/turf')
const readShpFeaturesAndSimplify = require('./read-shp-features-simplify')
const {mergeFeatures} = require('./merge')
const {communesIndexes, departementsIndexes, regionsIndexes, epciIndexes} = require('./decoupage-administratif')

const communesArchive = resolve(process.env.COMMUNES_PATH)
const arrondissementsArchive = resolve(process.env.ARRONDISSEMENTS_PATH)
const destPath = join(__dirname, '..', 'dist')

async function getSimplifiedCommunes(communesFiles, interval) {
  const readFeatures = await readShpFeaturesAndSimplify(communesFiles, interval)

  return readFeatures.map(feature => {
    const {properties} = feature
    const commune = communesIndexes.code[properties.insee]
    properties.departement = commune.departement
    properties.region = commune.region
    properties.epci = properties.insee in epciIndexes.commune ?
      epciIndexes.commune[properties.insee].code :
      undefined
    return feature
  })
}

async function getSimplifiedArrondissements(arrondissementsFiles, interval) {
  const readFeatures = await readShpFeaturesAndSimplify(arrondissementsFiles, interval)

  return readFeatures.map(feature => {
    const {properties} = feature
    const commune = communesIndexes.code[properties.insee]
    properties.departement = commune.departement
    properties.region = commune.region
    properties.epci = properties.insee in epciIndexes.commune ?
      epciIndexes.commune[properties.insee].code :
      undefined
    return feature
  })
}

function stringify(features) {
  return JSON.stringify({type: 'FeatureCollection', features})
}

async function writeGeoJSON(features, interval, layerName) {
  const precision = getPrecision(interval)
  await writeFile(
    join(destPath, `${layerName}-${interval}m.geojson`),
    stringify(features.map(f => truncate(f, {precision, coordinates: 2, mutate: false})))
  )
}

async function buildAndWriteEPCI(simplifiedCommunes, interval) {
  const epci = (await mergeFeatures(simplifiedCommunes.filter(c => c.properties.epci), 'epci')).map(({geometry, properties}) => {
    const {code, nom} = epciIndexes.code[properties.epci]
    return feature(geometry, {code, nom})
  })
  await writeGeoJSON(epci, interval, 'epci')
}

async function buildAndWriteDepartements(simplifiedCommunes, interval) {
  const departements = (await mergeFeatures(simplifiedCommunes, 'departement')).map(({geometry, properties}) => {
    const {code, nom, region} = departementsIndexes.code[properties.departement]
    return feature(geometry, {code, nom, region})
  })
  await writeGeoJSON(departements, interval, 'departements')
}

async function buildAndWriteRegions(simplifiedCommunes, interval) {
  const regions = (await mergeFeatures(simplifiedCommunes, 'region')).map(({geometry, properties}) => {
    const {code, nom} = regionsIndexes.code[properties.region]
    return feature(geometry, {code, nom})
  })
  await writeGeoJSON(regions, interval, 'regions')
}

async function buildAndWriteCommunes(simplifiedCommunes, interval) {
  const communes = simplifiedCommunes.map(({geometry, properties}) => {
    const {code, nom, departement, region} = communesIndexes.code[properties.insee]
    return feature(geometry, {code, nom, departement, region})
  })
  await writeGeoJSON(communes, interval, 'communes')
}

async function buildAndWriteArrondissements(simplifiedArrondissements, interval) {
  const arrondissements = simplifiedArrondissements.map(({geometry, properties}) => {
    const {code, nom, departement, region} = communesIndexes.code[properties.insee]
    return feature(geometry, {code, nom, departement, region})
  })
  await writeGeoJSON(arrondissements, interval, 'arrondissements-municipaux')
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

async function buildContours(communesFiles, arrondissementsFiles, interval) {
  console.log(`  Extraction et simplification des communes : ${interval}m`)
  const simplifiedCommunes = await getSimplifiedCommunes(communesFiles, interval)
  const simplifiedArrondissements = await getSimplifiedArrondissements(arrondissementsFiles, interval)

  await buildAndWriteEPCI(simplifiedCommunes, interval)
  await buildAndWriteDepartements(simplifiedCommunes, interval)
  await buildAndWriteRegions(simplifiedCommunes, interval)
  await buildAndWriteCommunes(simplifiedCommunes, interval)
  await buildAndWriteArrondissements(simplifiedArrondissements, interval)
}

async function main() {
  await mkdirp(destPath)
  const communesFiles = await decompress(communesArchive)
  const arrondissementsFiles = await decompress(arrondissementsArchive)

  await buildContours(communesFiles, arrondissementsFiles, 1000)
  await buildContours(communesFiles, arrondissementsFiles, 100)
  await buildContours(communesFiles, arrondissementsFiles, 50)
  await buildContours(communesFiles, arrondissementsFiles, 5)
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
