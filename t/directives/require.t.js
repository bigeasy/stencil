#!/usr/bin/env node

require('./proof')(2, function (async, ok, compare) {
  var context, fs = require('fs');

  async(function (stencil, resolver) {
    context = stencil.create(__dirname + '/', resolver.create());
    context.generate('fixtures/require.stencil', { greeting: "Hello, World!" }, async());
  },

  function (actual, fixture) {
    fixture('fixtures/require-generate.xml', async());
  },

  function (expected, actual, actual) {
    ok(compare(actual.document, expected), 'called');
    context.reconstitute(actual.document, async());
  },

  function (actual) {
    context.regenerate(actual, { greeting: "Hello, Nurse!" }, async());
  },

  function (actual, fixture) {
    fixture('fixtures/require-regenerate.xml', async());
  },

  function (expected, actual) {
    ok(compare(actual.document, expected), 'regenerate');
  });
});
