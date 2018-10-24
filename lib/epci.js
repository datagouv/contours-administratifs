const {keyBy} = require('lodash')
const epci = require('@etalab/epci/data/epci.json')

const epciIndexes = {
  commune: {},
  code: keyBy(epci, 'code')
}

epci.forEach(e => {
  e.membres.forEach(commune => {
    epciIndexes.commune[commune.code] = e
  })
})

module.exports = {epciIndexes}
