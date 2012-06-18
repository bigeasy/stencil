var parse = require("url").parse, path = require("path"), fs = require("fs"), xmldom = require("xmldom");
module.exports.create = function create (base) {
  return function resolver (url, mimeType, callback) {
    var resolved = path.resolve(base, url)
    switch (mimeType) {
    case "text/javascript":
      try {
        callback(null, require(resolved));
      } catch (error) {
        callback(error);
      }
      break;
    case "text/xml":
      fs.readFile(resolved, "utf8", function (error, source) {
        if (error) callback(error);
        else callback(null, new (xmldom.DOMParser)().parseFromString(source));
      });
      break;
    }
  }
}
