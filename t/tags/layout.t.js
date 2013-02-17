#!/usr/bin/env node

var context, fs = require('fs');
require('./proof')(1, function (async, ok, compare) {

  async(function (stencil, resolver) {
    context = stencil.create(__dirname + '/', resolver.create());
    context.generate('fixtures/layedout.stencil', { greeting: "Hello, World!" }, async());
  },
  
  function (actual, fixture) {
    fixture('fixtures/layedout.xml', async());
  },
  
  function (expected, actual, ok, compare) {
    ok(compare(actual.document, expected), 'true');
    context.regenerate(actual, {}, async());
  });
});
