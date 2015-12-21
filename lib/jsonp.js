/*!
 * jsonp.js
 * Created by Kilian Ciuffolo on Dec 25, 2013
 * Copyright (c) 2013 Kilian Ciuffolo, me@nailik.org
 */

'use strict'

const JSONPStream = require('./jsonp-stream')

module.exports = function jsonp (options) {
  options = options || {}

  let domain = options.domain || '.default.lan'
  let callbackName = options.callbackName || 'callback'
  let iframeHtmlTemplate = [
    '<!doctype html><html><head><meta http-equiv="Content-Type" content="text/html charset=utf-8"/><script type="text/javascript">document.domain = "' + domain + '";parent.',
    '(',
    ');</script></head><body></body></html>'
  ]

  return function * _jsonp (next) {
    yield* next

    let startChunk, endChunk
    let callback = this.query[callbackName]

    if (!callback) return
    if (this.body == null) return

    if (this.method === 'POST') {
      this.type = 'html'
      startChunk = iframeHtmlTemplate[0] + callback + iframeHtmlTemplate[1]
      endChunk = iframeHtmlTemplate[2]
    } else {
      this.type = 'text/javascript'
      startChunk = ';' + callback + '('
      endChunk = ');'
    }

    // handle streams
    if (typeof this.body.pipe === 'function') {
      this.body = this.body.pipe(new JSONPStream({
        startChunk: startChunk,
        endChunk: endChunk
      }))
    } else {
      this.body = startChunk + JSON.stringify(this.body, null, this.app.jsonSpaces) + endChunk

      // JSON parse vs eval fix. https://github.com/rack/rack-contrib/pull/37
      this.body = this.body
        .replace(/\u2028/g, '\\u2028')
        .replace(/\u2029/g, '\\u2029')
    }
  }
}
