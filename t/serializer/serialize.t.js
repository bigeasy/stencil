#!/usr/bin/env node

require('proof')(1, function (step, equal) {
  var fs = require('fs')
    , xmldom = require('xmldom')
    , serializer = require('../../serializer');

  step(function () {
    fs.readFile(__dirname + '/fixtures/serialize.xml', 'utf8', step());
    fs.readFile(__dirname + '/fixtures/serialize.html', 'utf8', step());
  }, function (actual, expected) {
    var dom = new (xmldom.DOMParser)().parseFromString(actual);
    equal(serializer(dom) + '\n', expected, 'serialized');
  });
});
