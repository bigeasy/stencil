#!/usr/bin/env node

var context, fs = require('fs');
require('./proof')(5, function (async) {
  async(function (stencil, resolver) {
    context = stencil.create(__dirname + '/', resolver.create());
    context.generate('fixtures/elseif.stencil', { value: 'a' }, async());
  },
  
  function (actual, fixture) {
    fixture('fixtures/elseif-a.xml', async());
  },
  
  function (a, actual, ok, compare) {
    ok(compare(actual.document, a), 'generate');
    context.reconstitute(actual.document, async());
  },
  
  function (actual) {
    context.regenerate(actual, { value: 'a' }, async());
  },

  function (actual, a, compare, ok) {
    ok(compare(actual.document, a), 'reconstitute');
    context.regenerate(actual, { value: 'b' }, async());
  },

  function (actual, fixture) {
    fixture('fixtures/elseif-b.xml', async());
  },

  function (b, actual, ok, compare) {
    ok(compare(actual.document, b), 'b');
    context.regenerate(actual, { value: 'c' }, async());
  },

  function (actual, fixture) {
    fixture('fixtures/elseif-c.xml', async());
  },
  
  function (c, actual, ok, compare) {
    ok(compare(actual.document, c), 'c');
    context.regenerate(actual, { value: 'a' }, async());
  },

  function (actual, a, ok, compare) {
    ok(compare(actual.document, a), 'a-after-scavenge');
  });
});
