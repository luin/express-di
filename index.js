module.exports =
  process.env.EXPRESS_DI_COV ? require('./lib-cov/di') : require('./lib/di');
