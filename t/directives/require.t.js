#!/usr/bin/env node

require('./proof')(2, function (step, xstencil, fixture, ok, compare) {
  var fs = require('fs');

  step(function () {

    xstencil.generate('fixtures/require.xstencil', { greeting: "Hello, World!" }, step());
    fixture('fixtures/require-generate.xml', step());
    fixture('fixtures/require-regenerate.xml', step());

  }, function (xrequire, generate, regenerate) {

    ok(compare(xrequire.document, generate), 'xstencil generate');

    step(function () {

      xstencil.reconstitute(xrequire.document, step());

    }, function (xrequire) {

      xstencil.regenerate(xrequire, { greeting: "Hello, Nurse!" }, step());

    }, function (xrequire) {

      ok(compare(xrequire.document, regenerate), 'xstencil regenerate');

    });
  });
});
