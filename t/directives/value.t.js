#!/usr/bin/env node

require('./proof')(2, function (step, context, ok, compare) {
  var fs = require('fs');

  step(function (stencil, resolver) {
    context.generate('fixtures/value.stencil', { greeting: "Hello, World!" }, step());
  },

  function (actual, fixture) {
    fixture('fixtures/value-generate.xml', step());
  },

  function (expected, actual) {
    ok(compare(actual.document, expected), 'generate');
    context.reconstitute(actual.document, step());
  },

  function (actual) {
    context.regenerate(actual, { greeting: "Hello, Nurse!" }, step());
  },

  function (actual, fixture) {
    fixture('fixtures/value-regenerate.xml', step());
  },

  function (expected, actual) {
    ok(compare(actual.document, expected), 'regenerate');
  });
});
