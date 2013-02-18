#!/usr/bin/env node

var context, fs = require('fs');
require('./proof')(4, function (async, ok, compare) {

  async(function (stencil, resolver) {
    context = stencil.create(__dirname + '/', resolver.create());
    context.generate('fixtures/conditional.stencil', { greeting: "Hello, World!" }, async());
  },
  
  function (actual, fixture) {
    fixture('fixtures/conditional-true.xml', async());
  },
  
  function (truthy, actual, ok, compare) {
    ok(compare(actual.document, truthy), 'true');
    context.regenerate(actual, {}, async());
  },

  function (actual, fixture) {
    fixture('fixtures/conditional-false.xml', async());
  },
  
  function (falsey, actual, ok, compare) {
    ok(compare(actual.document, falsey), 'false');
    context.regenerate(actual, { greeting: "Hello, World!" }, async());
  },
  
  function (actual, truthy, ok, compare) {
    ok(compare(actual.document, truthy), 'regenerating');
    context.reconstitute(actual.document, async());
  },

  function (actual) {
    context.regenerate(actual, { greeting: "Hello, World!" }, async());
  },

  function (actual, truthy, ok, compare) {
    ok(compare(actual.document, truthy), 'regenerating');
  });
});
