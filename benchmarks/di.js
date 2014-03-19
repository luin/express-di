var express = require('express');
require('..');
var app = express();
var db = require('./mock_db');

var n = parseInt(process.env.DL || '1', 10);
console.log('With DI:  %sms delay', n);

var middlewares = [];
middlewares.push(function(name, req, res, next) {
  next();
});

var body = new Buffer('Hello World');

middlewares.push(function(req, res){
  res.send(body);
});

middlewares.unshift('/');

app.factory('name', function(req, res, next) {
  db.find(1, next);
});

app.get.apply(app, middlewares);

app.listen(3333);
