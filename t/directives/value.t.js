#!/usr/bin/env node

require('./proof')(2, function (async, ok, compare) {
  var context, fs = require('fs');

  async(function (stencil, resolver) {
    context = stencil.create(__dirname + '/', resolver.create());
    context.generate('fixtures/value.stencil', { greeting: "Hello, World!" }, async());
  },

  function (actual, fixture) {
    fixture('fixtures/value-generate.xml', async());
  },

  function (expected, actual) {
    ok(compare(actual.document, expected), 'generate');
    context.reconstitute(actual.document, async());
  },

  function (actual) {
    context.regenerate(actual, { greeting: "Hello, Nurse!" }, async());
  },

  function (actual, fixture) {
    fixture('fixtures/value-regenerate.xml', async());
  },

  function (expected, actual) {
    ok(compare(actual.document, expected), 'regenerate');
  });
});
