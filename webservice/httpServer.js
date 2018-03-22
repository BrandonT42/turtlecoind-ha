'use strict'

const compression = require('compression')
const express = require('express')
const helmet = require('helmet')
const inherits = require('util').inherits
const EventEmitter = require('events').EventEmitter
const util = require('util')
const bodyparser = require('body-parser')

function Self (opts) {
  opts = opts || {}
  if (!(this instanceof Self)) return new Self(opts)
  this.node = opts.node || module.parent.exports
  this.bindPort = opts.bindPort || 11899
  this.bindIp = opts.bindIp || '0.0.0.0'
  this.app = express()
  this.app.use(bodyparser.json())
  this.app.use((req, res, next) => {
    res.header('X-Requested-With', '*')
    res.header('Access-Control-Allow-Origin', '*')
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
    res.header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
    next()
  })
  this.app.use(helmet())
  this.app.use(compression())
  this.app.get('/health', (request, response) => {
    this.node._getHeight().then(() => {
      if (this.node === null || !this.node.synced) return response.sendStatus(500)
      return response.sendStatus(200)
    }).catch(() => {
      return response.sendStatus(500)
    })
  })
}
inherits(Self, EventEmitter)

Self.prototype.start = function () {
  this.app.listen(this.bindPort, this.bindIp, () => {
    this.emit('ready', this.bindIp, this.bindPort)
  })
}

Self.prototype.stop = function () {
  this.app.stop()
  this.emit('stop')
}

module.exports = Self
