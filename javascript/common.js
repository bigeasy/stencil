var path = require("path");
exports.create = function create (base) {
  return function javascript (module, callback) {
    try {
      callback(null, require(path.join(base, module)));
    } catch (error) {
      callback(error);
    }
  }
}
