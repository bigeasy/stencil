#!/usr/bin/env node

require('./proof')(2, function (async) {
  var context, fs = require('fs');

  async(function (stencil, resolver) {

    context = stencil.create(__dirname + '/', resolver.create());
    context.generate('fixtures/json.stencil', async());

  }, function (actual, fixture) {

    fixture('fixtures/json-1.xml', async());

  }, function (expected, actual, ok, compare) {

    ok(compare(actual.node, expected), 'called');

    actual.update('%2fhome%2falan%2fgit%2fecma%2fstencil%2ft%2ftemplate%2ffixtures%2fwatchers.js', JSON.parse(fs.readFileSync(__dirname + '/fixtures/watchers-2.json')), async());
  }, function (fixture) {
    
    fixture('fixtures/json-2.xml', async());
  }, function (expected, actual, ok, compare) {
    ok(compare(actual.node, expected), 'updated');
  });
});
