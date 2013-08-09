#!/usr/bin/env node

var fs = require('fs'), object = {
  items: [{ value: 1 }, { value: 2 }]
};
require('./proof')(6, function (step, xstencil, stencil, fixture, ok, compare) {

  step(function () {

    xstencil.generate('fixtures/evaluated.xstencil', object, step());
    stencil.generate('fixtures/evaluated.stencil', object, step());
    fixture('fixtures/evaluated.xml', step());

  }, function (xevaluated, evaluated, expected) {

    ok(compare(xevaluated.document, expected), 'xstencil generate');

    step(function() {

      xstencil.regenerate(xevaluated, object, step());

    }, function (xevaluated) {

      ok(compare(xevaluated.document, expected), 'xstencil regenerate');
      xstencil.reconstitute(xevaluated.document, step());

    }, function (xevaluated) {

      xstencil.regenerate(xevaluated, object, step());

    }, function (xevaluated) {

      ok(compare(xevaluated.document, expected), 'xstencil reconstitute');

    });

    ok(compare(evaluated.document, expected), 'stencil generate');

    step(function() {

      stencil.regenerate(evaluated, object, step());

    }, function (evaluated) {

      ok(compare(evaluated.document, expected), 'stencil regenerate');
      stencil.reconstitute(evaluated.document, step());

    }, function (evaluated) {

      stencil.regenerate(evaluated, object, step());

    }, function (evaluated) {

      ok(compare(evaluated.document, expected), 'stencil reconstitute');

    });
  });
});
