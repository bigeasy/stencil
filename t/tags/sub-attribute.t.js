#!/usr/bin/env node

// Not only does this test test sub-attributes, it also illustrates a bodied
// sub-tag as well as re-entering the caller's scope.

var fs = require('fs');
require('./proof')(3, function (step, context, fixture, ok, compare) {

  step(function (stencil, resolver) {

    context.generate('fixtures/sub-attribute.stencil', {}, step());
    fixture('fixtures/sub-attribute.xml', step());

  }, function (actual, expected) {

    ok(compare(actual.document, expected), 'generate');

    step(function () {

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
