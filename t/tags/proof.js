var fs = require('fs'), path = require('path');
module.exports = require('proof')(function () {
  var context =
  { stencil: require('../../index')
  , modules: require('../../modules/common')
  , resources: require('../../resources/file')
  , context: require('../..').create(__dirname + '/',
                                     require('../../modules/common'),
                                     require('../../resources/file'))
  , compare: require('../compare')
  , fixture: function (file, callback) { fs.readFile(path.resolve(__dirname, file), 'utf8', callback) }
  };
  return context;
});
