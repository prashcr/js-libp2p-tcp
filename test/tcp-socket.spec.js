/* eslint-env mocha */
'use strict'

const expect = require('chai').expect
const multiaddr = require('multiaddr')
const Rx = require('rxjs/Rx')

const tcp = require('../src')
const tcpServer = tcp.tcpServer
const tcpSocket = tcp.tcpSocket

describe('tcpSocket', () => {
  describe('dial on IPv4', () => {
    let server
    let sub
    const ma = multiaddr('/ip4/127.0.0.1/tcp/9090')

    beforeEach((done) => {
      const openObserver = new Rx.Subject()
      server = tcpServer({address: ma, openObserver})
      sub = server
        .subscribe((socket) => {
          socket.subscribe((msg) => {
            socket.next(msg.toString() + '!')
          })
        })
      openObserver.subscribe(() => done())
    })

    afterEach(() => {
      sub.unsubscribe()
    })

    it('dial on IPv4', (done) => {
      const subject = tcpSocket(ma)
      subject.next('hey')
      subject.subscribe((msg) => {
        expect(msg).to.be.eql(Buffer('hey!'))
        subject.unsubscribe()
        done()
      })
    })

    it('dial on IPv4 with IPFS Id', (done) => {
      const ma = multiaddr('/ip4/127.0.0.1/tcp/9090/ipfs/Qmb6owHp6eaWArVbcJJbQSyifyJBttMMjYV76N2hMbf5Vw')
      const subject = tcpSocket(ma)
      subject.next('hey')
      subject.subscribe((msg) => {
        expect(msg).to.be.eql(Buffer('hey!'))
        subject.unsubscribe()
        done()
      })
    })
  })

  it('dial to non existent listener', (done) => {
    const subject = tcpSocket(multiaddr('/ip4/127.0.0.1/tcp/8989'))
    subject.subscribe(
      null,
      (err) => {
        expect(err).to.exist
        subject.unsubscribe()
        done()
      }
    )
  })

  it('dial on IPv6', (done) => {
    const ma = multiaddr('/ip6/::/tcp/9066')

    const server = tcpServer(ma)
    const sub = server
      .subscribe((socket) => {
        socket.subscribe((msg) => {
          socket.next(msg.toString() + '?')
        })
      })

    const subject = tcpSocket(ma)
    subject.next('hey')
    subject.subscribe((msg) => {
      expect(msg).to.be.eql(Buffer('hey?'))
      sub.unsubscribe()
      subject.unsubscribe()
      done()
    })
  })

  it('dial and destroy on listener', (done) => {
    let count = 0
    const closed = () => ++count === 2 ? finish() : null

    const ma = multiaddr('/ip6/::/tcp/9067')
    const listener = tcpServer(ma)
            .subscribe((socket) => {
              socket.subscribe(null, null, closed)
              socket.unsubscribe()
            })

    const dialer = tcpSocket(ma)

    dialer.subscribe(null, null, closed)

    function finish () {
      listener.unsubscribe()
      done()
    }
  })

  it('dial and destroy on dialer', (done) => {
    let count = 0
    const closed = () => ++count === 2 ? finish() : null

    const ma = multiaddr('/ip6/::/tcp/9067')
    const listener = tcpServer(ma)
            .subscribe((socket) => {
              socket.subscribe(null, null, closed)
            })

    const dialer = tcpSocket(ma)

    dialer.subscribe(null, null, closed)
    setTimeout(() => {
      dialer.unsubscribe()
    }, 10)

    function finish () {
      listener.unsubscribe()
      done()
    }
  })
})
