var fs = require("fs"), path = require("path");
exports.create = function create (base) {
  return function json (file, callback) {
    try {
      callback(null, JSON.parse(fs.readFileSync(path.join(base, file), "utf8")));
    } catch (error) {
      callback(error);
    }
  }
}
