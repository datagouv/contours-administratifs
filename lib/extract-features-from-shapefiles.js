const {promisify} = require('util')
const Readable = require('stream').Readable
const getStream = require('get-stream')
const JSONStream = require('JSONStream')
const mapshaper = require('mapshaper')

const applyCommands = promisify(mapshaper.applyCommands)

async function extractFeaturesFromShapefiles(shapefiles, interval) {
  const inputFiles = shapefiles.reduce((acc, f) => {
    acc[f.name] = f.data
    return acc
  }, {})

  const inputs = shapefiles
    .filter(f => f.name.toLowerCase().endsWith('.shp'))
    .map(f => f.name)

  const layers = shapefiles
    .filter(f => f.name.toLowerCase().endsWith('.shp'))
    .map(f => f.name.slice(0, f.name.length - 4))

  const simplifyOptions = `keep-shapes interval=${interval}`
  const mergeLayersOptions = `force target=${layers.join(',')}`
  const command = `-i combine-files files=${inputs.join(',')} -merge-layers ${mergeLayersOptions} -simplify ${simplifyOptions} -o output.geojson format=geojson`

  const outputFiles = await applyCommands(command, inputFiles)
  //return JSON.parse(outputFiles['output.geojson']).features

  var s = new Readable()
  s.push(outputFiles['output.geojson'])    // the string you want
  s.push(null)
  return getStream.array(
    s.pipe(JSONStream.parse('features.*'))
  )
}

module.exports = extractFeaturesFromShapefiles
