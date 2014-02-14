var express = require('express');
var setup = require('..');
setup(express);
var app = express();

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
});
