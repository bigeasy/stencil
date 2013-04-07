#!/usr/bin/env node

require('./proof')(5, function (step, context, fixture, ok, compare) {
  var fs = require('fs');

  step(function () {

    context.generate('fixtures/elseif.stencil', { value: 'a' }, step());
    fixture('fixtures/elseif-a.xml', step());
    fixture('fixtures/elseif-b.xml', step());
    fixture('fixtures/elseif-c.xml', step());

  }, function (actual, a, b, c) {

    ok(compare(actual.document, a), 'generate');

    step(function () {

      context.reconstitute(actual.document, step());

    }, function (actual) {

      context.regenerate(actual, { value: 'a' }, step());

    }, function (actual) {

      ok(compare(actual.document, a), 'reconstitute');
      context.regenerate(actual, { value: 'b' }, step());

    }, function (actual) {

      ok(compare(actual.document, b), 'b');
      context.regenerate(actual, { value: 'c' }, step());

    }, function (actual) {

      ok(compare(actual.document, c), 'c');
      context.regenerate(actual, { value: 'a' }, step());

    }, function (actual) {

      ok(compare(actual.document, a), 'a-after-scavenge');

    });
  });
});
