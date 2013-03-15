#!/usr/bin/env node

require('./proof')(2, function (step, context, ok, compare) {
  var fs = require('fs');

  step(function (stencil, resolver) {
    context.generate('fixtures/require.stencil', { greeting: "Hello, World!" }, step());
  },

  function (actual, fixture) {
    fixture('fixtures/require-generate.xml', step());
  },

  function (expected, actual, actual) {
    ok(compare(actual.document, expected), 'called');
    context.reconstitute(actual.document, step());
  },

  function (actual) {
    context.regenerate(actual, { greeting: "Hello, Nurse!" }, step());
  },

  function (actual, fixture) {
    fixture('fixtures/require-regenerate.xml', step());
  },

  function (expected, actual) {
    ok(compare(actual.document, expected), 'regenerate');
  });
});
