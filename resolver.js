var parse = require("url").parse, path = require("path"), fs = require("fs"), xmldom = require("xmldom");
module.exports.create = function create () {
  return function resolver (url, mimeType, callback) {
    switch (mimeType) {
    case "text/javascript":
      try {
        callback(null, require(url));
      } catch (error) {
        callback(error);
      }
      break;
    case "text/xml":
      callback(null, new (xmldom.DOMParser)().parseFromString(fs.readFileSync(url, "utf8")));
      /*fs.readFile(url, "utf8", function (error, source) {
        if (error) callback(error);
        else callback(null, new (xmldom.DOMParser)().parseFromString(source));
      });*/
      break;
    case "application/json":
      callback(null, JSON.parse(fs.readFileSync(url, "utf8")));
      break;
    }
  }
}
