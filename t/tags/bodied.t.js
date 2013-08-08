#!/usr/bin/env node

require('./proof')(6, function (step, xstencil, stencil, fixture, ok, compare) {
  step(function () {

    xstencil.generate('fixtures/bodied.xstencil', {}, step());
    stencil.generate('fixtures/bodied.stencil', {}, step());
    fixture('fixtures/bodied.xml', step());

  }, function (xbodied, bodied, expected) {

    ok(compare(xbodied.document, expected), 'xstencil generate');

    step(function() {

      xstencil.regenerate(xbodied, {}, step());

    }, function (xbodied) {

      ok(compare(xbodied.document, expected), 'xstencil regenerate');
      xstencil.reconstitute(xbodied.document, step());

    }, function (xbodied) {

      xstencil.regenerate(xbodied, {}, step());

    }, function (xbodied) {

      ok(compare(xbodied.document, expected), 'xstencil reconstitute');

    });

    ok(compare(bodied.document, expected), 'stencil generate');

    step(function() {

      stencil.regenerate(bodied, {}, step());

    }, function (bodied) {

      ok(compare(bodied.document, expected), 'stencil regenerate');
      stencil.reconstitute(bodied.document, step());

    }, function (bodied) {

      stencil.regenerate(bodied, {}, step());

    }, function (bodied) {

      ok(compare(bodied.document, expected), 'stencil reconstitute');

    });
  });
});
