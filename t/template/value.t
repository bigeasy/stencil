#!/usr/bin/env node

var context, fs = require('fs');
require('./proof')(1, function (async) {
  async(function (stencil, resolver) {
    context = stencil.create(__dirname + '/', resolver.create());
    context.generate('fixtures/value.stencil', async());
  }, function (actual, fixture) {
    fixture('fixtures/value.xml', async());
  }, function (expected, actual, ok, compare) {
    ok(compare(actual, expected), 'called');
  });
});

// vim: set ft=javascript:
