var fs = require("fs"), path = require("path"), xmldom = require("xmldom");
exports.create = function create (base) {
  return function xml (file, callback) {
    try {
      var body = fs.readFileSync(path.join(base, file), "utf8");
      callback(null, new (xmldom.DOMParser)().parseFromString(body));
    } catch (error) {
      callback(error);
    }
  }
}
