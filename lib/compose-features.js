const {keyBy} = require('lodash')
const {feature} = require('@turf/turf')
const mergeFeatures = require('./merge-features')

async function composeFeatures(items, geometriesIndex) {
  const unmergedFeatures = []
  const indexedItems = keyBy(items, 'id')

  for (const item of items) {
    for (const member of item.members) {
      unmergedFeatures.push(feature(
        geometriesIndex[member],
        {id: item.id}
      ))
    }
  }

  const mergedFeatures = await mergeFeatures(unmergedFeatures, 'id')

  return mergedFeatures.map(
    ({geometry, properties}) => feature(geometry, indexedItems[properties.id].properties)
  )
}

module.exports = composeFeatures
