#!/usr/bin/env node

var context, fs = require('fs');
require('./proof')(3, function (step, ok, compare) {

  step(function (stencil, resolver) {
    context = stencil.create(__dirname + '/', resolver.create());
    context.generate('fixtures/directive.stencil', { greeting: "Hello, World!" }, step());
  },
  
  function (actual, fixture) {
    fixture('fixtures/directive.xml', step());
  },
  
  function (expected, actual, ok, compare) {
    ok(compare(actual.document, expected), 'generate');
    context.regenerate(actual, { greeting: "Hello, World!" }, step());
  }, 

  function (actual, expected, ok, compare) {
    ok(compare(actual.document, expected), 'regenerate');
    context.reconstitute(actual.document, step());
  },
  
  function (actual) {
    context.regenerate(actual, { greeting: "Hello, World!" }, step());
  },

  function (actual, expected, ok, compare) {
    ok(compare(actual.document, expected), 'reconstitute');
  });
});
