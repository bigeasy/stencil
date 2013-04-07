#!/usr/bin/env node

require('./proof')(5, function (step, context, fixture, ok, compare) {
  var fs = require('fs');

  step(function (stencil, resolver) {

    context.generate('fixtures/else.stencil', { value: true }, step());
    fixture('fixtures/else-true.xml', step());
    fixture('fixtures/else-false.xml', step());

  }, function (actual, truthy, falsey) {

    ok(compare(actual.document, truthy), 'generate');

    step(function () {

      context.reconstitute(actual.document, step());

    }, function (actual) {

      context.regenerate(actual, { value: true }, step());

    }, function (actual) {

      ok(compare(actual.document, truthy), 'reconstitute');
      context.regenerate(actual, { value: false }, step());

    }, function (actual) {

      ok(compare(actual.document, falsey), 'false');
      context.regenerate(actual, { value: true }, step());

    }, function (actual) {
      ok(compare(actual.document, truthy), 'true-scavenge');
      context.regenerate(actual, { value: false }, step());

    }, function (actual) {

      ok(compare(actual.document, falsey), 'false-after-scavenge');

    });
  });
});
