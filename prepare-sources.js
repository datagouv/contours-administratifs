#!/usr/bin/env node
const path = require('path')
const fs = require('fs')
const {pathExists, mkdirp} = require('fs-extra')
const got = require('got')
const Seven = require('node-7z')
const decompress = require('decompress')

const SOURCES_PATH = path.join(__dirname, 'sources')

const ADMIN_EXPRESS_BASE_URL = 'https://data.geopf.fr/telechargement/download/ADMIN-EXPRESS-COG/ADMIN-EXPRESS-COG_3-2__SHP_WGS84G_FRA_2025-04-02/'
const ADMIN_EXPRESS_FILE = 'ADMIN-EXPRESS-COG_3-2__SHP_WGS84G_FRA_2025-04-02.7z'

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
      $cherryPick: ['COMMUNE.*', 'COMMUNE_ASSOCIEE_OU_DELEGUEE.*', 'ARRONDISSEMENT_MUNICIPAL.*']
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
  await downloadSourceFile(OSM_COMMUNES_COM_BASE_URL + OSM_COMMUNES_COM_FILE, OSM_COMMUNES_COM_FILE)
  await decompressOsmCommunesComFiles()
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
