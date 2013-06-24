#!/usr/bin/env node

var fs = require('fs'), object = {
  items: [{ value: 1 }, { value: 2 }]
};
require('./proof')(3, function (step, context, fixture, ok, compare) {

  step(function () {

    context.generate('fixtures/evaluated.stencil', object, step());
    fixture('fixtures/evaluated.xml', step());

  }, function (actual, expected) {

    ok(compare(actual.document, expected), 'generate');

    step(function() {

      context.regenerate(actual, object, step());

    }, function (actual) {

      ok(compare(actual.document, expected), 'regenerate');
      context.reconstitute(actual.document, step());

    }, function (actual) {

      context.regenerate(actual, object, step());

    }, function (actual) {

      ok(compare(actual.document, expected), 'reconstitute');

    });
  });
});
