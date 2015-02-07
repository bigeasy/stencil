#!/usr/bin/env node

require('./proof')(4, function (step, xstencil, _stencil, fixture, ok, compare) {
  var fs = require('fs');

  step(function () {

    xstencil.generate('fixtures/value.xstencil', { greeting: 'Hello, World!' }, step());
    _stencil.generate('fixtures/value.stencil', { greeting: 'Hello, World!' }, step());
    fixture('fixtures/value-generate.xml', step());
    fixture('fixtures/value-regenerate.xml', step());

  }, function (xvalue, value, generate, regenerate) {

    ok(compare(xvalue.document, generate), 'xstencil generate');

    step(function () {

      xstencil.reconstitute(xvalue.document, step());

    }, function (reconstituted) {

      xstencil.regenerate(reconstituted, { greeting: 'Hello, Nurse!' }, step());

    }, function (regenerated) {

      ok(compare(regenerated.document, regenerate), 'xstencil regenerate');

    });

    ok(compare(value.document, generate), 'stencil generate');

    step(function () {

      _stencil.reconstitute(value.document, step());

    }, function (reconstituted) {

      _stencil.regenerate(reconstituted, { greeting: 'Hello, Nurse!' }, step());

    }, function (regenerated) {

      ok(compare(regenerated.document, regenerate), 'stencil regenerate');

    });
  });
});
