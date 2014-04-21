express-di
==========
[![Build Status](https://travis-ci.org/luin/express-di.png?branch=master)](https://travis-ci.org/luin/express-di)
[![Code Climate](https://codeclimate.com/github/luin/express-di.png)](https://codeclimate.com/github/luin/express-di)

Installation
-----
    npm install --save express-di

Usage
-----
To get started simply `require('express-di')` before `var app = express()`, and this module will monkey-patch Express, allowing you to define "dependencies" by providing the `app.factory()` method, after which you can use the "dependencies" in your routes following the [Dependency Injection pattern(DI)](http://docs.angularjs.org/guide/di).

Example
-----
In the past, if you want to pass variables between middlewares, you have to tack on properties to `req`, which seems odd and uncontrollable(that you couldn't point out easily which middleware add what properties to `req`). For example:

```javascript
var express = require('express');
var app = express();

var middleware1 = function(req, res, next) {
  req.people1 = { name: "Bob" };
  next();
};

var middleware2 = function(req, res, next) {
  req.people2 = { name: "Jeff" };
  next();
};

app.get('/', middleware1, middleware2, function(req, res) {
  res.json({
    people1: req.people1,
    people2: req.people2
  });
});

require('http').createServer(app).listen(3008);
```

After using express-di, you can do this:

```javascript
var express = require('express');
// Require express-di
require('express-di');
var app = express();

app.factory('people1', function(req, res, next) {
  next(null, { name: "Bob" });
});

app.factory('people2', function(req, res, next) {
  next(null, { name: "Jeff" });
});

app.get('/', function(people1, people2, res) {
  res.json({
    people1: people1,
    people2: people2
  });
});

require('http').createServer(app).listen(3008);

```

Define a dependency
-----
The `app.factory(name, fn)` method is used to define a dependency.

### Arguments

* `name`: The name of the dependency.
* `fn`: A function that is like a typical express middleware, takes 3 arguments, `req`, `res` and `next`, with a subtle difference that the `next` function takes 2 arguments: an error(can be null) and the value of the dependency.

### Default dependencies
express-di has defined three default dependencies: `req`, `res` and `next`, so that you can use these arguments in your router middlewares just as before.


Cache
-----
The same dependency will be cached per request. For instance:

```javascript
app.factory('me', function(req, res, next) {
  // This code block will only be executed once per request.
  User.find(req.params.userId, next);
});

var checkPermission = function(me, next) {
  if (!me) {
    return next(new Error('No permission.'));
  }
  next();
};

app.get('/me', checkPermission, function(me, res) {
  res.json(me);
});
```

Where can I use DI?
-----
You can use DI in your route-specific middlewares(aka `app.get()`, `app.post()`, `app.put()`...).

Sub App
-----
Express-DI supports sub apps out of the box. Parent app cannot access the dependencies defined in the children apps, while children apps inherits the dependencies defined in the parent app:

    var express = require('express');
    require('express-di');
    var mainApp = express();
    var subApp = express();
    mainApp.use(subApp);

    mainApp.factory('parents', function(req, res, next) {
      next(null, 'parents');
    });

    subApp.factory('children', function(req, res, next) {
      next(null, 'children');
    });

    mainApp.get('/parents', function(children, res) {
      // throws error
      res.json(children);
    });

    subApp.get('/children', function(parents, res) {
      res.json(parents);
    });

Performance
-----
The process of DI will only be executed once at startup, so you don't need to worry about the performance.

You can test the performance using `make bench`.

Benchmark requires [`wrk`](https://github.com/wg/wrk) to be installed first. You can run `brew install wrk` for Mac OS, or [build it](https://github.com/wg/wrk/issues/39) from sources for Ubuntu.

Test
-----
* `make test`
* `make test-cov` will create the coverage.html showing the test-coverage of this module.

Articles and Recipes
-----
* [Node Roundup: cipherhub, slate, express-di](http://dailyjs.com/2014/03/19/node-roundup/)
* [Express 框架 middleware 的依赖问题与解决方案](http://zihua.li/2014/03/using-dependency-injection-to-optimise-express-middlewares/) [Chinese]

License
-----
The MIT License (MIT)

Copyright (c) 2014 Zihua Li

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

[![Bitdeli Badge](https://d2weczhvl823v0.cloudfront.net/luin/express-di/trend.png)](https://bitdeli.com/free "Bitdeli Badge")
