#!/usr/bin/env node

require('./proof')(2, function (step, _stencil, fixture, ok, compare) {
  var fs = require('fs');

  step(function () {

    _stencil.generate('fixtures/strings.stencil', {}, step());
    fixture('fixtures/strings.xml', step());

  }, function (strings, expected) {

    ok(compare(strings.document, expected), 'generate');

    step(function() {

      _stencil.reconstitute(strings.document, step());

    }, function (strings) {

      _stencil.regenerate(strings, {}, step());

    }, function (strings) {

      ok(compare(strings.document, expected), 'reconstitute');

    });
  });
});
