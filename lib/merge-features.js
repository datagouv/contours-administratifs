const {promisify} = require('util')
const mapshaper = require('mapshaper')

const applyCommands = promisify(mapshaper.applyCommands)

async function mergeFeatures(features, mergeField) {
  const filteredFeatures = features.filter(f => f.properties[mergeField])
  const inputFiles = {
    'input.geojson': JSON.stringify({
      type: 'FeatureCollection',
      features: filteredFeatures
    })
  }

  const command = `-i input.geojson -dissolve ${mergeField} -o output.geojson format=geojson`
  const outputFiles = await applyCommands(command, inputFiles)
  return JSON.parse(outputFiles['output.geojson']).features
}

module.exports = mergeFeatures
