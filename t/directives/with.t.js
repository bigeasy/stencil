#!/usr/bin/env node

require('./proof')(2, function (step, context, fixture, ok, compare) {
  var fs = require('fs');

  step(function () {

    context.generate('fixtures/with.stencil', {
      person: { firstName: "Fred", lastName: "Flintstone" } }, step());
    fixture('fixtures/with-generate.xml', step());
    fixture('fixtures/with-update.xml', step());

  }, function (actual, generate, regenerate) {

    step(function () {

      ok(compare(actual.document, generate), 'generate');
      context.regenerate(actual, {
        person: { firstName: "Barney", lastName: "Rubble" } }, step());

    }, function (actual) {

      ok(compare(actual.document, regenerate), 'regenerate');

    });
  });
});
