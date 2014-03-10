var express   = require('express');
var utils     = require('./utils');
var mapSeries = require('async').mapSeries;

var diFactoriesKey = '__EXPRESS_DI_FACTORIES__';
express.application.factory = function(name, fn) {
  if (typeof fn !== 'function') {
    throw new Error('app.factory() requires a function but got a ' + typeof fn);
  }
  if (!this.settings.hasOwnProperty(diFactoriesKey)) {
    this.set(diFactoriesKey, {});
  }
  var factories = this.get(diFactoriesKey);
  factories[name] = fn;
};

var route = express.Router.prototype.route;

express.Router.prototype.route = function(method, path) {
  var callbacks = utils.flatten([].slice.call(arguments, 2));

  callbacks = callbacks
    .map(function(fn) {
      if (typeof fn !== 'function') return fn;

      var parameters = utils.getParameters(fn);

      if (!utils.needInject(parameters)) {
        return fn;
      }

      return function(req, res, next) {
        if (!req.__di_caches) {
          req.__di_caches = {};
        }
        var self = this;
        mapSeries(parameters, function(dependency, callback) {
          if (dependency === 'req')  return callback(null, req);
          if (dependency === 'res')  return callback(null, res);
          if (dependency === 'next') return callback(null, next);
          var currentApp = req.app,
              factories = currentApp.get(diFactoriesKey),
              factory;

          if (factories) {
            while(currentApp) {
              factories = currentApp.get(diFactoriesKey);
              if (factories) {
                if (factories[dependency]) {
                  factory = factories[dependency];
                  break;
                }
                currentApp = currentApp.parent;
              } else {
                break;
              }
            }
          }
          if (!factory) {
            throw new Error('Unrecognized dependency: ' + dependency);
          }
          if (req.__di_caches[dependency]) {
            callback(req.__di_caches[dependency][0], req.__di_caches[dependency][1]);
          } else {
            factory(req, res, function(err, result) {
              req.__di_caches[dependency] = [err, result];
              callback(err, result);
            });
          }
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

exports.utils = utils;
