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


express.Router.prototype._dispatch = function(req, res, next){
  var params = this.params
    , self = this;


  // route dispatch
  (function pass(i, err){
    var paramCallbacks
      , paramIndex = 0
      , paramVal
      , route
      , keys
      , key;

    // match next route
    function nextRoute(err) {
      pass(req._route_index + 1, err);
    }

    // match route
    req.route = route = self.matchRequest(req, i);

    // implied OPTIONS
    if (!route && 'OPTIONS' == req.method) return self._options(req, res, next);

    // no route
    if (!route) return next(err);

    // we have a route
    // start at param 0
    req.params = route.params;
    keys = route.keys;
    i = 0;

    // param callbacks
    function param(err) {
      paramIndex = 0;
      key = keys[i++];
      paramVal = key && req.params[key.name];
      paramCallbacks = key && params[key.name];

      try {
        if ('route' == err) {
          nextRoute();
        } else if (err) {
          i = 0;
          callbacks(err);
        } else if (paramCallbacks && undefined !== paramVal) {
          paramCallback();
        } else if (key) {
          param();
        } else {
          i = 0;
          callbacks();
        }
      } catch (err) {
        param(err);
      }
    };

    param(err);

    // single param callbacks
    function paramCallback(err) {
      var fn = paramCallbacks[paramIndex++];
      if (err || !fn) return param(err);

      var parameters = utils.getParameters(fn);

      if (!utils.needInject(parameters)) {
        return fn(req, res, paramCallback, paramVal, key.name);
      }

      if (!req.__di_caches) {
        req.__di_caches = {};
      }
      var self = this;
      mapSeries(parameters, function(dependency, callback) {
        if (dependency === 'req')  return callback(null, req);
        if (dependency === 'res')  return callback(null, res);
        if (dependency === 'next') return callback(null, paramCallback);

        var currentApp = req.app,
            factories,
            factory;

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
        if (!factory) {
          return callback(err, null);
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
          return param(err);
        }
        var _results = [], k=0;
        for(var i =0; i<results.length; i++){
          if(results[i]) {
            _results[i] = results[i];
          }else if(k < 2){
            if(k === 0){
              _results[i] = paramVal;
            }else {
              _results[i] = key.name;
            }
            k++;
          }
        }
        return fn.apply(self, _results);
      });
    }

    // invoke route callbacks
    function callbacks(err) {
      var fn = route.callbacks[i++];
      try {
        if ('route' == err) {
          nextRoute();
        } else if (err && fn) {
          if (fn.length < 4) return callbacks(err);
          fn(err, req, res, callbacks);
        } else if (fn) {
          if (fn.length < 4) return fn(req, res, callbacks);
          callbacks();
        } else {
          nextRoute(err);
        }
      } catch (err) {
        callbacks(err);
      }
    }
  })(0);
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
              factories,
              factory;

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
