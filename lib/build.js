#!/usr/bin/env node --max_old_space_size=8192
const {join} = require('path')
const {promisify} = require('util')
const {writeFile, mkdirp} = require('fs-extra')
const decompress = require('decompress')
const mapshaper = require('mapshaper')
const {truncate, feature} = require('@turf/turf')
const {mergeFeatures} = require('./merge')
const {communesIndexes, departementsIndexes, regionsIndexes, epciIndexes} = require('./decoupage-administratif')

const applyCommands = promisify(mapshaper.applyCommands)

const rootPath = join(__dirname, '..')
const communesArchive = join(rootPath, 'data', 'communes-20190101-shp.zip')
const layerName = 'communes-20190101'
const destPath = join(rootPath, 'dist')

async function getSimplifiedCommunes(sourceFiles, interval) {
  const inputFiles = sourceFiles.reduce((acc, f) => {
    acc[f.path] = f.data
    return acc
  }, {})
  const input = Object.keys(inputFiles).find(f => f.endsWith('shp'))
  const simplifyOptions = `keep-shapes interval=${interval}`
  const command = `-i ${input} -simplify ${simplifyOptions} -o output.geojson format=geojson`
  const outputFiles = await applyCommands(command, inputFiles)
  return JSON.parse(outputFiles['output.geojson']).features
    .map(feature => {
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

async function writeGeoJSON(features, destPath) {
  await writeFile(destPath, stringify(features.map(f => truncate(f, {precision: 6, coordinates: 2, mutate: false}))))
}

async function buildAndWriteEPCI(simplifiedCommunes, destPath) {
  const epci = (await mergeFeatures(simplifiedCommunes.filter(c => c.properties.epci), 'epci')).map(({geometry, properties}) => {
    const {code, nom} = epciIndexes.code[properties.epci]
    return feature(geometry, {code, nom})
  })
  await writeGeoJSON(epci, destPath)
}

async function buildAndWriteDepartements(simplifiedCommunes, destPath) {
  const departements = (await mergeFeatures(simplifiedCommunes, 'departement')).map(({geometry, properties}) => {
    const {code, nom, region} = departementsIndexes.code[properties.departement]
    return feature(geometry, {code, nom, region})
  })
  await writeGeoJSON(departements, destPath)
}

async function buildAndWriteRegions(simplifiedCommunes, destPath) {
  const regions = (await mergeFeatures(simplifiedCommunes, 'region')).map(({geometry, properties}) => {
    const {code, nom} = regionsIndexes.code[properties.region]
    return feature(geometry, {code, nom})
  })
  await writeGeoJSON(regions, destPath)
}

async function buildAndWriteCommunes(simplifiedCommunes, destPath) {
  const communes = simplifiedCommunes.map(({geometry, properties}) => {
    const {code, nom, departement, region} = communesIndexes.code[properties.insee]
    return feature(geometry, {code, nom, departement, region})
  })
  await writeGeoJSON(communes, destPath)
}

async function buildContours(layerFiles, interval, destPath) {
  console.log(`  Extraction et simplification des communes : ${interval}m`)
  const simplifiedCommunes = await getSimplifiedCommunes(layerFiles, interval)

  await buildAndWriteEPCI(simplifiedCommunes, join(destPath, `epci-${interval}m.geojson`))
  await buildAndWriteDepartements(simplifiedCommunes, join(destPath, `departements-${interval}m.geojson`))
  await buildAndWriteRegions(simplifiedCommunes, join(destPath, `regions-${interval}m.geojson`))
  await buildAndWriteCommunes(simplifiedCommunes, join(destPath, `communes-${interval}m.geojson`))
}

async function main() {
  await mkdirp(destPath)
  const files = await decompress(communesArchive)
  const layerFiles = files.filter(f => f.path.startsWith(layerName))

  await buildContours(layerFiles, 100, destPath)
  await buildContours(layerFiles, 50, destPath)
  await buildContours(layerFiles, 5, destPath)
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
