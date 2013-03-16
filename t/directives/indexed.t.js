#!/usr/bin/env node

require('./proof')(3, function (step, context, fixture, ok, compare) {
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

    context.generate('fixtures/indexed.stencil', { watchers: watchers }, step());
    fixture('fixtures/each.xml', step());

  }, function (actual, expected) {

    ok(compare(actual.document, expected), 'generate');

    step(function () {

      context.reconstitute(actual.document, step());

    }, function (actual) {

      context.regenerate(actual, { watchers: watchers }, step());

    }, function (actual) {

      ok(compare(actual.document, expected), 'regenerate');
      watchers.unshift(watchers.pop());
      context.regenerate(actual, { watchers: watchers }, step());
      fixture('fixtures/each-reorder.xml', step());

    }, function (actual, expected) {

      ok(compare(actual.document, expected), 'reorder');

    });

  });
});
