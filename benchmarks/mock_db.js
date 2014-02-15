var db = {
  1: 'Bob'
};

var n = parseInt(process.env.DL || '1', 10);
exports.find = function(id, callback) {
  setTimeout(function() {
    callback(null, db[id]);
  }, n);
};
