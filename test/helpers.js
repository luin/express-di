exports.getCallbacks = function(routes, method, path) {
  var results = [];
  if (typeof routes !== 'object' || !routes) return results;
  if (!Array.isArray(routes[method])) return results;
  results = routes[method].filter(function(item) {
    return item.path === path;
  });
  if (!results.length) return results;
  results = results[0].callbacks;
  return results;
};
