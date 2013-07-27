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
require('./proof')(3, function (step, xstencil, fixture, ok, compare) {
  var fs = require('fs');

  step(function (stencil, resolver) {

    xstencil.generate('fixtures/recurse.xstencil', tree, step());
    fixture('fixtures/recurse-generate.xml', step());
    fixture('fixtures/recurse-regenerate.xml', step());

  }, function (xrecurse, generate, regenerate) {

    ok(compare(xrecurse.document, generate), 'generate');

    step(function () {

      xstencil.reconstitute(xrecurse.document, step());

    }, function (xrecurse) {

      xstencil.regenerate(xrecurse, tree, step());

    }, function (xrecurse) {

      ok(compare(xrecurse.document, generate), 'reconstitute');
      xstencil.regenerate(xrecurse, retree, step());

    }, function (xrecurse) {

      ok(compare(xrecurse.document, regenerate), 'regenerate');

    });
  });
});
