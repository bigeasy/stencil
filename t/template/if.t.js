#!/usr/bin/env node

var context, fs = require('fs');
require('./proof')(1, function (async) {
  async(function (stencil, resolver) {
    context = stencil.create(__dirname + '/', resolver.create());
    context.generate('fixtures/if.stencil', { value: true }, async());
  },
  
  function (actual, fixture) {
    fixture('fixtures/if-generate.xml', async());
  },
  
  function (expected, actual, ok, compare) {
    console.log(actual.document.toString());
    ok(compare(actual.document, expected), 'generate');
  });
});
