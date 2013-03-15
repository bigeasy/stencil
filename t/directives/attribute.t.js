#!/usr/bin/env node

require('./proof')(2, function (step, context, ok, compare) {
  var fs = require('fs');

  step(function (stencil, resolver) {
    context.generate('fixtures/attribute.stencil', { src: "world.png", alt: "Hello, World!" }, step());
  },

  function (actual, fixture) {
    fixture('fixtures/attribute-generate.xml', step());
  },

  function (expected, actual) {
    ok(compare(actual.document, expected), 'generate');
    context.regenerate(actual, { src: "nurse.png", alt: "Hello, Nurse!" }, step());
  },

  function (actual, fixture) {
    fixture('fixtures/attribute-regenerate.xml', step());
  },

  function (expected, actual) {
    ok(compare(actual.document, expected), 'regenerate');
  });
});
