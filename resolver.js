var parse = require("url").parse, path = require("path"), fs = require("fs"), xmldom = require("xmldom");
module.exports.create = function create (base) {
  return function resolver (url, callback) {
    fs.readFile(path.resolve(base, url), "utf8", function (error, source) {
      if (error) callback(error);
      else callback(null, new (xmldom.DOMParser)().parseFromString(source));
    });
  }
}
