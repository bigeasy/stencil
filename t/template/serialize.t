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

    context.deregister(actual.node);
    var html = actual.node.toString();
    return context.deserialize(new (xmldom.DOMParser)().parseFromString(html));
  }, function (actual) {
    var path = escape(__dirname + '/fixtures/watchers.js').replace(/\//g, '%2f');
    var watchers = require('./fixtures/watchers');
    watchers.emitter.emit('update', null, watchers.watchers2);
  }, function (fixture) {
    fixture('fixtures/json-2.xml', async());
  }, function (expected, actual, ok, compare) {
    ok(compare(actual.node, expected), 'updated');
  });
});
