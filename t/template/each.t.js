#!/usr/bin/env node

var context, fs = require('fs'), watchers = 
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
require('./proof')(2, function (async) {
  async(function (stencil, resolver) {
    context = stencil.create(__dirname + '/', resolver.create());
    context.generate('fixtures/each.stencil', { watchers: watchers }, async());
  },
  
  function (actual, fixture) {
    fixture('fixtures/each.xml', async());
  },

  function (expected, actual, ok, compare) {
    ok(compare(actual.document, expected), 'generate');
    context.reconstitute(actual.document, async());
  },
  
  function (actual) {
    context.regenerate(actual, { watchers: watchers }, async());
  },
  
  function (actual, expected, ok, compare) {
    ok(compare(actual.document, expected), 'regenerate');
  });
});
