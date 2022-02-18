const {promisify} = require('util')
const mapshaper = require('mapshaper')

const applyCommands = promisify(mapshaper.applyCommands)

async function extractFeaturesFromShapefiles(shapefiles, interval) {
  const inputFiles = shapefiles.reduce((acc, f) => {
    acc[f.name] = f.data
    return acc
  }, {})

  const layers = shapefiles
    .filter(f => f.name.toLowerCase().endsWith('.shp'))
    .map(f => f.name.slice(0, f.name.length - 4))
  const input = Object.keys(inputFiles).find(f => f.toLowerCase().endsWith('shp'))

  const simplifyOptions = `keep-shapes interval=${interval}`
  const mergeLayersOptions = `force target=${layers.join(',')}`
  const command = `-i ${input} -simplify ${simplifyOptions} -merge-layers ${mergeLayersOptions} -o output.geojson format=geojson`
  const outputFiles = await applyCommands(command, inputFiles)
  return JSON.parse(outputFiles['output.geojson']).features
}

module.exports = extractFeaturesFromShapefiles
