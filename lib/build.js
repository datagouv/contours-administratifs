#!/usr/bin/env node --max_old_space_size=8192
require('dotenv').config()
const {join, resolve} = require('path')
const Keyv = require('keyv')
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
    const {properties: p} = feature
    const newProperties = {
      code: p.INSEE_COM,
      nom: p.NOM,
      departement: p.INSEE_DEP,
      region: p.INSEE_REG,
      epci: p.INSEE_COM in epciIndexes.commune ?
        epciIndexes.commune[p.INSEE_COM].code :
        undefined
    }
    feature.properties = newProperties
    return feature
  })
}

async function getSimplifiedArrondissements(arrondissementsFiles, interval) {
  const readFeatures = await readShpFeaturesAndSimplify(arrondissementsFiles, interval)

  return readFeatures.map(feature => {
    const {properties: p} = feature
    const commune = communesIndexes.code[p.INSEE_COM]
    const newProperties = {
      code: p.INSEE_ARM,
      nom: p.NOM,
      commune: p.INSEE_COM,
      departement: commune.departement,
      region: commune.region
    }
    feature.properties = newProperties
    return feature
  })
}

function stringify(features) {
  return JSON.stringify({type: 'FeatureCollection', features})
}

async function writeLayer(features, interval, layerName) {
  const precision = getPrecision(interval)
  const truncatedFeatures = features.map(f => truncate(f, {precision, coordinates: 2, mutate: false}))

  const db = new Keyv(`sqlite://${layerName}-${interval}m.sqlite`)
  await Promise.all(truncatedFeatures.map(async feature => {
    await db.set(feature.properties.code, feature)
  }))

  await writeFile(
    join(destPath, `${layerName}-${interval}m.geojson`),
    stringify(truncatedFeatures)
  )
}

async function buildAndWriteEPCI(simplifiedCommunes, interval) {
  const epci = (await mergeFeatures(simplifiedCommunes.filter(c => c.properties.epci), 'epci')).map(({geometry, properties}) => {
    const {code, nom} = epciIndexes.code[properties.epci]
    return feature(geometry, {code, nom})
  })
  await writeLayer(epci, interval, 'epci')
}

async function buildAndWriteDepartements(simplifiedCommunes, interval) {
  const departements = (await mergeFeatures(simplifiedCommunes, 'departement')).map(({geometry, properties}) => {
    const {code, nom, region} = departementsIndexes.code[properties.departement]
    return feature(geometry, {code, nom, region})
  })
  await writeLayer(departements, interval, 'departements')
}

async function buildAndWriteRegions(simplifiedCommunes, interval) {
  const regions = (await mergeFeatures(simplifiedCommunes, 'region')).map(({geometry, properties}) => {
    const {code, nom} = regionsIndexes.code[properties.region]
    return feature(geometry, {code, nom})
  })
  await writeLayer(regions, interval, 'regions')
}

async function buildAndWriteCommunes(simplifiedCommunes, interval) {
  const communes = simplifiedCommunes.map(({geometry, properties}) => {
    const {code, nom, departement, region} = communesIndexes.code[properties.code]
    return feature(geometry, {
      code, nom, departement, region,
      epci: properties.epci
    })
  })
  await writeLayer(communes, interval, 'communes')
}

async function buildAndWriteArrondissements(simplifiedArrondissements, interval) {
  const arrondissements = simplifiedArrondissements.map(({geometry, properties}) => {
    const {code, nom, departement, region} = communesIndexes.code[properties.code]
    return feature(geometry, {code, nom, departement, region, commune: properties.commune})
  })
  await writeLayer(arrondissements, interval, 'arrondissements-municipaux')
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
