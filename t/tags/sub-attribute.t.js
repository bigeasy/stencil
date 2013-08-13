#!/usr/bin/env node

// Not only does this test test sub-attributes, it also illustrates a bodied
// sub-tag as well as re-entering the caller's scope.

var fs = require('fs');
require('./proof')(3, function (step, xstencil, fixture, ok, compare) {

  step(function () {

    xstencil.generate('fixtures/sub-attribute.xstencil', {}, step());
    fixture('fixtures/sub-attribute.xml', step());

  }, function (xsub, expected) {

    ok(compare(xsub.document, expected), 'xstencil generate');

    step(function () {

      xstencil.regenerate(xsub, {}, step());

    }, function (xsub) {

      ok(compare(xsub.document, expected), 'xstencil regenerate');
      xstencil.reconstitute(xsub.document, step());

    }, function (xsub) {

      xstencil.regenerate(xsub, {}, step());

    }, function (xsub) {

      ok(compare(xsub.document, expected), 'xstencil reconstitute');

    });
  });
});
