#!/usr/bin/env node

var fs = require('fs');
require('./proof')(3, function (step, context, fixture, ok, compare) {

  step(function () {

    context.generate('fixtures/minimal.stencil', {}, step());
    fixture('fixtures/minimal.xml', step());

  }, function (actual, expected) {

    ok(compare(actual.document, expected), 'generate');

    step(function() {

      context.regenerate(actual, {}, step());

    }, function (actual) {

      ok(compare(actual.document, expected), 'regenerate');
      context.reconstitute(actual.document, step());

    }, function (actual) {

      context.regenerate(actual, {}, step());

    }, function (actual) {

      ok(compare(actual.document, expected), 'reconstitute');

    });
  });
});
