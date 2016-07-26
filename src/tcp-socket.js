'use strict'

const SocketSubject = require('rxjs.node').SocketSubject

module.exports = function tcpSocket (ma) {
  return new SocketSubject(ma.toOptions())
}
