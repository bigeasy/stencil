#!/usr/bin/env node

require('./proof')(4, function (step, xstencil, _stencil, fixture, ok, compare) {
  var fs = require('fs');

  step(function () {

    xstencil.generate('fixtures/with.xstencil', {
      person: { firstName: "Fred", lastName: "Flintstone" } }, step());
    _stencil.generate('fixtures/with.stencil', {
      person: { firstName: "Fred", lastName: "Flintstone" } }, step());
    fixture('fixtures/with-generate.xml', step());
    fixture('fixtures/with-update.xml', step());

  }, function (xwith, _with, generate, regenerate) {

    ok(compare(xwith.document, generate), 'xstencil generate');

    step(function () {
      xstencil.regenerate(xwith, {
        person: { firstName: "Barney", lastName: "Rubble" } }, step());

    }, function (xwith) {

      ok(compare(xwith.document, regenerate), 'xstencil regenerate');

    });

    ok(compare(_with.document, generate), 'stencil generate');

    step(function () {
      _stencil.regenerate(_with, {
        person: { firstName: "Barney", lastName: "Rubble" } }, step());

    }, function (_with) {

      ok(compare(_with.document, regenerate), 'stencil regenerate');

    });
  });
});
