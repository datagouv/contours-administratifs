#!/usr/bin/env node
require('dotenv').config()
const path = require('path')
const fs = require('fs')
const {pathExists, mkdirp} = require('fs-extra')
const got = require('got')
const Seven = require('node-7z')
const decompress = require('decompress')

const SOURCES_PATH = path.join(__dirname, 'sources')

const ADMIN_EXPRESS_BASE_URL = 'http://files.opendatarchives.fr/professionnels.ign.fr/adminexpress/'
const ADMIN_EXPRESS_FILE = 'ADMIN-EXPRESS-COG_3-0__SHP__FRA_WM_2021-05-19.7z'

const OSM_COMMUNES_BASE_URL = 'https://osm13.openstreetmap.fr/~cquest/openfla/export/'
const OSM_COMMUNES_FILE = 'communes-20220101-shp.zip'
const OSM_COMMUNES_COM_FILE = 'communes-com-20220101-shp.zip'

const DATASOURCES_TYPE = process.env.DATASOURCES_TYPE || 'admin-express'

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
      $cherryPick: ['COMMUNE.*', 'ARRONDISSEMENT_MUNICIPAL.*']
    })

    extractStream.on('end', () => resolve())
    extractStream.on('error', reject)
  })
}

async function decompressOsmCommunesComFiles(osm_file, file_pattern) {
  await decompress(
    getSourceFilePath(osm_file),
    SOURCES_PATH,
    {
      filter(file) {
        return file.path.startsWith(file_pattern)
      },
      map(file) {
        file.path = 'osm-' + file_pattern + path.extname(file.path)
        return file
      }
    }
  )
}

async function main() {
  await mkdirp(SOURCES_PATH)
  if (DATASOURCES_TYPE == 'admin-express') {
    await downloadSourceFile(ADMIN_EXPRESS_BASE_URL + ADMIN_EXPRESS_FILE, ADMIN_EXPRESS_FILE)
    await decompressAdminExpressFiles()
  } else {
    await downloadSourceFile(OSM_COMMUNES_BASE_URL + OSM_COMMUNES_FILE, OSM_COMMUNES_FILE)
    await decompressOsmCommunesComFiles(OSM_COMMUNES_FILE, 'communes')
  }
  await downloadSourceFile(OSM_COMMUNES_BASE_URL + OSM_COMMUNES_COM_FILE, OSM_COMMUNES_COM_FILE)
  await decompressOsmCommunesComFiles(OSM_COMMUNES_COM_FILE, 'communes-com')
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
