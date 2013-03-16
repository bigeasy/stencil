var http = require("http"), url = require("url");
exports.create = function create (base) {
  base = base.replace(/\/$/, '');
  return function json (file, callback) {
    try {
      http.get(base + file, function (response) {
        var data = [];
        response.setEncoding('utf8');
        response.on('data', function (chunk) { data.push(chunk) });
        response.on('end', function () { callback(null, JSON.parse(data.join(''))) });
        response.on('close', function () { callback(new Error('early close')) });
      }).once('error', callback);
    } catch (error) {
      callback(error);
    }
  }
}
