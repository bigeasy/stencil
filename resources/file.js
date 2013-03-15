var fs = require("fs"), xmldom = require("xmldom");
module.exports = function resolver (url, mimeType, callback) {
  switch (mimeType) {
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
};
