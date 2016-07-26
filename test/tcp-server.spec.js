/* eslint-env mocha */
'use strict'

const expect = require('chai').expect
const net = require('net')
const multiaddr = require('multiaddr')

const tcp = require('../src')
const tcpServer = tcp.tcpServer

describe('tcpServer', () => {
  it('simple', (done) => {
    const mh = multiaddr('/ip4/127.0.0.1/tcp/9090')

    const server = tcpServer(mh)
    const sub = server
            .subscribe((conn) => {
              conn
                .map((x) => x + '?')
                .map((x) => x + '!')
                .map((x) => x + '!')
                .subscribe((x) => {
                  expect(x).to.equal('pong?!!')
                  sub.unsubscribe()
                }, done, done)
            }, done)

    const socket = net.connect('9090')
    socket.write(new Buffer('pong'))
    socket.end()
  })

  it('listen on addr with /ipfs/QmHASH', (done) => {
    const mh = multiaddr('/ip4/127.0.0.1/tcp/9090/ipfs/Qmb6owHp6eaWArVbcJJbQSyifyJBttMMjYV76N2hMbf5Vw')

    const server = tcpServer(mh)
    const sub = server
            .subscribe((conn) => {
              conn
                .map((x) => x + '?')
                .subscribe((x) => {
                  expect(x).to.equal('pong?')
                  sub.unsubscribe()
                }, done, done)
            }, done)

    const socket = net.connect('9090')
    socket.write(new Buffer('pong'))
    socket.end()
  })

  it('listen on port 0', (done) => {
    const mh = multiaddr('/ip4/127.0.0.1/tcp/0')
    const server = tcpServer(mh)
    const sub = server
            .subscribe((conn) => {
              conn
                .map((x) => x + '?')
                .subscribe((x) => {
                  expect(x).to.equal('pong?')
                  sub.unsubscribe()
                }, done, done)
            }, done)

    server.getObservedAddrs()
      .map((addr) => addr.toOptions())
      .map((addr) => net.connect(addr))
      .subscribe((socket) => {
        socket.write(new Buffer('pong'))
        socket.end()
      })
  })

  it('listen on IPv6 addr', (done) => {
    const mh = multiaddr('/ip6/::/tcp/9090')
    const server = tcpServer(mh)
    const sub = server
            .subscribe((conn) => {
              conn
                .map((x) => x + '?')
                .subscribe((x) => {
                  expect(x).to.equal('pong?')
                  sub.unsubscribe()
                }, done, done)
            }, done)

    const socket = net.connect('9090')
    socket.write(new Buffer('pong'))
    socket.end()
  })

  it('listen on any Interface', (done) => {
    const mh = multiaddr('/ip4/0.0.0.0/tcp/9090')
    const server = tcpServer(mh)
    const sub = server
            .subscribe((conn) => {
              conn
                .map((x) => x + '?')
                .subscribe((x) => {
                  expect(x).to.equal('pong?')
                  sub.unsubscribe()
                }, done, done)
            }, done)

    const socket = net.connect('9090')
    socket.write(new Buffer('pong'))
    socket.end()
  })

  it('getAddrs', (done) => {
    const mh = multiaddr('/ip4/127.0.0.1/tcp/9090')
    const server = tcpServer(mh)
    const sub = server.subscribe()

    server.getAddrs()
      .toArray()
      .subscribe((multiaddrs) => {
        expect(multiaddrs.length).to.equal(1)
        expect(multiaddrs[0]).to.deep.equal(mh)
        sub.unsubscribe()
      }, done, done)
  })

  it('getAddrs on port 0 listen', (done) => {
    const mh = multiaddr('/ip4/127.0.0.1/tcp/0')
    const server = tcpServer(mh)
    const sub = server.subscribe()

    server.getAddrs()
      .toArray()
      .subscribe((multiaddrs) => {
        expect(multiaddrs.length).to.equal(1)
        sub.unsubscribe()
      }, done, done)
  })

  it('getAddrs from listening on 0.0.0.0', (done) => {
    const mh = multiaddr('/ip4/0.0.0.0/tcp/9090')
    const server = tcpServer(mh)
    const sub = server.subscribe()

    server.getAddrs()
      .toArray()
      .subscribe((multiaddrs) => {
        expect(multiaddrs.length > 0).to.equal(true)
        expect(multiaddrs[0].toString().indexOf('0.0.0.0')).to.equal(-1)
        sub.unsubscribe()
      }, done, done)
  })

  it('getAddrs from listening on 0.0.0.0 and port 0', (done) => {
    const mh = multiaddr('/ip4/0.0.0.0/tcp/0')
    const server = tcpServer(mh)
    const sub = server
            .subscribe(() => {
              sub.unsubscribe()
            }, done)

    server.getAddrs()
      .toArray()
      .subscribe((multiaddrs) => {
        expect(multiaddrs.length > 0).to.equal(true)
        expect(multiaddrs[0].toString().indexOf('0.0.0.0')).to.equal(-1)
      }, done, done)
  })

  it('getAddrs preserves IPFS Id', (done) => {
    const mh = multiaddr('/ip4/127.0.0.1/tcp/9091/ipfs/Qmb6owHp6eaWArVbcJJbQSyifyJBttMMjYV76N2hMbf5Vw')
    const server = tcpServer(mh)
    const sub = server.subscribe()

    server.getAddrs()
      .toArray()
      .subscribe((multiaddrs) => {
        expect(multiaddrs.length).to.equal(1)
        expect(multiaddrs[0]).to.deep.equal(mh)
        sub.unsubscribe()
      }, done, done)
  })

  describe('addresses', () => {
    const ma = multiaddr('/ip4/127.0.0.1/tcp/9090')

    it('get observed addrs', (done) => {
      const server = tcpServer(ma)
      const sub = server.subscribe()

      server.getObservedAddrs()
        .toArray()
        .subscribe((multiaddrs) => {
          expect(multiaddrs.length).to.equal(1)
          expect(multiaddrs[0]).to.deep.equal(ma)
          sub.unsubscribe()
          done()
        }, done)
    })
  })
})
