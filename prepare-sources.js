#!/usr/bin/env node
const path = require('path')
const fs = require('fs')
const {pathExists, mkdirp} = require('fs-extra')
const got = require('got')
const gdal = require('gdal-async')
const Seven = require('node-7z')
const decompress = require('decompress')

const SOURCES_PATH = path.join(__dirname, 'sources')

const ADMIN_EXPRESS_BASE_URL = 'https://data.geopf.fr/telechargement/download/ADMIN-EXPRESS-COG/ADMIN-EXPRESS-COG_4-0__GPKG_WGS84G_FRA_2025-01-01/'
const ADMIN_EXPRESS_FILE = 'ADMIN-EXPRESS-COG_4-0__GPKG_WGS84G_FRA_2025-01-01.7z'

const OSM_COMMUNES_COM_BASE_URL = 'http://etalab-datasets.geo.data.gouv.fr/contours-administratifs/2022/shp/'
const OSM_COMMUNES_COM_FILE = 'communes-com-20220101-shp.zip'

function getSourceFilePath(fileName) {
  return path.join(SOURCES_PATH, fileName)
}

async function downloadSourceFile(url, fileName) {
  if (await pathExists(getSourceFilePath(fileName))) {
    console.log(`${fileName} already exists. Skip download.`)
    return
  }

  console.log(`Downloading ${fileName}…`)
  return new Promise((resolve, reject) => {
    const outputFile = fs.createWriteStream(getSourceFilePath(fileName))
    outputFile.on('finish', resolve)
    outputFile.on('error', reject)

    const stream = got.stream(url, {responseType: 'buffer'})
    stream.on('error', reject)
    stream.pipe(outputFile)
  })
}

async function decompressAdminExpressFiles() {
  console.log('Decompressing ADMIN EXPRESS archive…')

  return new Promise((resolve, reject) => {
    const extractStream = Seven.extract(getSourceFilePath(ADMIN_EXPRESS_FILE), SOURCES_PATH, {
      recursive: true,
      $cherryPick: ['*.gpkg']
    })

    extractStream.on('end', () => resolve())
    extractStream.on('error', reject)
  })
}

async function decompressOsmCommunesComFiles() {
  await decompress(
    getSourceFilePath(OSM_COMMUNES_COM_FILE),
    SOURCES_PATH,
    {
      filter(file) {
        return file.path.startsWith('communes-com')
      },
      map(file) {
        file.path = 'osm-communes-com' + path.extname(file.path)
        return file
      }
    }
  )
}

async function main() {
  await mkdirp(SOURCES_PATH)
  await downloadSourceFile(ADMIN_EXPRESS_BASE_URL + ADMIN_EXPRESS_FILE, ADMIN_EXPRESS_FILE)
  await decompressAdminExpressFiles()

  const filesList = await fs.promises.readdir(SOURCES_PATH)
  const gpkgs = filesList.filter(e => path.extname(e).toLowerCase() === '.gpkg')

  const dataset = gdal.open(path.join(SOURCES_PATH, gpkgs[0]))
  const layers = [
    'arrondissement_municipal',
    'chef_lieu_de_commune',
    'commune',
    'commune_associee_ou_deleguee'
  ]
  for (const layer of layers) {
    gdal.vectorTranslate(String(path.join(SOURCES_PATH, layer.toUpperCase() + '.shp')), dataset, [
      '-f',
      'ESRI Shapefile',
      '-dialect',
      'SQLite',
      '-sql',
      'SELECT nom_officiel AS nom, ' + (layer === 'chef_lieu_de_commune' ? 'code_insee_de_la_commune' : 'code_insee') + (layer === 'commune' ? ', superficie_cadastrale AS s_cad' : '') + ', geometrie FROM ' + layer,
      '-lco',
      'ENCODING=UTF-8'
    ])
  }

  gdal.vectorTranslate(String(path.join(SOURCES_PATH, 'COLLECTIVITE_TERRITORIALE_977_978.shp')), dataset, ['-f', 'ESRI Shapefile', '-dialect', 'SQLite', '-sql', 'SELECT replace(nom_officiel, \'Collectivité de \', \'\') as nom, code_insee || \'01\' as code_insee, geometrie FROM collectivite_territoriale WHERE code_insee IN (977, 978)', '-lco', 'ENCODING=UTF-8'])
  await downloadSourceFile(OSM_COMMUNES_COM_BASE_URL + OSM_COMMUNES_COM_FILE, OSM_COMMUNES_COM_FILE)
  await decompressOsmCommunesComFiles()
  const datasetOsm = gdal.open(path.join(SOURCES_PATH, 'osm-communes-com.shp'))
  gdal.vectorTranslate(String(path.join(SOURCES_PATH, 'osm-communes-com-without-admin-express.shp')), datasetOsm, ['-f', 'ESRI Shapefile', '-sql', 'SELECT nom, insee AS code_insee FROM "osm-communes-com" WHERE insee NOT IN (\'97501\', \'97502\', \'97701\', \'97801\')', '-lco', 'ENCODING=UTF-8'])
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
