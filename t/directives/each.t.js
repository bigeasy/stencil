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

  step(function () {

    context.generate('fixtures/each.stencil', { watchers: watchers }, step());
    fixture('fixtures/each.xml', step());
    fixture('fixtures/each-reorder.xml', step());
    fixture('fixtures/each-removed.xml', step());

  }, function (actual, each, reorder, removed) {

    ok(compare(actual.document, each), 'generate');

    step(function () {

      context.reconstitute(actual.document, step());

    }, function (actual) {

      context.regenerate(actual, { watchers: watchers }, step());

    }, function (actual) {

      ok(compare(actual.document, each), 'regenerate');
      watchers.unshift(watchers.pop());
      context.regenerate(actual, { watchers: watchers }, step());

    }, function (actual) {

      ok(compare(actual.document, reorder), 'reordered');
      spliced = watchers.splice(1, 1);
      context.regenerate(actual, { watchers: watchers }, step());

    }, function (actual) {

      ok(compare(actual.document, removed), 'removed');
      watchers.splice(1, 0, spliced[0]);
      context.regenerate(actual, { watchers: watchers }, step());

    }, function (actual) {

      ok(compare(actual.document, reorder), 'reinserted');

    });
  });
});
