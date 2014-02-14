var utils     = require('./utils');
var mapSeries = require('async').mapSeries;

module.exports = setup;

function setup(express) {
  var factories = {};
  express.application.factory = function(name, fn) {
    if (typeof fn !== 'function') {
      throw new Error('app.factory() requires a function but got a ' + typeof fn);
    }
    factories[name] = fn;
  };

  var route = express.Router.prototype.route;

  express.Router.prototype.route = function(method, path) {
    var callbacks = utils.flatten([].slice.call(arguments, 2));

    callbacks = callbacks
      .filter(function(fn) { return typeof fn === 'function'; })
      .map(function(fn) {
        var parameters = utils.getParameters(fn);

        if (!needInject(parameters)) {
          return fn;
        }

        return function(req, res, next) {
          var self = this;
          mapSeries(parameters, function(dependency, callback) {
            if (dependency === 'req')  return callback(null, req);
            if (dependency === 'res')  return callback(null, res);
            if (dependency === 'next') return callback(null, next);
            factory = factories[dependency];
            if (!factory) {
              throw new Error('Unrecognized dependency: ' + dependency);
            }
            factory(req, res, callback);
          }, function(err, results) {
            if (err) {
              return next(err);
            }
            fn.apply(self, results);
          });
        };
      });

    route.call(this, method, path, callbacks);
  };
}

setup.utils = utils;
