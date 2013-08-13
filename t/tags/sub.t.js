#!/usr/bin/env node

var fs = require('fs');
require('./proof')(3, function (step, xstencil, fixture, ok, compare) {

  step(function () {
    xstencil.generate('fixtures/sub.xstencil', {}, step());
    fixture('fixtures/sub.xml', step());
  },

  function (xsub, expected) {

    ok(compare(xsub.document, expected), 'generate');

    step(function () {
      xstencil.regenerate(xsub, {}, step());

    }, function (xsub) {

      ok(compare(xsub.document, expected), 'regenerate');
      xstencil.reconstitute(xsub.document, step());

    }, function (xsub) {

      xstencil.regenerate(xsub, {}, step());

    }, function (xsub) {

      ok(compare(xsub.document, expected), 'reconstitute');

    });
  });
});
