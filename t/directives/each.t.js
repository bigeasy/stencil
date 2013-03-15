#!/usr/bin/env node

require('./proof')(5, function (step, context, fixture, ok, compare) {
  var spliced, fs = require('fs'), watchers =
  [
    {
      "login": "bigeasy",
      "url": "https://api.github.com/users/bigeasy",
      "id": 34673
    },
    {
      "login": "chadsmith",
      "url": "https://api.github.com/users/chadsmith",
      "id": 187174
    },
    {
      "login": "azampagl",
      "url": "https://api.github.com/users/azampagl",
      "id": 43206
    }
  ];

  step(function (stencil, resolver) {
    context.generate('fixtures/each.stencil', { watchers: watchers }, step());
  },

  function (actual) {
    fixture('fixtures/each.xml', step());
  },

  function (expected, actual) {
    ok(compare(actual.document, expected), 'generate');
    context.reconstitute(actual.document, step());
  },

  function (actual) {
    context.regenerate(actual, { watchers: watchers }, step());
  },

  function (actual, expected) {
    ok(compare(actual.document, expected), 'regenerate');
    watchers.unshift(watchers.pop());
    context.regenerate(actual, { watchers: watchers }, step());
  },

  function (actual) {
    fixture('fixtures/each-reorder.xml', step());
  },

  function (reorder, actual) {
    ok(compare(actual.document, reorder), 'reordered');
    spliced = watchers.splice(1, 1);
    context.regenerate(actual, { watchers: watchers }, step());
  },

  function (actual) {
    fixture('fixtures/each-removed.xml', step());
  },

  function (removed, actual) {
    ok(compare(actual.document, removed), 'removed');
    watchers.splice(1, 0, spliced[0]);
    context.regenerate(actual, { watchers: watchers }, step());
  },

  function (actual, reorder) {
    ok(compare(actual.document, reorder), 'reinserted');
  });
});
