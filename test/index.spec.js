/* eslint-env mocha */
'use strict'

const expect = require('chai').expect
const net = require('net')
const multiaddr = require('multiaddr')
const Rx = require('rxjs/Rx')

const tcp = require('../src')
const tcpServer = tcp.tcpServer
const tcpSocket = tcp.tcpSocket

describe('listen', () => {
  it('simple', (done) => {
    const mh = multiaddr('/ip4/127.0.0.1/tcp/9090')

    const server = tcpServer(mh)
    const sub = server.connections
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
    const sub = server.connections
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
    const sub = server.connections
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
    const sub = server.connections
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
    const sub = server.connections
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
    const sub = server.connections.subscribe()

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
    const sub = server.connections.subscribe()

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
    const sub = server.connections.subscribe()

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
    const sub = server.connections
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
    const sub = server.connections
            .subscribe(() => {
              sub.unsubscribe()
            }, done)

    server.getAddrs()
      .toArray()
      .subscribe((multiaddrs) => {
        expect(multiaddrs.length).to.equal(1)
        expect(multiaddrs[0]).to.deep.equal(mh)
      }, done, done)
  })
})

describe('dial', () => {
  describe('dial on IPv4', () => {
    let server
    let sub
    const ma = multiaddr('/ip4/127.0.0.1/tcp/9090')

    beforeEach((done) => {
      const openObserver = new Rx.Subject()
      server = tcpServer({address: ma, openObserver})
      sub = server.connections
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
    const sub = server.connections
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
    const listener = tcpServer(ma).connections
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
    const listener = tcpServer(ma).connections
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

describe('filter addrs', () => {
  let tcp

  before(() => {
    tcp = tcpServer()
  })

  it('filter valid addrs for this transport', (done) => {
    const mh1 = multiaddr('/ip4/127.0.0.1/tcp/9090')
    const mh2 = multiaddr('/ip4/127.0.0.1/udp/9090')
    const mh3 = multiaddr('/ip4/127.0.0.1/tcp/9090/http')
    const mh4 = multiaddr('/ip4/127.0.0.1/tcp/9090/ipfs/Qmb6owHp6eaWArVbcJJbQSyifyJBttMMjYV76N2hMbf5Vw')

    const valid = tcp.filter([mh1, mh2, mh3, mh4])
    expect(valid.length).to.equal(2)
    expect(valid[0]).to.deep.equal(mh1)
    expect(valid[1]).to.deep.equal(mh4)
    done()
  })

  it('filter a single addr for this transport', (done) => {
    const mh1 = multiaddr('/ip4/127.0.0.1/tcp/9090')

    const valid = tcp.filter(mh1)
    expect(valid.length).to.equal(1)
    expect(valid[0]).to.deep.equal(mh1)
    done()
  })
})

describe('valid Connection', () => {
  let tcp

  beforeEach(() => {
    tcp = tcpServer()
  })

  const ma = multiaddr('/ip4/127.0.0.1/tcp/9090')

  it('get observed addrs', (done) => {
    var dialerObsAddrs
    var listenerObsAddrs

    const listener = tcp.createListener((conn) => {
      expect(conn).to.exist
      conn.getObservedAddrs((err, addrs) => {
        expect(err).to.not.exist
        dialerObsAddrs = addrs
        conn.end()
      })
    })

    listener.listen(ma, () => {
      const conn = tcp.dial(ma)

      conn.resume()
      conn.on('end', () => {
        conn.getObservedAddrs((err, addrs) => {
          expect(err).to.not.exist
          listenerObsAddrs = addrs
          conn.end()

          listener.close(() => {
            expect(listenerObsAddrs[0]).to.deep.equal(ma)
            expect(dialerObsAddrs.length).to.equal(1)
            done()
          })
        })
      })
    })
  })

  it('get Peer Info', (done) => {
    const listener = tcp.createListener((conn) => {
      expect(conn).to.exist
      conn.getPeerInfo((err, peerInfo) => {
        expect(err).to.exist
        expect(peerInfo).to.not.exist
        conn.end()
      })
    })

    listener.listen(ma, () => {
      const conn = tcp.dial(ma)

      conn.resume()
      conn.on('end', () => {
        conn.getPeerInfo((err, peerInfo) => {
          expect(err).to.exist
          expect(peerInfo).to.not.exist
          conn.end()

          listener.close(done)
        })
      })
    })
  })

  it('set Peer Info', (done) => {
    const listener = tcp.createListener((conn) => {
      expect(conn).to.exist
      conn.setPeerInfo('batatas')
      conn.getPeerInfo((err, peerInfo) => {
        expect(err).to.not.exist
        expect(peerInfo).to.equal('batatas')
        conn.end()
      })
    })

    listener.listen(ma, () => {
      const conn = tcp.dial(ma)

      conn.resume()
      conn.on('end', () => {
        conn.setPeerInfo('arroz')
        conn.getPeerInfo((err, peerInfo) => {
          expect(err).to.not.exist
          expect(peerInfo).to.equal('arroz')
          conn.end()

          listener.close(done)
        })
      })
    })
  })
})

describe.skip('turbolence', () => {
  it('dialer - emits error on the other end is terminated abruptly', (done) => {})
  it('listener - emits error on the other end is terminated abruptly', (done) => {})
})

describe.skip('Connection wrap', () => {
  let tcp
  let listener
  const ma = multiaddr('/ip4/127.0.0.1/tcp/9090')

  beforeEach((done) => {
    tcp = tcpServer()
    listener = tcp.createListener((conn) => {
      conn.pipe(conn)
    })
    listener.on('listening', done)
    listener.listen(ma)
  })

  afterEach((done) => {
    listener.close(done)
  })

  it('simple wrap', (done) => {
    const conn = tcp.dial(ma)
    conn.setPeerInfo('peerInfo')
    const connWrap = new Connection(conn)
    connWrap.write('hey')
    connWrap.end()
    connWrap.on('data', (chunk) => {
      expect(chunk.toString()).to.equal('hey')
    })
    connWrap.on('end', () => {
      connWrap.getPeerInfo((err, peerInfo) => {
        expect(err).to.not.exist
        expect(peerInfo).to.equal('peerInfo')
        done()
      })
    })
  })

  it('buffer wrap', (done) => {
    const conn = tcp.dial(ma)
    const connWrap = new Connection()
    connWrap.write('hey')
    connWrap.end()
    connWrap.on('data', (chunk) => {
      expect(chunk.toString()).to.equal('hey')
    })
    connWrap.on('end', done)

    connWrap.setInnerConn(conn)
  })

  it('overload wrap', (done) => {
    const conn = tcp.dial(ma)
    const connWrap = new Connection(conn)
    connWrap.getPeerInfo = (callback) => {
      callback(null, 'none')
    }
    conn.getPeerInfo((err, peerInfo) => {
      expect(err).to.exist
    })
    connWrap.getPeerInfo((err, peerInfo) => {
      expect(err).to.not.exist
      expect(peerInfo).to.equal('none')
    })
    connWrap.write('hey')
    connWrap.end()
    connWrap.on('data', (chunk) => {
      expect(chunk.toString()).to.equal('hey')
    })
    connWrap.on('end', done)
  })

  it('matryoshka wrap', (done) => {
    const conn = tcp.dial(ma)
    const connWrap1 = new Connection(conn)
    const connWrap2 = new Connection(connWrap1)
    const connWrap3 = new Connection(connWrap2)

    conn.getPeerInfo = (callback) => {
      callback(null, 'inner doll')
    }

    connWrap3.write('hey')
    connWrap3.end()
    connWrap3.on('data', (chunk) => {
      expect(chunk.toString()).to.equal('hey')
    })
    connWrap3.on('end', () => {
      connWrap3.getPeerInfo((err, peerInfo) => {
        expect(err).to.not.exist
        expect(peerInfo).to.equal('inner doll')
        done()
      })
    })
  })
})
