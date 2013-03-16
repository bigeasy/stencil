#!/usr/bin/env node

require('./proof')(2, function (step, context, fixture, ok, compare) {
  var fs = require('fs');

  step(function () {

    context.generate('fixtures/value.stencil', { greeting: "Hello, World!" }, step());
    fixture('fixtures/value-generate.xml', step());
    fixture('fixtures/value-regenerate.xml', step());

  }, function (actual, generate, regenerate) {

    ok(compare(actual.document, generate), 'generate');

    step(function () {

      context.reconstitute(actual.document, step());

    }, function (actual) {

      context.regenerate(actual, { greeting: "Hello, Nurse!" }, step());

    }, function (actual) {

      ok(compare(actual.document, regenerate), 'regenerate');

    });
  });
});
