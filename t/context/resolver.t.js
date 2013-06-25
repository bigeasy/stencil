#!/usr/bin/env node

require('./proof')(2, function (step, context, ok, compare, fixture) {
  var fs = require('fs'), json = require('../../json/file').create(__dirname);

  step(function (stencil, resolver) {
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
