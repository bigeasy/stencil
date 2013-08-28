#!/usr/bin/env node

require('./proof')(10, function (step, xstencil, _stencil, fixture, ok, compare) {
  var fs = require('fs');

  step(function () {

    xstencil.generate('fixtures/elseif.xstencil', { value: 'a' }, step());
    _stencil.generate('fixtures/elseif.stencil', { value: 'a' }, step());
    fixture('fixtures/elseif-a.xml', step());
    fixture('fixtures/elseif-b.xml', step());
    fixture('fixtures/elseif-c.xml', step());

  }, function (xelseif, elseif, a, b, c) {

    ok(compare(xelseif.document, a), 'xstencil generate');

    step(function () {

      xstencil.reconstitute(xelseif.document, step());

    }, function (xelseif) {

      xstencil.regenerate(xelseif, { value: 'a' }, step());

    }, function (xelseif) {

      ok(compare(xelseif.document, a), 'xstencil reconstitute');
      xstencil.regenerate(xelseif, { value: 'b' }, step());

    }, function (xelseif) {

      ok(compare(xelseif.document, b), 'xstencil b');
      xstencil.regenerate(xelseif, { value: 'c' }, step());

    }, function (xelseif) {

      ok(compare(xelseif.document, c), 'xstencil c');
      xstencil.regenerate(xelseif, { value: 'a' }, step());

    }, function (xelseif) {

      ok(compare(xelseif.document, a), 'xstencil a-after-scavenge');

    });

    ok(compare(elseif.document, a), 'stencil generate');

    step(function () {

      _stencil.reconstitute(elseif.document, step());

    }, function (elseif) {

      _stencil.regenerate(elseif, { value: 'a' }, step());

    }, function (elseif) {

      ok(compare(elseif.document, a), 'stencil reconstitute');
      _stencil.regenerate(elseif, { value: 'b' }, step());

    }, function (elseif) {

      ok(compare(elseif.document, b), 'stencil b');
      _stencil.regenerate(elseif, { value: 'c' }, step());

    }, function (elseif) {

      ok(compare(elseif.document, c), 'stencil c');
      _stencil.regenerate(elseif, { value: 'a' }, step());

    }, function (elseif) {

      ok(compare(elseif.document, a), 'stencil a-after-scavenge');

    });
  });
});
