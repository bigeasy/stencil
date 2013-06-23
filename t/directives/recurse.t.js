#!/usr/bin/env node

var tree = {
  directory: [{
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
var retree = {
  directory: [{
    name: 'etc',
    children: [{
      name: 'passwd'
    }]
  }, {
    name: 'var',
    children: [{
      name: 'log',
      children: [{ name: 'mail' }, { name: 'messages' }]
    }, {
      name: 'lib',
      children: [{ name: 'pgsql' }]
    }]
  }, {
    name: 'home',
    children: [{ name: 'alan' }]
  }]
}
require('./proof')(3, function (step, context, fixture, ok, compare) {
  var fs = require('fs');

  step(function (stencil, resolver) {

    context.generate('fixtures/recurse.stencil', tree, step());
    fixture('fixtures/recurse-generate.xml', step());
    fixture('fixtures/recurse-regenerate.xml', step());

  }, function (actual, generate, regenerate) {

    ok(compare(actual.document, generate), 'generate');

    step(function () {

      context.reconstitute(actual.document, step());

    }, function (actual) {

      context.regenerate(actual, tree, step());

    }, function (actual) {

      ok(compare(actual.document, generate), 'reconstitute');
      context.regenerate(actual, retree, step());

    }, function (actual) {

      ok(compare(actual.document, regenerate), 'regenerate');

    });
  });
});
