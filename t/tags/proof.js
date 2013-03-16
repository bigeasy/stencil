var fs = require('fs'), path = require('path');
module.exports = require('proof')(function () {
  var javascript = require('../../javascript/common').create(__dirname),
      xml = require('../../xml/file').create(__dirname),
      json = require('../../json/file').create(__dirname);
  var context =
  { context: require('../..').create(javascript, xml, json)
  , compare: require('../compare')
  , fixture: function (file, callback) { fs.readFile(path.resolve(__dirname, file), 'utf8', callback) }
  };
  return context;
});
