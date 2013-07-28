#!/usr/bin/env node

require('./proof')(2, function (step, xstencil, fixture, ok, compare) {
  var fs = require('fs');

  step(function () {

    xstencil.generate('fixtures/funny-characters.stencil', { greeting: "Hello, World!" }, step());
    fixture('fixtures/funny-characters.xml', step());

  }, function (actual, expected) {

    ok(compare(actual.document, expected), 'generate');

    step(function() {

      xstencil.reconstitute(actual.document, step());

    }, function (actual) {

      xstencil.regenerate(actual, { greeting: "Hello, World!" }, step());

    }, function (actual) {

      ok(compare(actual.document, expected), 'reconstitute');

    });
  });
});
