'use strict'

const contains = require('lodash.contains')
const mafmt = require('mafmt')

module.exports = function filter (multiaddrs) {
  if (!Array.isArray(multiaddrs)) {
    multiaddrs = [multiaddrs]
  }
  return multiaddrs.filter((ma) => {
    if (contains(ma.protoNames(), 'ipfs')) {
      ma = ma.decapsulate('ipfs')
    }
    return mafmt.TCP.matches(ma)
  })
}
