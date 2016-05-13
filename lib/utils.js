/**
 * Flatten the given `arr`.
 *
 * @param {Array} arr
 * @return {Array}
 * @api private
 */

exports.flatten = function(arr, ret){
  ret = ret || [];
  var len = arr.length;
  for (var i = 0; i < len; ++i) {
    if (Array.isArray(arr[i])) {
      exports.flatten(arr[i], ret);
    } else {
      ret.push(arr[i]);
    }
  }
  return ret;
};

/**
 * Get the parameters of the given `fn`.
 *
 * @param {Function} fn
 * @return {Array}
 * @api private
 */

exports.getParameters = function (fn) {
  var fnText = fn.toString();
  if (exports.getParameters.cache[fnText]) {
    return exports.getParameters.cache[fnText];
  }

  var FN_ARGS        = /^(?:function\s*[^\(]*\(\s*([^\)]*)\))|(?:\(([^\)]*)\)\s*\=\>)/m,
      FN_ARG_SPLIT   = /,/,
      FN_ARG         = /^\s*(_?)(\S+?)\1\s*$/,
      STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;

  var inject = [];
  var argDecl = fnText.replace(STRIP_COMMENTS, '').match(FN_ARGS);
  var argString = typeof argDecl[1] === 'string' ? argDecl[1] : argDecl[2];
  argString.split(FN_ARG_SPLIT).forEach(function(arg) {
    arg.replace(FN_ARG, function(all, underscore, name) {
      inject.push(name);
    });
  });

  exports.getParameters.cache[fn] = inject;
  return inject;
};

exports.getParameters.cache = {};

/**
 * Test wether the given two array is same
 *
 * @param {Array} arr1
 * @param {Array} arr2
 * @return {Boolean}
 * @api private
 */

exports.arraysEqual = function(arr1, arr2) {
  if (arr1 === arr2) return true;
  if (arr1 === null || arr2 === null) return false;
  if (arr1.length != arr2.length) return false;

  for (var i = 0; i < arr1.length; ++i) {
    if (arr1[i] !== arr2[i]) return false;
  }

  return true;
};

exports.needInject = function(parameters) {
  var skipRules = [
    [],
    ['req'],
    ['req', 'res'],
    ['req', 'res', 'next'],
    ['err', 'req', 'res', 'next'],
    ['error', 'req', 'res', 'next']
  ];
  for (var i = 0; i < skipRules.length; ++i) {
    if (exports.arraysEqual(skipRules[i], parameters)) {
      return false;
    }
  }
  return true;
};
