#!/usr/bin/env node

var fs = require('fs');
require('./proof')(6, function (step, xstencil, stencil, fixture, ok, compare) {

  step(function () {

    xstencil.generate('fixtures/directive.xstencil', { greeting: "Hello, World!" }, step());
    stencil.generate('fixtures/directive.stencil', { greeting: "Hello, World!" }, step());
    fixture('fixtures/directive.xml', step());

  }, function (xdirective, directive, expected) {

    ok(compare(xdirective.document, expected), 'xstencil generate');

    step(function () {

      xstencil.regenerate(xdirective, { greeting: "Hello, World!" }, step());

    }, function (xdirective) {

      ok(compare(xdirective.document, expected), 'xstencil regenerate');
      xstencil.reconstitute(xdirective.document, step());

    }, function (xdirective) {

      xstencil.regenerate(xdirective, { greeting: "Hello, World!" }, step());

    }, function (xdirective) {

      ok(compare(xdirective.document, expected), 'xstencil reconstitute');
    });

    ok(compare(directive.document, expected), 'stencil generate');

    step(function () {

      stencil.regenerate(directive, { greeting: "Hello, World!" }, step());

    }, function (directive) {

      ok(compare(directive.document, expected), 'stencil regenerate');
      stencil.reconstitute(directive.document, step());

    }, function (directive) {

      stencil.regenerate(directive, { greeting: "Hello, World!" }, step());

    }, function (directive) {

      ok(compare(directive.document, expected), 'stencil reconstitute');
    });
  });
});
