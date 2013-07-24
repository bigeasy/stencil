#!/usr/bin/env node

require('./proof')(6, function (step, xstencil, stencil, fixture, ok, compare) {
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

    xstencil.generate('fixtures/indexed.xstencil', { watchers: watchers }, step());
    stencil.generate('fixtures/indexed.stencil', { watchers: watchers }, step());
    fixture('fixtures/each.xml', step());

  }, function (xindexed, indexed, expected) {

    var xwatchers = watchers.slice();

    ok(compare(xindexed.document, expected), 'xstencil generate');

    step(function () {

      xstencil.reconstitute(xindexed.document, step());

    }, function (xindexed) {

      xstencil.regenerate(xindexed, { watchers: watchers }, step());

    }, function (xindexed) {

      ok(compare(xindexed.document, expected), 'xstencil regenerate');
      xwatchers.unshift(xwatchers.pop());
      xstencil.regenerate(xindexed, { watchers: xwatchers }, step());
      fixture('fixtures/each-reorder.xml', step());

    }, function (xindexed, expected) {

      ok(compare(xindexed.document, expected), 'xstencil reorder');

    });

    ok(compare(indexed.document, expected), 'stencil generate');

    step(function () {

      stencil.reconstitute(indexed.document, step());

    }, function (indexed) {

      stencil.regenerate(indexed, { watchers: watchers }, step());

    }, function (indexed) {

      ok(compare(indexed.document, expected), 'stencil regenerate');
      watchers.unshift(watchers.pop());
      stencil.regenerate(indexed, { watchers: xwatchers }, step());
      fixture('fixtures/each-reorder.xml', step());

    }, function (indexed, expected) {

      ok(compare(indexed.document, expected), 'stencil reorder');

    });
  });
});
