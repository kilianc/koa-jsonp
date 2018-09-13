/*!
 * jsonp.js
 * Created by Kilian Ciuffolo on Dec 25, 2013
 * Copyright (c) 2013 Kilian Ciuffolo, me@nailik.org
 */

'use strict'

const JSONPStream = require('./jsonp-stream')

const SAFTY_CALLBACK_REG = /^[0-9a-zA-Z_]+$/
const TPL_OF_501 = `<html>
<head><title>501 Not Implemented</title></head>
<body bgcolor="white">
<center><h1>501 Not Implemented</h1></center>
</body>
</html>`

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

    if (!SAFTY_CALLBACK_REG.test(callback)) {
      this.response.status = 501
      this.body = TPL_OF_501
      this.type = 'html'
      return
    }

    // IE bowser would ignore content-type header in some case
    this.set('X-Content-Type-Options', 'nosniff')

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
