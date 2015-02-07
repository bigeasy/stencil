#!/usr/bin/env node

require('./proof')(4, function (step, xstencil, _stencil, fixture, ok, compare) {
  var fs = require('fs');

  step(function () {

    xstencil.generate('fixtures/require.xstencil', { greeting: 'Hello, World!' }, step());
    _stencil.generate('fixtures/require.stencil', { greeting: 'Hello, World!' }, step());
    fixture('fixtures/require-generate.xml', step());
    fixture('fixtures/require-regenerate.xml', step());

  }, function (xrequire, require, generate, regenerate) {

    ok(compare(xrequire.document, generate), 'xstencil generate');

    step(function () {

      xstencil.reconstitute(xrequire.document, step());

    }, function (xrequire) {

      xstencil.regenerate(xrequire, { greeting: 'Hello, Nurse!' }, step());

    }, function (xrequire) {

      ok(compare(xrequire.document, regenerate), 'xstencil regenerate');

    });

    ok(compare(require.document, generate), 'xstencil generate');

    step(function () {

      _stencil.reconstitute(require.document, step());

    }, function (require) {

      _stencil.regenerate(require, { greeting: 'Hello, Nurse!' }, step());

    }, function (require) {

      ok(compare(require.document, regenerate), 'xstencil regenerate');

    });
  });
});
