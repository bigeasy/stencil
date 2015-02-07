#!/usr/bin/env node

var fs = require('fs');
require('./proof')(6, function (step, xstencil, _stencil, fixture, ok, compare) {

  step(function () {

    xstencil.generate('fixtures/directive.xstencil', { greeting: 'Hello, World!' }, step());
    _stencil.generate('fixtures/directive.stencil', { greeting: 'Hello, World!' }, step());
    fixture('fixtures/directive.xml', step());

  }, function (xdirective, directive, expected) {

    ok(compare(xdirective.document, expected), 'xstencil generate');

    step(function () {

      xstencil.regenerate(xdirective, { greeting: 'Hello, World!' }, step());

    }, function (xdirective) {

      ok(compare(xdirective.document, expected), 'xstencil regenerate');
      xstencil.reconstitute(xdirective.document, step());

    }, function (xdirective) {

      xstencil.regenerate(xdirective, { greeting: 'Hello, World!' }, step());

    }, function (xdirective) {

      ok(compare(xdirective.document, expected), 'xstencil reconstitute');
    });

    ok(compare(directive.document, expected), 'stencil generate');

    step(function () {

      _stencil.regenerate(directive, { greeting: 'Hello, World!' }, step());

    }, function (directive) {

      ok(compare(directive.document, expected), 'stencil regenerate');
      _stencil.reconstitute(directive.document, step());

    }, function (directive) {

      _stencil.regenerate(directive, { greeting: 'Hello, World!' }, step());

    }, function (directive) {

      ok(compare(directive.document, expected), 'stencil reconstitute');
    });
  });
});
