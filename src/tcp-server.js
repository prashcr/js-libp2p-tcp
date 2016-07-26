'use strict'

const net = require('net')
const Rx = require('rxjs/Rx')
Rx.node = require('rxjs.node')
const multiaddr = require('multiaddr')
const Address6 = require('ip-address').Address6
const contains = require('lodash.contains')
const os = require('os')

const IPFS_CODE = 421

module.exports = function tcpServer (opts) {
  let address
  if (opts.constructor.name === 'Multiaddr') {
    address = opts
    opts = {}
  } else {
    address = opts.address
  }

  const rawAddr = new Rx.Subject()

  const connections = Rx.Observable.create((observer) => {
    let server = net.createServer((socket) => {
      observer.next(new Rx.node.StreamSubject({
        dataEvent: 'data',
        endEvent: 'close',
        createStream () {
          return socket
        }
      }))
    })

    server.on('error', (err) => observer.error(err))
    server.on('close', () => {
      observer.complete()
    })

    server.listen(toListenAddr(address), () => {
      if (opts.openObserver) {
        opts.openObserver.next(server.address())
      }
      rawAddr.next(server.address())
      rawAddr.complete()
    })

    return () => {
      server.close()
      server = null
    }
  })

  return {
    connections,
    getObservedAddrs () {
      return rawAddr.map(getMultiaddr)
    },
    getAddrs () {
      return rawAddr
        .mergeMap((addr) => getAddrs(address, addr))
    }
  }
}

function toListenAddr (ma) {
  if (contains(ma.protoNames(), 'ipfs')) {
    return ma.decapsulate('ipfs').toOptions()
  }

  return ma.toOptions()
}

function getMultiaddr (remote) {
  const port = remote.port
  const family = remote.family
  const address = remote.address

  if (family === 'IPv6') {
    const addr = new Address6(address)

    if (addr.v4) {
      const ip4 = addr.to4().correctForm()
      return multiaddr(`/ip4/${ip4}/tcp/${port}`)
    }

    return multiaddr(`/ip6/${address}/tcp/${port}`)
  }

  return multiaddr(`/ip4/${address}/tcp/${port}`)
}

function getAddrs (listening, address) {
  let ipfsId

  const ip4 = Rx.Observable
          .of(listening)
          .map((m) => {
            if (contains(m.protoNames(), 'ipfs')) {
              ipfsId = getId(m)
              return m.decapsulate('ipfs')
            }
            return m
          })
          .map((m) => {
            // Because TCP will only return the IPv6 version
            // we need to capture from the passed multiaddr
            if (m.toString().indexOf('ip4') !== -1) {
              return m
                .decapsulate('tcp')
                .encapsulate(`/tcp/${address.port}`)
            }
            return m
          })
          .mergeMap((m) => {
            if (m.toString().indexOf('0.0.0.0') !== -1) {
              const netInterfaces = os.networkInterfaces()
              return Rx.Observable
                .from(Object.keys(netInterfaces))
                .mergeMap((niKey) => netInterfaces[niKey])
                .filter((ni) => ni.family === 'IPv4')
                .map((ni) => multiaddr(
                  m.toString().replace('0.0.0.0', ni.address)
                ))
            }

            return Rx.Observable.of(m)
          })

  const ip6 = Rx.Observable
          .of(address)
          .filter((addr) => addr.family === 'IPv6')
          .map((addr) => {
            return multiaddr(`/ip6/${addr.address}/tcp/${addr.port}`)
          })

  return ip4.concat(ip6)
    .map((addr) => {
      if (ipfsId) {
        return addr.encapsulate(`/ipfs/${ipfsId}`)
      }
      return addr
    })
}

function getId (addr) {
  return addr.stringTuples().filter((tuple) => {
    return tuple[0] === IPFS_CODE
  })[0][1]
}
