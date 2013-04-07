#!/usr/bin/env node

require('./proof')(2, function (step, context, fixture, ok, compare) {
  var fs = require('fs');

  step(function () {

    context.generate('fixtures/attribute.stencil', { src: "world.png", alt: "Hello, World!" }, step());
    fixture('fixtures/attribute-generate.xml', step());
    fixture('fixtures/attribute-regenerate.xml', step());

  }, function (actual, generate, regenerate) {

    step(function () {

      ok(compare(actual.document, generate), 'generate');
      context.regenerate(actual, { src: "nurse.png", alt: "Hello, Nurse!" }, step());

    }, function (actual) {

      ok(compare(actual.document, regenerate), 'regenerate');

    });
  });
});
