const {promisify} = require('util')
const mapshaper = require('mapshaper')

const applyCommands = promisify(mapshaper.applyCommands)

async function readShpFeaturesAndSimplify(shpFiles, interval) {
  const inputFiles = shpFiles.reduce((acc, f) => {
    acc[f.path] = f.data
    return acc
  }, {})
  const input = Object.keys(inputFiles).find(f => f.toLowerCase().endsWith('shp'))
  const simplifyOptions = `keep-shapes interval=${interval}`
  const command = `-i ${input} -simplify ${simplifyOptions} -o output.geojson format=geojson`
  const outputFiles = await applyCommands(command, inputFiles)
  return JSON.parse(outputFiles['output.geojson']).features
}

module.exports = readShpFeaturesAndSimplify
