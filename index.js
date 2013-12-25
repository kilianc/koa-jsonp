/**
 * index.js
 * Created by Kilian Ciuffolo on Dec 25, 2013
 * Copyright (c) 2013 Kilian Ciuffolo, me@nailik.org
 */

/**
 * Commodity globals
 */

GLOBAL.LIB_PATH = __dirname + (process.env.AI_COV ? '/lib-cov' : '/lib')

/**
 * Main exports
 */

module.exports = require(LIB_PATH + '/jsonp.js')