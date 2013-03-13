#!/usr/bin/env node

require('./proof')(2, function (step, ok, compare, fixture) {
  var context, fs = require('fs');

  step(function (stencil, resolver) {
    context = stencil.create(__dirname + '/', resolver.create());
    context.generate('fixtures/resolver.stencil', {}, step());
    fixture('fixtures/resolver.xml', step());
  },

  function (actual, expected) {
    ok(compare(actual.document, expected), 'called');

    step(function () {
      context.reconstitute(actual.document, step());
    }, function (actual) {
      context.regenerate(actual, {}, step());
    }, function (actual) {
      ok(compare(actual.document, expected), 'called');
    });

  });
});
