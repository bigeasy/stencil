#!/usr/bin/env node

require('./proof')(2, function (async, ok, compare) {
  var context, fs = require('fs');
  async(function (stencil, resolver) {
    context = stencil.create(__dirname + '/', resolver.create());
    context.generate('fixtures/attribute.stencil', { src: "world.png", alt: "Hello, World!" }, async());
  }, function (actual, fixture) {
    fixture('fixtures/attribute-generate.xml', async());
  }, function (expected, actual) {
    ok(compare(actual.document, expected), 'generate');
    context.regenerate(actual, { src: "nurse.png", alt: "Hello, Nurse!" }, async());
  }, function (actual, fixture) {
    fixture('fixtures/attribute-regenerate.xml', async());
  }, function (expected, actual) {
    ok(compare(actual.document, expected), 'regenerate');
  });
});
