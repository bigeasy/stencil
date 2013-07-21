#!/usr/bin/env node

require('./proof')(2, function (step, stencil, xstencil, fixture, ok, compare) {
  var fs = require('fs');

  step(function () {

    xstencil.generate('fixtures/html.xml', {
      greeting: "Hello, <br/><a href='index.html'><em>World</em></a>!"
    }, step());
    fixture('fixtures/html-generate.xml', step());
    fixture('fixtures/html-update.xml', step());

  }, function (actual, generate, regenerate) {

    ok(compare(actual.document, generate), 'generate');

    step(function () {

      xstencil.reconstitute(actual.document, step());

    }, function (actual) {

      xstencil.regenerate(actual, { greeting: "Hello, Nurse!" }, step());

    }, function (actual) {

      ok(compare(actual.document, regenerate), 'regenerate');

    });
  });
});
