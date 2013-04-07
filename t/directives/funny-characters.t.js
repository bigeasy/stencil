#!/usr/bin/env node

require('./proof')(2, function (step, context, fixture, ok, compare) {
  var fs = require('fs');

  step(function () {

    context.generate('fixtures/funny-characters.stencil', { greeting: "Hello, World!" }, step());
    fixture('fixtures/funny-characters.xml', step());

  }, function (actual, expected) {

    ok(compare(actual.document, expected), 'generate');

    step(function() {

      context.reconstitute(actual.document, step());

    }, function (actual) {

      context.regenerate(actual, { greeting: "Hello, World!" }, step());

    }, function (actual) {

      ok(compare(actual.document, expected), 'reconstitute');

    });
  });
});
