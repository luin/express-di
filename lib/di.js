var express = require('express');
var utils = require('./utils');
var methods = require('methods');
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

methods.concat('all').forEach(function(method) {
  var origin = express.Route.prototype[method];
  express.Route.prototype[method] = function() {
    var callbacks = utils.flatten([].slice.call(arguments));

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
            if (dependency === 'req') return callback(null, req);
            if (dependency === 'res') return callback(null, res);
            if (dependency === 'next') return callback(null, next);

            var currentApp = req.app,
              factories,
              factory;

            while (currentApp) {
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

    return origin.apply(this, callbacks);
  };
});

exports.utils = utils;
