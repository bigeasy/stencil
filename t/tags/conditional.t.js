#!/usr/bin/env node

var fs = require('fs');
require('./proof')(4, function (step, context, fixture, ok, compare) {

  step(function () {

    context.generate('fixtures/conditional.stencil', { greeting: "Hello, World!" }, step());
    fixture('fixtures/conditional-true.xml', step());
    fixture('fixtures/conditional-false.xml', step());

  }, function (actual, truthy, falsey) {

    ok(compare(actual.document, truthy), 'true');

    step(function () {

      context.regenerate(actual, {}, step());

    }, function (actual) {

      ok(compare(actual.document, falsey), 'false');
      context.regenerate(actual, { greeting: "Hello, World!" }, step());

    }, function (actual) {

      ok(compare(actual.document, truthy), 'regenerating');
      context.reconstitute(actual.document, step());

    }, function (actual) {

      context.regenerate(actual, { greeting: "Hello, World!" }, step());

    }, function (actual) {

      ok(compare(actual.document, truthy), 'regenerating');

    });
  });
});
