#!/usr/bin/env node

var fs = require('fs');
require('./proof')(4, function (step, context, ok, compare) {

  step(function (stencil, resolver) {
    context.generate('fixtures/conditional.stencil', { greeting: "Hello, World!" }, step());
  },

  function (actual, fixture) {
    fixture('fixtures/conditional-true.xml', step());
  },

  function (truthy, actual, ok, compare) {
    ok(compare(actual.document, truthy), 'true');
    context.regenerate(actual, {}, step());
  },

  function (actual, fixture) {
    fixture('fixtures/conditional-false.xml', step());
  },

  function (falsey, actual, ok, compare) {
    ok(compare(actual.document, falsey), 'false');
    context.regenerate(actual, { greeting: "Hello, World!" }, step());
  },

  function (actual, truthy, ok, compare) {
    ok(compare(actual.document, truthy), 'regenerating');
    context.reconstitute(actual.document, step());
  },

  function (actual) {
    context.regenerate(actual, { greeting: "Hello, World!" }, step());
  },

  function (actual, truthy, ok, compare) {
    ok(compare(actual.document, truthy), 'regenerating');
  });
});
