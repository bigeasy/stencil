#!/usr/bin/env node

require('./proof')(5, function (step, xstencil, fixture, ok, compare) {
  var fs = require('fs');

  step(function () {

    xstencil.generate('fixtures/if.xstencil', { value: true }, step());
    fixture('fixtures/if-true.xml', step());
    fixture('fixtures/if-false.xml', step());

  }, function (actual, truthy, falsey) {

    ok(compare(actual.document, truthy), 'generate');

    step(function() {

      xstencil.reconstitute(actual.document, step());

    }, function (actual) {

      xstencil.regenerate(actual, { value: true }, step());

    }, function (actual) {

      ok(compare(actual.document, truthy), 'reconstitute');
      xstencil.regenerate(actual, { value: false }, step());

    }, function (actual) {

      ok(compare(actual.document, falsey), 'false');
      xstencil.regenerate(actual, { value: true }, step());

    }, function (actual) {

      ok(compare(actual.document, truthy), 'true-scavenge');
      xstencil.regenerate(actual, { value: false }, step());

    }, function (actual) {

      ok(compare(actual.document, falsey), 'false-after-scavenge');

    });
  });
});
