const communes = require('@etalab/decoupage-administratif/data/communes.json')
const departements = require('@etalab/decoupage-administratif/data/departements.json')
const regions = require('@etalab/decoupage-administratif/data/regions.json')
const epci = require('@etalab/decoupage-administratif/data/epci.json')
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

const epciIndexes = {
  commune: {},
  code: keyBy(epci, 'code')
}

epci.forEach(e => {
  e.membres.forEach(commune => {
    epciIndexes.commune[commune.code] = e
  })
})

module.exports = {communesIndexes, departementsIndexes, regionsIndexes, epciIndexes}
