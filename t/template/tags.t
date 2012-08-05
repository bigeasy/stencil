#!/usr/bin/env node

require('./proof')(2, function (async) {
  var context, fs = require('fs');

  async(function (stencil, resolver) {

    context = stencil.create(__dirname + '/', resolver.create());
    context.generate('fixtures/tags.stencil', async());

  }, function (actual, fixture) {

    fixture('fixtures/tags.xml', async());

  }, function (expected, actual, ok, compare) {
    ok(compare(actual.node, expected), 'called');

    var watchers = require('./fixtures/watchers');
    // STEP: Errors are getting hard.
    watchers.emitter.emit('update', null, watchers.watchers2);
  }, function (fixture) {
    fixture('fixtures/tags-after.xml', async());
  }, function (expected, actual, ok, compare) {
    ok(compare(actual.node, expected), 'updated');
  });
});
