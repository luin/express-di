var helpers = require('./helpers');
var express = require('express');
require('..');
var app = express();

var request = require('supertest')(app);

describe('app.factory', function() {
  it('should be a function', function() {
    app.factory.should.be.type('function');
  });

  it('should throw when the `fn` is not a function', function() {
    (function(){
      app.factory('a', 'b');
    }).should.throw();
  });

  it('should not throw when the `fn` is a function', function() {
    (function(){
      app.factory('a', function() {});
    }).should.not.throw();
  });
});

describe('express.Router.prototype.route', function() {
  it('should be compatible with the old middleware', function() {
    var func1 = function(req) {};
    var func2 = function(req, res) {};
    var func3 = function(req, res, next) {};
    var func4 = function(err, req, res, next) {};
    var func5 = function(error, req, res, next) {};
    app.get('/test1', func1, func2, func3, func4, func5);
    var cbs = helpers.getCallbacks(app.routes, 'get', '/test1');
    cbs[0].should.equal(func1);
    cbs[1].should.equal(func2);
    cbs[2].should.equal(func3);
    cbs[3].should.equal(func4);
    cbs[4].should.equal(func5);
  });

  it('should wrapper the others middlewares', function(done) {
    var _req, _res, _next;
    var func1 = function(req, res, next) {
      _req = req;
      _res = res;
      _next = next;
      next();
    };
    var func2 = function(res, req, next) {
      res.should.equal(_res);
      req.should.equal(_req);
      next();
    };
    var func3 = function(next, res, req) {
      res.should.equal(_res);
      req.should.equal(_req);
      next.should.equal(_next);
      res.send(200, 'bazinga');
    };
    app.get('/test2', func1, func2, func3);
    request.get('/test2').expect('bazinga', done);
  });

  it('should share the same `req` and `res` between factories and routes', function(done) {
    var _req, _res;
    app.factory('test3', function(req, res, next) {
      res.should.equal(_res);
      req.should.equal(_req);
      next();
    });

    var func1 = function(req, res, next) {
      _req = req;
      _res = res;
      next();
    };
    var func2 = function(test3, res) {
      res.send(200);
    };
    app.get('/test3', func1, func2);
    request.get('/test3').expect(200, done);
  });

  it('should resolve the dependencies with the factories', function(done) {
    app.factory('test4', function(req, res, next) {
      next(null, { name: 'Bob' });
    });

    var func1 = function(req, res, next) {
      next();
    };
    var func2 = function(req, test4, res) {
      test4.should.eql({ name: 'Bob' });
      res.send(200);
    };
    app.get('/test4', func1, func2);
    request.get('/test4').expect(200, done);
  });

  it('should pass errors to the next middleware', function(done) {
    app.factory('test5', function(req, res, next) {
      next('an error');
    });

    var func1 = function(req, res, test5) {
      res.send(200);
    };
    var func2 = function(err, req, res, next) {
      err.should.eql('an error');
      res.send(500);
    };
    app.get('/test5', func1, func2);
    request.get('/test5').expect(500, done);
  });

  it('should throw when using the unrecognized dependencies', function(done) {
    var func1 = function(res, missing) {
      res.send(200);
    };
    app.get('/test6', func1);
    request.get('/test6').expect(/Unrecognized dependency: missing/, done);
  });

  it('should cache the same dependency', function(done) {
    var times = 0;
    app.factory('test7', function(req, res, next) {
      times += 1;
      next(null, times);
    });

    var func1 = function(next, test7) {
      next();
    };
    var func2 = function(req, res, test7) {
      test7.should.eql(1);
      req.__di_caches.test7.should.eql([null, 1]);
      res.send(200);
    };
    app.get('/test7', func1, func2);
    request.get('/test7').expect(200, done);
  });
});
