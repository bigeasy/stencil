#!/usr/bin/env node

require('./proof')(2, function (step, context, fixture, ok, compare) {
  var fs = require('fs');

  step(function () {

    context.generate('fixtures/html.stencil', {
      greeting: "Hello, <br/><a href='index.html'><em>World</em></a>!"
    }, step());
    fixture('fixtures/html-generate.xml', step());
    fixture('fixtures/html-update.xml', step());

  }, function (actual, generate, regenerate) {

    ok(compare(actual.document, generate), 'generate');

    step(function () {

      context.reconstitute(actual.document, step());

    }, function (actual) {

      context.regenerate(actual, { greeting: "Hello, Nurse!" }, step());

    }, function (actual) {

      ok(compare(actual.document, regenerate), 'regenerate');

    });
  });
});
