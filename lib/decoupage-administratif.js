const communes = require('@etalab/decoupage-administratif/data/communes.json')
  .filter(c => ['arrondissement-municipal', 'commune-actuelle'].includes(c.type))

const communesAssocieesDeleguees = require('@etalab/decoupage-administratif/data/communes.json')
  .filter(c => ['commune-associee', 'commune-deleguee'].includes(c.type))

const departements = require('@etalab/decoupage-administratif/data/departements.json')
const regions = require('@etalab/decoupage-administratif/data/regions.json')
const epci = require('@etalab/decoupage-administratif/data/epci.json')
const ept = require('@etalab/decoupage-administratif/data/ept.json')
const {groupBy, keyBy} = require('lodash')

const communesIndexes = {
  code: keyBy(communes, 'code'),
  departement: groupBy(communes, 'departement'),
  region: groupBy(communes, 'region')
}

const communesAssocieesDelegueesIndexes = {
  code: keyBy(communesAssocieesDeleguees, 'code'),
  departement: groupBy(communesAssocieesDeleguees, 'departement'),
  region: groupBy(communesAssocieesDeleguees, 'region')
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

const eptIndexes = {
  commune: {},
  code: keyBy(ept, 'code')
}

epci.forEach(e => {
  e.membres.forEach(commune => {
    epciIndexes.commune[commune.code] = e
  })
})

ept.forEach(e => {
  e.membres.forEach(commune => {
    eptIndexes.commune[commune.code] = e
  })
})

module.exports = {
  communes,
  communesAssocieesDeleguees,
  departements,
  regions,
  epci,
  ept,
  communesIndexes,
  communesAssocieesDelegueesIndexes,
  departementsIndexes,
  regionsIndexes,
  epciIndexes,
  eptIndexes
}
