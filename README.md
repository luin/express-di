express-di
==========
[![Build Status](https://travis-ci.org/luin/express-di.png?branch=master)](https://travis-ci.org/luin/express-di)

Installation
-----
    npm inttall --save express-di

Usage
-----
To get started simply `require('express-di')` before `var app = express()`, and this module will monkey-patch Express, allowing you to define "denpendencies" by providing the `app.factory()` method, after which you can use the "denpendencies" in you routes following the [Dependency Injection pattern(DI)](http://docs.angularjs.org/guide/di).

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


Performance
-----
The process of DI will only be executed once at startup, so you don't need to worry about the performance.


You can test the performance using `make bench`.

Test
-----
* `make test`
* `make test-cov` will create the coverage.html showing the test-coverage of this module.

Articles and Recipes
-----
* [Express 框架 middleware 的依赖问题与解决方案](http://zihua.li/2014/03/using-dependency-injection-to-optimise-express-middlewares/) [Chinese]

License
-----
This code is under the Apache License 2.0.  http://www.apache.org/licenses/LICENSE-2.0

[![Bitdeli Badge](https://d2weczhvl823v0.cloudfront.net/luin/express-di/trend.png)](https://bitdeli.com/free "Bitdeli Badge")
