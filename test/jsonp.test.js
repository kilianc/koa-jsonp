/**
 * jsonp.test.js
 * Created by Kilian Ciuffolo on Dec 25, 2013
 * Copyright (c) 2013 Kilian Ciuffolo, me@nailik.org
 */

var assert = require('chai').assert
  , get = require('request').defaults({ json: true }).get
  , post = require('request').defaults({ json: true }).post
  , JSONStream = require('JSONStream')
  , stringify = require('json-array-stream')
  , app = require('koa')()
  , mount = require('koa-mount')
  , jsonp = require('../')


describe('JSONTransport()', function () {
  before(function (done) {
    app.use(jsonp({ callbackName: 'my_cb_name' }))
    app.use(mount('/buffered', function *() {
      this.body = { foo: 'bar' }
    }))
    app.use(mount('/streaming', function *() {
      this.body = get('http://isaacs.couchone.com/registry/_all_docs?limit=5')
        .pipe(JSONStream.parse('rows.*.value'))
        .pipe(stringify())
    }))
    app.listen(3000, done)
  })

  it('shouldn\'t do anything if callback is not provided / GET', function (done) {
    get('http://localhost:3000/buffered', function (err, response, body) {
      assert.equal(body.foo, 'bar')
      assert.equal(response.headers['content-type'], 'application/json')
      done(err)
    })
  })

  it('shouldn\'t do anything if callback is not provided / POST', function (done) {
    post('http://localhost:3000/buffered', function (err, response, body) {
      assert.equal(body.foo, 'bar')
      assert.equal(response.headers['content-type'], 'application/json')
      done(err)
    })
  })

  it('should switch to JSONP mode if callback is provided', function (done) {
    get('http://localhost:3000/buffered?my_cb_name=cb', function (err, response, body) {
      assert.equal(body, ';cb({\n  "foo": "bar"\n});')
      assert.equal(response.headers['content-type'], 'text/javascript')
      done(err)
    })
  })

  it('should switch to JSONP+iframe mode if callback is provided / POST', function (done) {
    post('http://localhost:3000/buffered?my_cb_name=cb', function (err, response, body) {
      var data = JSON.parse(body.match(/cb\(([^)]+)\)/m)[1])
      assert.equal(data.foo, 'bar')
      assert.match(body, /<!doctype html>/)
      assert.equal(response.headers['content-type'], 'text/html; charset=utf-8')
      done(err)
    })
  })

  it('should switch to JSONP mode if callback is provided / Stream', function (done) {
    get('http://localhost:3000/streaming?my_cb_name=cb', function (err, response, body) {
      body = JSON.parse(body.replace(';cb(', '').replace(');', ''))
      assert.lengthOf(body, 5)
      done(err)
    }).once('data', function (chunk) {
      assert.equal(chunk.toString('utf8'), ';cb(')
    })
  })

  it('should switch to JSONP+iframe mode if callback is provided / POST / Stream', function (done) {
    post('http://localhost:3000/streaming?my_cb_name=cb', function (err, response, body) {
      var data = JSON.parse(body.match(/cb\(([^)]+)\)/m)[1])
      assert.lengthOf(data, 5)
      assert.match(body, /<!doctype html>/)
      assert.equal(response.headers['content-type'], 'text/html; charset=utf-8')
      done(err)
    })
  })
})