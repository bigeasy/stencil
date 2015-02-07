var fs = require('fs'), path = require('path');
exports.create = function (base) {
  return function (file) {
    return function (callback) {
      try {
        file = this.stencil.absolutize(this.stencil.url + '/..', file);
        callback(null, JSON.parse(fs.readFileSync(path.join(base, file), 'utf8')));
      } catch (error) {
        callback(error);
      }
    }
  }
}
