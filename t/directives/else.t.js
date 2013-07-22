#!/usr/bin/env node

require('./proof')(10, function (step, xstencil, stencil, fixture, ok, compare) {
  var fs = require('fs');

  step(function () {

    xstencil.generate('fixtures/else.xstencil', { value: true }, step());
    stencil.generate('fixtures/else.stencil', { value: true }, step());
    fixture('fixtures/else-true.xml', step());
    fixture('fixtures/else-false.xml', step());

  }, function (xelse, _else, truthy, falsey) {

    ok(compare(xelse.document, truthy), 'xstencil generate');

    step(function () {

      xstencil.reconstitute(xelse.document, step());

    }, function (xelse) {

      xstencil.regenerate(xelse, { value: true }, step());

    }, function (xelse) {

      ok(compare(xelse.document, truthy), 'xstencil reconstitute');
      xstencil.regenerate(xelse, { value: false }, step());

    }, function (xelse) {

      ok(compare(xelse.document, falsey), 'xstencil false');
      xstencil.regenerate(xelse, { value: true }, step());

    }, function (xelse) {
      ok(compare(xelse.document, truthy), 'xstencil true-scavenge');
      xstencil.regenerate(xelse, { value: false }, step());

    }, function (xelse) {

      ok(compare(xelse.document, falsey), 'xstencil false-after-scavenge');

    });

    ok(compare(_else.document, truthy), 'stencil generate');

    step(function () {

      stencil.reconstitute(_else.document, step());

    }, function (_else) {

      stencil.regenerate(_else, { value: true }, step());

    }, function (_else) {

      ok(compare(_else.document, truthy), 'stencil reconstitute');
      stencil.regenerate(_else, { value: false }, step());

    }, function (_else) {

      ok(compare(_else.document, falsey), 'stencil false');
      stencil.regenerate(_else, { value: true }, step());

    }, function (_else) {
      ok(compare(_else.document, truthy), 'stencil true-scavenge');
      stencil.regenerate(_else, { value: false }, step());

    }, function (_else) {

      ok(compare(_else.document, falsey), 'stencil false-after-scavenge');

    });
  });
});
