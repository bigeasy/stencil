#!/usr/bin/env node

require('./proof')(5, function (step, xstencil, fixture, ok, compare) {
  var fs = require('fs');

  step(function () {

    xstencil.generate('fixtures/else.xstencil', { value: true }, step());
    fixture('fixtures/else-true.xml', step());
    fixture('fixtures/else-false.xml', step());

  }, function (xelse, truthy, falsey) {

    ok(compare(xelse.document, truthy), 'generate');

    step(function () {

      xstencil.reconstitute(xelse.document, step());

    }, function (xelse) {

      xstencil.regenerate(xelse, { value: true }, step());

    }, function (xelse) {

      ok(compare(xelse.document, truthy), 'reconstitute');
      xstencil.regenerate(xelse, { value: false }, step());

    }, function (xelse) {

      ok(compare(xelse.document, falsey), 'false');
      xstencil.regenerate(xelse, { value: true }, step());

    }, function (xelse) {
      ok(compare(xelse.document, truthy), 'true-scavenge');
      xstencil.regenerate(xelse, { value: false }, step());

    }, function (xelse) {

      ok(compare(xelse.document, falsey), 'false-after-scavenge');

    });
  });
});
