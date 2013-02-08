var fs = require('fs'), path = require('path');
module.exports = require('proof')(function () {
  var context =
  { stencil: require('../../redux')
  , resolver: require('../../resolver')
  , compare: require('../compare')
  , fixture: function (file, callback) { fs.readFile(path.resolve(__dirname, file), 'utf8', callback) }
  };
  return context;
});
