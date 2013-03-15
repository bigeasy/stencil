#!/usr/bin/env node

var fs = require('fs');
require('./proof')(3, function (step, context, ok, compare) {

  step(function (stencil, resolver) {
    context.generate('fixtures/minimal.stencil', {}, step());
  },

  function (actual, fixture) {
    fixture('fixtures/minimal.xml', step());
  },

  function (expected, actual, ok, compare) {
    ok(compare(actual.document, expected), 'generate');
    context.regenerate(actual, {}, step());
  }, 

  function (actual, expected, ok, compare) {
    ok(compare(actual.document, expected), 'regenerate');
    context.reconstitute(actual.document, step());
  },
  
  function (actual) {
    context.regenerate(actual, {}, step());
  },

  function (actual, expected, ok, compare) {
    ok(compare(actual.document, expected), 'reconstitute');
  });
});
