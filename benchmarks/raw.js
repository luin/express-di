var http = require('http');
var express = require('express');
var app = express();
var db = require('./mock_db');

var n = parseInt(process.env.DL || '1', 10);
console.log('Without DI: %sms delay', n);

var middlewares = [];
middlewares.push(function(req, res, next) {
  db.find(1, function(err, result) {
    if (err) return next(err);
    req.name = result;
    next();
  });
});

var body = new Buffer('Hello World');

middlewares.push(function(req, res, next){
  res.send(body);
});

middlewares.unshift('/');

app.get.apply(app, middlewares);

app.listen(3333);
