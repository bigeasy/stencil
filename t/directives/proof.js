var fs = require('fs'), path = require('path');
module.exports = require('proof')(function () {
  var javascript = require('../../javascript/common').create(__dirname),
      xml = require('../../xml/file').create(__dirname),
      html = require('../../html/parser');
  var context =
  { context: require('../..').create(javascript, xml, null, html)
  , compare: require('../compare')
  , fixture: function (file, callback) { fs.readFile(path.resolve(__dirname, file), 'utf8', callback) }
  };
  return context;
});
