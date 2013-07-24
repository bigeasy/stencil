#!/usr/bin/env node

require('./proof')(2, function (step, stencil, fixture, ok, compare) {
  var fs = require('fs');

  step(function () {

    stencil.generate('fixtures/strings.stencil', {}, step());
    fixture('fixtures/strings.xml', step());

  }, function (strings, expected) {

    ok(compare(strings.document, expected), 'generate');

    step(function() {

      stencil.reconstitute(strings.document, step());

    }, function (strings) {

      stencil.regenerate(strings, {}, step());

    }, function (strings) {

      ok(compare(strings.document, expected), 'reconstitute');

    });
  });
});
