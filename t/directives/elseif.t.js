#!/usr/bin/env node

require('./proof')(5, function (step) {
  var context, fs = require('fs');

  step(function (stencil, resolver) {
    context = stencil.create(__dirname + '/', resolver.create());
    context.generate('fixtures/elseif.stencil', { value: 'a' }, step());
  },

  function (actual, fixture) {
    fixture('fixtures/elseif-a.xml', step());
  },

  function (a, actual, ok, compare) {
    ok(compare(actual.document, a), 'generate');
    context.reconstitute(actual.document, step());
  },

  function (actual) {
    context.regenerate(actual, { value: 'a' }, step());
  },

  function (actual, a, compare, ok) {
    ok(compare(actual.document, a), 'reconstitute');
    context.regenerate(actual, { value: 'b' }, step());
  },

  function (actual, fixture) {
    fixture('fixtures/elseif-b.xml', step());
  },

  function (b, actual, ok, compare) {
    ok(compare(actual.document, b), 'b');
    context.regenerate(actual, { value: 'c' }, step());
  },

  function (actual, fixture) {
    fixture('fixtures/elseif-c.xml', step());
  },

  function (c, actual, ok, compare) {
    ok(compare(actual.document, c), 'c');
    context.regenerate(actual, { value: 'a' }, step());
  },

  function (actual, a, ok, compare) {
    ok(compare(actual.document, a), 'a-after-scavenge');
  });
});
