#!/usr/bin/env node

require('./proof')(4, function (step, stencil, context, fixture, ok, compare) {
  var fs = require('fs');

  step(function () {

    stencil.generate('fixtures/value.stencil', { greeting: "Hello, World!" }, step());
    context.generate('fixtures/value.xml', { greeting: "Hello, World!" }, step());
    fixture('fixtures/value-generate.xml', step());
    fixture('fixtures/value-regenerate.xml', step());

  }, function (value, xvalue, generate, regenerate) {

    ok(compare(xvalue.document, generate), 'xstencil generate');

    step(function () {

      context.reconstitute(xvalue.document, step());

    }, function (reconstituted) {

      context.regenerate(reconstituted, { greeting: "Hello, Nurse!" }, step());

    }, function (regenerated) {

      ok(compare(regenerated.document, regenerate), 'xstencil regenerate');

    });

    ok(compare(value.document, generate), 'stencil generate');

    step(function () {

      stencil.reconstitute(value.document, step());

    }, function (reconstituted) {

      stencil.regenerate(reconstituted, { greeting: "Hello, Nurse!" }, step());

    }, function (regenerated) {

      ok(compare(regenerated.document, regenerate), 'stencil regenerate');

    });
  });
});
