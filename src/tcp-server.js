'use strict'

const net = require('net')
const Rx = require('rxjs/Rx')
const contains = require('lodash.contains')

module.exports = function createTcpServer (ma) {
  const connections = Rx.Observable.create((observer) => {
    let server = net.createServer((socket) => {
      observer.next(Rx.Observable.create((socketOb) => {
        socket.on('error', (err) => {
          socketOb.error(err)
        })

        socket.on('close', () => {
          socketOb.complete()
        })

        socket.on('data', (chunk) => {
          socketOb.next(chunk)
        })

        return () => {
          socket.end()
          socket = null
        }
      }))
    })

    let listeningMultiaddr = ma
    if (contains(ma.protoNames(), 'ipfs')) {
      listeningMultiaddr = ma.decapsulate('ipfs')
    }

    server.listen(listeningMultiaddr.toOptions(), () => {
      console.log('listening %s', listeningMultiaddr.toString())
    })

    server.on('error', (err) => {
      observer.error(err)
    })

    server.on('close', () => {
      observer.complete()
    })

    return () => {
      server.close()
      server = null
    }
  })

  return {
    connections
  }
}
