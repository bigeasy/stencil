#!/usr/bin/env node

require('./proof')(5, function (step) {
  var context, fs = require('fs');

  step(function (stencil, resolver) {
    context = stencil.create(__dirname + '/', resolver.create());
    context.generate('fixtures/if.stencil', { value: true }, step());
  },

  function (actual, fixture) {
    fixture('fixtures/if-true.xml', step());
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
    fixture('fixtures/if-false.xml', step());
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
