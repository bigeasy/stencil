#!/usr/bin/env node

require('./proof')(3, function (step, xstencil, fixture, ok, compare) {
  step(function () {

    xstencil.generate('fixtures/minimal.xstencil', {}, step());
    fixture('fixtures/minimal.xml', step());

  }, function (actual, expected) {

    ok(compare(actual.document, expected), 'xstencil generate');

    step(function() {

      xstencil.regenerate(actual, {}, step());

    }, function (actual) {

      ok(compare(actual.document, expected), 'xstencil regenerate');
      xstencil.reconstitute(actual.document, step());

    }, function (actual) {

      xstencil.regenerate(actual, {}, step());

    }, function (actual) {

      ok(compare(actual.document, expected), 'xstencil reconstitute');

    });
  });
});
