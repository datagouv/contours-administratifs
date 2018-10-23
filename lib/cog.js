const communes = require('@etalab/cog/data/communes.json')
const departements = require('@etalab/cog/data/departements.json')
const regions = require('@etalab/cog/data/regions.json')
const {groupBy, keyBy} = require('lodash')

const communesIndexes = {
  code: keyBy(communes, 'code'),
  departement: groupBy(communes, 'departement'),
  region: groupBy(communes, 'region')
}

const departementsIndexes = {
  code: keyBy(departements, 'code')
}

const regionsIndexes = {
  code: keyBy(regions, 'code')
}

module.exports = {communesIndexes, departementsIndexes, regionsIndexes}
