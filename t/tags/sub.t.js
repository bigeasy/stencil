#!/usr/bin/env node

require('./proof')(6, function (step, xstencil, stencil, fixture, ok, compare) {
  var fs = require('fs');

  step(function () {
    xstencil.generate('fixtures/sub.xstencil', {}, step());
    stencil.generate('fixtures/sub.stencil', {}, step());
    fixture('fixtures/sub.xml', step());
  },

  function (xsub, sub, expected) {

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

    ok(compare(sub.document, expected), 'stencil generate');

    step(function () {
      stencil.regenerate(sub, {}, step());

    }, function (sub) {

      ok(compare(sub.document, expected), 'stencil regenerate');
      stencil.reconstitute(sub.document, step());

    }, function (sub) {

      stencil.regenerate(sub, {}, step());

    }, function (sub) {

      ok(compare(sub.document, expected), 'stencil reconstitute');

    });
  });
});
