#!/usr/bin/env node

var context, fs = require('fs');
require('./proof')(2, function (async) {
  async(function (stencil, resolver) {
    context = stencil.create(__dirname + '/', resolver.create());
    context.generate('fixtures/if.stencil', { value: true }, async());
  },
  
  function (actual, fixture) {
    fixture('fixtures/if-true.xml', async());
  },
  
  function (truthy, actual, ok, compare) {
    ok(compare(actual.document, truthy), 'generate');
    context.reconstitute(actual.document, async());
  },
  
  function (actual) {
    context.regenerate(actual, { value: false }, async());
  },

  function (actual, fixture) {
    fixture('fixtures/if-false.xml', async());
  },

  function (falsey, actual, ok, compare) {
    console.log(actual.document.toString());
    ok(compare(actual.document, falsey), 'generate-false');
  });
});
