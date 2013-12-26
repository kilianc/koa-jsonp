/**
 * jsonp-stream.js
 * Created by Kilian Ciuffolo on Dec 25, 2013
 * Copyright (c) 2013 Kilian Ciuffolo, me@nailik.org
 */

var Transform = require('stream').Transform

var JSONPStream = module.exports = function JSONPStream(options) {
  if (!(this instanceof JSONPStream)) {
    return new JSONPStream(options)
  }

  options = options || {}
  this.startChunk = options.startChunk || ''
  this.endChunk = options.endChunk || ''

  Transform.call(this, { objectMode: true })
}

JSONPStream.prototype.__proto__ = Transform.prototype

// Flags
JSONPStream.prototype.destroyed = false
JSONPStream.prototype.started = false

JSONPStream.prototype._transform = function (data, encoding, callback) {
  if (this.destroyed) return

  if (!this.started) {
    this.started = true
    this.push(this.startChunk)
  }

  /* TODO */
  // JSON parse vs eval fix. https://github.com/rack/rack-contrib/pull/37
  // data = data.replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029')
  this.push(data)

  process.nextTick(callback)
}

JSONPStream.prototype._flush = function (callback) {
  if (this.destroyed) return

  if (!this.started) {
    this.push(this.start)
  }

  this.push(this.endChunk)
  this.push(null)

  process.nextTick(callback)
}

JSONPStream.prototype.destroy = function () {
  if (!this.destroyed) {
    this.emit('close')
    this.destroyed = true
  }
}