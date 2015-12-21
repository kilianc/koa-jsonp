/**
 * jsonp.js
 * Created by Kilian Ciuffolo on Dec 25, 2013
 * Copyright (c) 2013 Kilian Ciuffolo, me@nailik.org
 */

var JSONPStream = require('./jsonp-stream')

module.exports = function jsonp(options) {
  options = options || {}
  var domain = options.domain || '.default.lan'
  var callbackName = options.callbackName || 'callback'

  var iframeHtmlTemplate = [
    '<!doctype html><html><head><meta http-equiv="Content-Type" content="text/html charset=utf-8"/><script type="text/javascript">document.domain = "' + domain + '";parent.',
    '(',
    ');</script></head><body></body></html>'
  ]

  return async function (ctx, next) {
    await next()

    var startChunk, endChunk
    var callback = ctx.query[callbackName]

    if (!callback) return
    if (ctx.body == null) return

    if (ctx.method === 'POST') {
      ctx.type = 'html'
      startChunk = iframeHtmlTemplate[0] + callback + iframeHtmlTemplate[1]
      endChunk = iframeHtmlTemplate[2]
    } else {
      ctx.type = 'text/javascript'
      startChunk = ';' + callback + '('
      endChunk = ');'
    }

    // handle streams
    if ('function' === typeof ctx.body.pipe) {
      ctx.body = ctx.body.pipe(JSONPStream({
        startChunk: startChunk,
        endChunk: endChunk
      }))
    } else {
      ctx.body =  startChunk + JSON.stringify(ctx.body, null, ctx.app.jsonSpaces) + endChunk

      // JSON parse vs eval fix. https://github.com/rack/rack-contrib/pull/37
      ctx.body = ctx.body.replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029')
    }
  }
}
