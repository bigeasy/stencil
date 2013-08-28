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
require('./proof')(6, function (step, xstencil, _stencil, fixture, ok, compare) {
  var fs = require('fs');

  step(function () {

    xstencil.generate('fixtures/recurse.xstencil', tree, step());
    _stencil.generate('fixtures/recurse.stencil', tree, step());
    fixture('fixtures/recurse-generate.xml', step());
    fixture('fixtures/recurse-regenerate.xml', step());

  }, function (xrecurse, recurse, generate, regenerate) {

    ok(compare(xrecurse.document, generate), 'xstencil generate');

    step(function () {

      xstencil.reconstitute(xrecurse.document, step());

    }, function (xrecurse) {

      xstencil.regenerate(xrecurse, tree, step());

    }, function (xrecurse) {

      ok(compare(xrecurse.document, generate), 'xstencil reconstitute');
      xstencil.regenerate(xrecurse, retree, step());

    }, function (xrecurse) {

      ok(compare(xrecurse.document, regenerate), 'xstencil regenerate');

    });

    ok(compare(recurse.document, generate), 'stencil generate');

    step(function () {

      _stencil.reconstitute(recurse.document, step());

    }, function (recurse) {

      _stencil.regenerate(recurse, tree, step());

    }, function (recurse) {

      ok(compare(recurse.document, generate), 'stencil reconstitute');
      _stencil.regenerate(recurse, retree, step());

    }, function (recurse) {

      ok(compare(recurse.document, regenerate), 'stencil regenerate');

    });
  });
});
