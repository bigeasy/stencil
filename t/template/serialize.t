#!/usr/bin/env node

require('./proof')(2, function (async) {
  var context, fs = require('fs'), xmldom = require('xmldom');

  async(function (stencil, resolver) {

    context = stencil.create(__dirname + '/', resolver.create());
    context.generate('fixtures/json.stencil', async());

  }, function (actual, fixture) {

    fixture('fixtures/json-1.xml', async());

  }, function (expected, actual, ok, compare) {
    ok(compare(actual.node, expected), 'called');

    var html = actual.node.toString();
    return context.deserialize(new (xmldom.DOMParser)().parseFromString(html));
  }, function (actual) {
    var path = escape(__dirname + '/fixtures/watchers.js').replace(/\//g, '%2f');
    actual.update(path, JSON.parse(fs.readFileSync(__dirname + '/fixtures/watchers-2.json')), async());
  }, function (fixture) {
    fixture('fixtures/json-2.xml', async());
  }, function (expected, actual, ok, compare) {
    ok(compare(actual.node, expected), 'updated');
  });
});
