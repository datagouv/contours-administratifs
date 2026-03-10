#!/usr/bin/env node
const path = require('path')
const fs = require('fs')
const {pathExists} = require('fs-extra')
const gdal = require('gdal-async')
const {pointOnFeature} = require('@turf/point-on-feature')
const SOURCES_PATH = path.join(__dirname, 'sources')

function sleep(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms)
  })
}

const overpassUrl = 'https://overpass.kumi.systems/api/interpreter'
let geojsonCommunesMortes

let communesMortesPourLaFrance = `
insee,nom,id_osm
55039,Beaumont-en-Verdunois,4735299808
55050,Bezonvaux,1300835620
55139,Cumières-le-Mort-Homme,1708015706
55189,Fleury-devant-Douaumont,915457748
55239,Haumont-près-Samogneux,1300745684
55307,Louvemont-Côte-du-Poivre,1300745706
`.split('\n').map(line => line.split(',')).filter(line => line.length > 1)
const headers = communesMortesPourLaFrance.slice(0, 1)[0]

communesMortesPourLaFrance = communesMortesPourLaFrance.slice(1)
  .map(line => Object.fromEntries(headers.map((_, i) => [headers[i], line[i]])))
  .map(el => { // eslint-disable-next-line camelcase
    el.id_osm = Number.parseInt(el.id_osm, 10)
    return el
  })

async function geoJSONCommunesMortesPourLaFrance(communesMortesPourLaFrance) {
  const geojsonMemorial = {type: 'FeatureCollection', features: []}
  for (const commune of communesMortesPourLaFrance) {
    const fileName = `communes_mortes_${commune.insee}_pour_la_france.geojson`
    if (await pathExists(getSourceFilePath(fileName))) {
      console.log(`L'information est déjà présente pour la commune ${commune.nom} (${commune.insee}) et dont l'id OSM est ${commune.id_osm}`)
    } else {
      const query = `[out:json];node(id:${commune.id_osm});out;`
      const result = await queryOverpass(query)
      await sleep(6000)
      console.log('OSM id', commune.id_osm)
      if (result && result.elements) {
        console.log(result.elements[0])
      } else {
        console.log('return', result)
      }

      console.log('OSM commune info', commune)
      const {lon, lat} = result.elements[0]
      const memorialInfo = {
        type: 'Feature',
        properties: { // eslint-disable-next-line camelcase
          code_insee: commune.insee,
          nom: commune.nom,
          type: 'memorial'
        },
        geometry: {
          coordinates: [lon, lat],
          type: 'Point'
        }
      }
      await fs.promises.writeFile(getSourceFilePath(fileName), JSON.stringify(memorialInfo))
    }
  }

  const files = fs.globSync('sources/communes_mortes_*_pour_la_france.geojson')
  geojsonMemorial.features = files.map(file => JSON.parse(fs.readFileSync(file, 'utf8')))
  return geojsonMemorial
}

async function queryOverpass(query) {
  const body = new URLSearchParams({data: query})
  const reqOptions = {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded'
    },
    body
  }
  const resOverpass = await fetch(overpassUrl, reqOptions)
  let dataOverpass
  if (resOverpass.ok) {
    dataOverpass = await resOverpass.json()
  }

  return dataOverpass
}

function getSourceFilePath(fileName) {
  return path.join(SOURCES_PATH, fileName)
}

async function processMairies() {
  const filesList = await fs.promises.readdir(SOURCES_PATH)
  const gpkgs = filesList.filter(e => path.extname(e).toLowerCase() === '.gpkg')

  const dataset = gdal.open(getSourceFilePath(gpkgs[0]))
  /* eslint-disable camelcase */
  const chef_lieux = {
    chef_lieu_de_collectivite_territoriale: 'SELECT replace(nom_officiel, \'Collectivité de \', \'\') AS nom, \'mairie\' AS type, code_insee_de_la_commune_siege AS code_insee, geometrie FROM chef_lieu_de_collectivite_territoriale WHERE code_insee_de_la_collectivite_territoriale IN (977, 978)',
    chef_lieu_d_arrondissement_municipal: 'SELECT nom_officiel AS nom, \'mairie\' AS type, code_insee_de_l_arrondissement_municipal AS code_insee, geometrie FROM chef_lieu_d_arrondissement_municipal ORDER BY code_insee_de_l_arrondissement_municipal',
    chef_lieu_de_commune: 'SELECT nom_officiel AS nom, \'mairie\' AS type, code_insee_de_la_commune AS code_insee, geometrie FROM chef_lieu_de_commune'
  }
  /* eslint-enable camelcase */
  const allMairiesCentre = {type: 'FeatureCollection', features: []}
  for (const [key, value] of Object.entries(chef_lieux)) {
    gdal.vectorTranslate(`/vsimem/${key}.geojson`, dataset, ['-f', 'GeoJSON', '-dialect', 'SQLite', '-sql', value, '-lco', 'ENCODING=UTF-8', '-lco', 'RFC7946=YES'])
    const buffer = gdal.vsimem.release(`/vsimem/${key}.geojson`)
    allMairiesCentre.features = [...allMairiesCentre.features, ...(JSON.parse(buffer.toString()).features)]
  }

  dataset.close()

  const ds = gdal.open(getSourceFilePath('osm-communes-com-without-admin-express.shp'))
  gdal.vectorTranslate('/vsimem/osm-communes-com-without-admin-express.geojson', ds, ['-f', 'GeoJSON', '-sql', 'SELECT nom, \'centre\' AS type, code_insee FROM "osm-communes-com-without-admin-express"', '-lco', 'ENCODING=UTF-8', '-lco', 'RFC7946=YES'])
  const buffer = gdal.vsimem.release('/vsimem/osm-communes-com-without-admin-express.geojson')

  const geojsonCom = JSON.parse(buffer.toString())
  geojsonCom.features = geojsonCom.features.map(feature => {
    const pipGeometry = pointOnFeature(feature).geometry
    feature.geometry = pipGeometry
    return feature
  })
  allMairiesCentre.features = [...allMairiesCentre.features, ...geojsonCom.features]

  try {
    await fs.promises.stat(getSourceFilePath('communes_mortes_pour_la_france.geojson'))
    geojsonCommunesMortes = await fs.promises.readFile(getSourceFilePath('communes_mortes_pour_la_france.geojson'))
    geojsonCommunesMortes = JSON.parse(geojsonCommunesMortes)
  } catch {
    geojsonCommunesMortes = await geoJSONCommunesMortesPourLaFrance(communesMortesPourLaFrance)
    await fs.promises.writeFile(getSourceFilePath('communes_mortes_pour_la_france.geojson'), JSON.stringify(geojsonCommunesMortes))
  }

  allMairiesCentre.features = [...allMairiesCentre.features, ...geojsonCommunesMortes.features]
  allMairiesCentre.features = allMairiesCentre.features.map(feature => {
    return {
      type: 'Feature',
      properties: {
        commune: feature.properties.code_insee,
        nom: feature.properties.nom,
        type: feature.properties.type
      },
      geometry: feature.geometry
    }
  })
  allMairiesCentre.features = allMairiesCentre.features.toSorted((a, b) => a.properties.commune - b.properties.commune)

  await fs.promises.writeFile(path.join('dist', 'mairies.geojson'), JSON.stringify(allMairiesCentre))
}

module.exports = processMairies

