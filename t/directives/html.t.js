#!/usr/bin/env node

require('./proof')(4, function (step, xstencil, _stencil, fixture, ok, compare) {
  var fs = require('fs');

  step(function () {

    xstencil.generate('fixtures/html.xstencil', {
      greeting: "Hello, <br/><a href='index.html'><em>World</em></a>!"
    }, step());
    _stencil.generate('fixtures/html.stencil', {
      greeting: "Hello, <br/><a href='index.html'><em>World</em></a>!"
    }, step());
    fixture('fixtures/html-generate.xml', step());
    fixture('fixtures/html-update.xml', step());

  }, function (xhtml, html, generate, regenerate) {

    ok(compare(xhtml.document, generate), 'generate');

    step(function () {

      xstencil.reconstitute(xhtml.document, step());

    }, function (xhtml) {

      xstencil.regenerate(xhtml, { greeting: "Hello, Nurse!" }, step());

    }, function (xhtml) {

      ok(compare(xhtml.document, regenerate), 'regenerate');

    });

    ok(compare(html.document, generate), 'generate');

    step(function () {

      _stencil.reconstitute(html.document, step());

    }, function (html) {

      _stencil.regenerate(html, { greeting: "Hello, Nurse!" }, step());

    }, function (html) {

      ok(compare(html.document, regenerate), 'regenerate');

    });
  });
});
