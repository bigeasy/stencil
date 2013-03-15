#!/usr/bin/env node

require('./proof')(5, function (step, context) {
  var fs = require('fs');

  step(function (stencil, resolver) {
    context.generate('fixtures/else.stencil', { value: true }, step());
  },

  function (actual, fixture) {
    fixture('fixtures/else-true.xml', step());
  },

  function (truthy, actual, ok, compare) {
    ok(compare(actual.document, truthy), 'generate');
    context.reconstitute(actual.document, step());
  },

  function (actual) {
    context.regenerate(actual, { value: true }, step());
  },

  function (actual, truthy, compare, ok) {
    ok(compare(actual.document, truthy), 'reconstitute');
    context.regenerate(actual, { value: false }, step());
  },

  function (actual, fixture) {
    fixture('fixtures/else-false.xml', step());
  },

  function (falsey, actual, ok, compare) {
    ok(compare(actual.document, falsey), 'false');
    context.regenerate(actual, { value: true }, step());
  },

  function (actual, truthy, ok, compare) {
    ok(compare(actual.document, truthy), 'true-scavenge');
    context.regenerate(actual, { value: false }, step());
  },

  function (actual, falsey, ok, compare) {
    ok(compare(actual.document, falsey), 'false-after-scavenge');
  });
});
