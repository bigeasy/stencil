!function (definition) {
  if (typeof module == "object" && module.exports) module.exports = definition();
  else if (typeof define == "function" && typeof define.amd == "object") define(definition);
  else this.tz = definition();
} (function () {
  var count = 0, fs = require('fs');
  return function json (expire, callback) {
    if (count++) {
      callback(null, JSON.parse(fs.readFileSync(__dirname + '/watchers-2.json', 'utf8')));
    } else {
      callback(null, JSON.parse(fs.readFileSync(__dirname + '/watchers-1.json', 'utf8')));
    }
  }
});
