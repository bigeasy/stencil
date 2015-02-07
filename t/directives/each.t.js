#!/usr/bin/env node

require('./proof')(10, function (step, xstencil, _stencil, fixture, ok, compare) {
  var spliced, fs = require('fs'), watchers =
  [
    {
      'login': 'bigeasy',
      'url': 'https://api.github.com/users/bigeasy',
      'id': 34673
    },
    {
      'login': 'chadsmith',
      'url': 'https://api.github.com/users/chadsmith',
      'id': 187174
    },
    {
      'login': 'azampagl',
      'url': 'https://api.github.com/users/azampagl',
      'id': 43206
    }
  ];

  step(function () {

    xstencil.generate('fixtures/each.xstencil', { watchers: watchers }, step());
    _stencil.generate('fixtures/each.stencil', { watchers: watchers }, step());
    fixture('fixtures/each.xml', step());
    fixture('fixtures/each-reorder.xml', step());
    fixture('fixtures/each-removed.xml', step());

  }, function (xeach, each, first, reorder, removed) {

    ok(compare(xeach.document, first), 'xstencil generate');

    var xwatchers = watchers.slice(), xspliced

    step(function () {

      xstencil.reconstitute(xeach.document, step());

    }, function (xeach) {

      xstencil.regenerate(xeach, { watchers: xwatchers }, step());

    }, function (xeach) {

      ok(compare(xeach.document, first), 'xstencil regenerate');
      xwatchers.unshift(xwatchers.pop());
      xstencil.regenerate(xeach, { watchers: xwatchers }, step());

    }, function (xeach) {

      ok(compare(xeach.document, reorder), 'xstencil reordered');
      xspliced = xwatchers.splice(1, 1);
      xstencil.regenerate(xeach, { watchers: xwatchers }, step());

    }, function (xeach) {

      ok(compare(xeach.document, removed), 'xstencil removed');
      xwatchers.splice(1, 0, xspliced[0]);
      xstencil.regenerate(xeach, { watchers: xwatchers }, step());

    }, function (xeach) {

      ok(compare(xeach.document, reorder), 'xstencil reinserted');

    });

    ok(compare(each.document, first), 'stencil generate');

    step(function () {

      _stencil.reconstitute(each.document, step());

    }, function (each) {

      _stencil.regenerate(each, { watchers: watchers }, step());

    }, function (each) {

      ok(compare(each.document, first), 'stencil regenerate');
      watchers.unshift(watchers.pop());
      _stencil.regenerate(each, { watchers: watchers }, step());

    }, function (each) {

      ok(compare(each.document, reorder), 'stencil reordered');
      spliced = watchers.splice(1, 1);
      _stencil.regenerate(each, { watchers: watchers }, step());

    }, function (each) {

      ok(compare(each.document, removed), 'stencil removed');
      watchers.splice(1, 0, spliced[0]);
      _stencil.regenerate(each, { watchers: watchers }, step());

    }, function (each) {

      ok(compare(each.document, reorder), 'stencil reinserted');

    });
  });
});
