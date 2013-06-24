#!/usr/bin/env node

require('../..');
require('./proof')(3, function (step, context, fixture, ok, compare) {
  var fs = require('fs');
  var tree = {
    directory: {
      name: "/",
      children: [{
        name: 'etc',
        children: [{
          name: 'passwd'
        }]
      }, {
        name: 'var',
        children: [{
          name: 'log',
          children: [{ name: 'messages' }, { name: 'mail' }]
        }, {
          name: 'lib',
          children: [{ name: 'pgsql' }]
        }]
      }]
    }
  }

  step(function () {

    context.generate('fixtures/recurse.stencil', tree, step());
    fixture('fixtures/recurse.xml', step());

  }, function (actual, expected) {

    console.log(actual.document + "");
    ok(compare(actual.document, expected), 'generate');

    step(function() {

      context.regenerate(actual, tree, step());

    }, function (actual) {

      ok(compare(actual.document, expected), 'regenerate');
      context.reconstitute(actual.document, step());

    }, function (actual) {

      context.regenerate(actual, tree, step());

    }, function (actual) {

      ok(compare(actual.document, expected), 'reconstitute');

    });
  });
});
