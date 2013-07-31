#!/usr/bin/env node

require('./proof')(6, function (step, xstencil, stencil, fixture, ok, compare) {
  step(function () {

    xstencil.generate('fixtures/minimal.xstencil', {}, step());
    stencil.generate('fixtures/minimal.stencil', {}, step());
    fixture('fixtures/minimal.xml', step());

  }, function (xminimal, minimal, expected) {

    ok(compare(xminimal.document, expected), 'xstencil generate');

    step(function() {

      xstencil.regenerate(xminimal, {}, step());

    }, function (xminimal) {

      ok(compare(xminimal.document, expected), 'xstencil regenerate');
      xstencil.reconstitute(xminimal.document, step());

    }, function (xminimal) {

      xstencil.regenerate(xminimal, {}, step());

    }, function (xminimal) {

      ok(compare(xminimal.document, expected), 'xstencil reconstitute');

    });

    ok(compare(minimal.document, expected), 'stencil generate');

    step(function() {

      stencil.regenerate(xminimal, {}, step());

    }, function (xminimal) {

      ok(compare(xminimal.document, expected), 'stencil regenerate');
      stencil.reconstitute(xminimal.document, step());

    }, function (xminimal) {

      stencil.regenerate(xminimal, {}, step());

    }, function (xminimal) {

      ok(compare(xminimal.document, expected), 'stencil reconstitute');

    });
  });
});
