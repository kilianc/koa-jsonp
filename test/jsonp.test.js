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


describe('jsonp()', function () {
  before(function (done) {
    app.use(jsonp({ callbackName: 'my_cb_name' }))
    app.use(mount('/buffered', function *() {
      this.body = { foo: 'bar' }
    }))
    app.use(mount('/null', function *() {
      this.body = null
    }))
    app.use(mount('/streaming', function *() {
      this.body = get('http://isaacs.couchone.com/registry/_all_docs?limit=5')
        .pipe(JSONStream.parse('rows.*.value'))
        .pipe(stringify())
    }))
    app.listen(3000, done)
  })

  it('shouldn\'t do anything if callback is not provided / GET', function (done) {
    get('http://localhost:3000/buffered', function (err, res, body) {
      assert.equal(body.foo, 'bar')
      assert.equal(res.headers['content-type'], 'application/json; charset=utf-8')
      done(err)
    })
  })

  it('shouldn\'t do anything if callback is not provided / GET / Stream', function (done) {
    get('http://localhost:3000/streaming', function (err, res, body) {
      assert.lengthOf(body, 5)
      assert.equal(res.headers['content-type'], 'application/octet-stream')
      done(err)
    })
  })

  it('shouldn\'t do anything if callback is not provided / POST', function (done) {
    post('http://localhost:3000/buffered', function (err, res, body) {
      assert.equal(body.foo, 'bar')
      assert.equal(res.headers['content-type'], 'application/json; charset=utf-8')
      done(err)
    })
  })

  it('shouldn\'t do anything if this.body is undefined', function (done) {
    get('http://localhost:3000/404?my_cb_name=cb', function (err, res, body) {
      assert.equal(body, 'Not Found')
      assert.equal(res.headers['content-type'], 'text/plain; charset=utf-8')
      done(err)
    })
  })

  it('shouldn\'t do anything if this.body is null', function (done) {
    get('http://localhost:3000/null?my_cb_name=cb', function (err, res, body) {
      assert.equal(res.statusCode, 204)
      done(err)
    })
  })

  it('should switch to JSONP mode if this.body is defined', function (done) {
    get('http://localhost:3000/buffered?my_cb_name=cb', function (err, res, body) {
      var data = JSON.parse(body.match(/cb\(([^)]+)\)/m)[1])
      assert.equal(data.foo, 'bar')
      assert.equal(res.headers['content-type'], 'text/javascript; charset=utf-8')
      done(err)
    })
  })

  it('should switch to JSONP+iframe mode if callback is provided / POST', function (done) {
    post('http://localhost:3000/buffered?my_cb_name=cb', function (err, res, body) {
      var data = JSON.parse(body.match(/cb\(([^)]+)\)/m)[1])
      assert.equal(data.foo, 'bar')
      assert.match(body, /<!doctype html>/)
      assert.equal(res.headers['content-type'], 'text/html; charset=utf-8')
      done(err)
    })
  })

  it('should switch to JSONP mode if callback is provided / GET / Stream', function (done) {
    get('http://localhost:3000/streaming?my_cb_name=cb', function (err, res, body) {
      var data = JSON.parse(body.match(/cb\(([^)]+)\)/m)[1])
      assert.lengthOf(data, 5)
      assert.equal(res.headers['content-type'], 'text/javascript; charset=utf-8')
      done(err)
    })
  })

  it('should switch to JSONP+iframe mode if callback is provided / POST / Stream', function (done) {
    post('http://localhost:3000/streaming?my_cb_name=cb', function (err, res, body) {
      var data = JSON.parse(body.match(/cb\(([^)]+)\)/m)[1])
      assert.lengthOf(data, 5)
      assert.match(body, /<!doctype html>/)
      assert.equal(res.headers['content-type'], 'text/html; charset=utf-8')
      done(err)
    })
  })
})
