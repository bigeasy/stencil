#!/usr/bin/env node

require('./proof')(10, function (step, xstencil, stencil, fixture, ok, compare) {
  var fs = require('fs');

  step(function () {

    xstencil.generate('fixtures/if.xstencil', { value: true }, step());
    stencil.generate('fixtures/if.stencil', { value: true }, step());
    fixture('fixtures/if-true.xml', step());
    fixture('fixtures/if-false.xml', step());

  }, function (xif, _if, truthy, falsey) {

    ok(compare(xif.document, truthy), 'generate');

    step(function() {

      xstencil.reconstitute(xif.document, step());

    }, function (xif) {

      xstencil.regenerate(xif, { value: true }, step());

    }, function (xif) {

      ok(compare(xif.document, truthy), 'reconstitute');
      xstencil.regenerate(xif, { value: false }, step());

    }, function (xif) {

      ok(compare(xif.document, falsey), 'false');
      xstencil.regenerate(xif, { value: true }, step());

    }, function (xif) {

      ok(compare(xif.document, truthy), 'true-scavenge');
      xstencil.regenerate(xif, { value: false }, step());

    }, function (xif) {

      ok(compare(xif.document, falsey), 'false-after-scavenge');

    });

    ok(compare(_if.document, truthy), 'generate');

    step(function() {

      stencil.reconstitute(_if.document, step());

    }, function (_if) {

      stencil.regenerate(_if, { value: true }, step());

    }, function (_if) {

      ok(compare(_if.document, truthy), 'reconstitute');
      stencil.regenerate(_if, { value: false }, step());

    }, function (_if) {

      ok(compare(_if.document, falsey), 'false');
      stencil.regenerate(_if, { value: true }, step());

    }, function (_if) {

      ok(compare(_if.document, truthy), 'true-scavenge');
      stencil.regenerate(_if, { value: false }, step());

    }, function (_if) {

      ok(compare(_if.document, falsey), 'false-after-scavenge');

    });
  });
});
