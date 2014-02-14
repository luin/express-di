REPORTER = dot

check: test

test:
	@NODE_ENV=test ./node_modules/.bin/mocha \
		--reporter $(REPORTER)

test-cov: lib-cov
	@EXPRESS_DI_COV=1 $(MAKE) test REPORTER=html-cov > coverage.html

lib-cov:
	@jscoverage lib lib-cov

test-coveralls:   lib-cov
	echo TRAVIS_JOB_ID $(TRAVIS_JOB_ID)
	@TEST_COVERAGE=1 $(MAKE) test REPORTER=mocha-lcov-reporter | ./node_modules/coveralls/bin/coveralls.js
	rm -rf lib-cov

clean:
	rm -f coverage.html
	rm -fr lib-cov

.PHONY: test clean
