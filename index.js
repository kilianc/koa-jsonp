/*!
 * index.js
 * Created by Kilian Ciuffolo on Dec 25, 2013
 * Copyright (c) 2013 Kilian Ciuffolo, me@nailik.org
 */

/**
 * Main exports
 */

module.exports = require((process.env.KOA_JSONP_COV ? './lib-cov' : './lib') + '/jsonp')