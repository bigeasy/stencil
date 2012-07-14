#!/usr/bin/env node

require('proof')(1, function (async, equal) {
  var fs = require('fs')
    , xmldom = require('xmldom')
    , serializer = require('../../serializer');

  async(function () {
    fs.readFile(__dirname + '/fixtures/serialize.xml', 'utf8', async());
  }, function (actual) {
    fs.readFile(__dirname + '/fixtures/serialize.html', 'utf8', async());
  }, function (expected, actual) {
    var dom = new (xmldom.DOMParser)().parseFromString(actual);
    equal(serializer(dom) + '\n', expected, 'serialized');
  });
});
