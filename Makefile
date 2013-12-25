REPORTER = spec

test:
	@NODE_ENV=test ./node_modules/.bin/mocha --harmony test/*.test.js $(OPT) --reporter $(REPORTER)

test-bail:
	@$(MAKE) test OPT=--bail

test-cov:
	@jscoverage lib lib-cov
	@KOA_JSONP_COV=1 $(MAKE) test REPORTER=html-cov > coverage.html
	@rm -rf lib-cov
	@open -g coverage.html

.PHONY: test test-bail test-cov