#!/usr/bin/env node

require('./proof')(10, function (step, xstencil, stencil, fixture, ok, compare) {
  var fs = require('fs'), article = {
    title: "Now Is the Time",
    publishedAt: "just now",
    author: "John Smith",
    body: "Now is the time for all good men to com to the aid of their country."
  }, recents = [{
    articleTitle: "Nothing to Fear",
    author: "John Smith",
    snippet: "I like the part where..."
  }], extraComment = {
    articleTitle: "Nothing to Fear",
    author: "Sally Smith",
    snippet: "I don't know about this..."
  };

  step(function () {

    xstencil.generate('fixtures/when.xstencil', { article: article, recents: recents }, step());
    stencil.generate('fixtures/when.stencil', { article: article, recents: recents }, step());
    fixture('fixtures/when-generate.xml', step());
    fixture('fixtures/when-update.xml', step());
    fixture('fixtures/when-missing.xml', step());


  }, function (xwhen, when, generated, updated, missing) {

    ok(compare(xwhen.document, generated), 'xstencil generate');

    var xrecents = recents.slice()

    step(function () {

      xstencil.reconstitute(xwhen.document, step());

    }, function (xwhen) {

      xstencil.regenerate(xwhen, { recents: xrecents }, step());

    }, function (xwhen) {

      ok(compare(xwhen.document, generated), 'xstencil reconstitute');
      xrecents.push(extraComment);
      xstencil.regenerate(xwhen, { recents: xrecents }, step());

    }, function (xwhen) {

      ok(compare(xwhen.document, updated), 'xstencil updated');
      xrecents.pop();
      xstencil.generate('fixtures/when.xstencil', { recents: xrecents }, step());

    }, function (xwhen) {

      ok(compare(xwhen.document, missing), 'xstencil missing');
      xstencil.regenerate(xwhen, { article: article, recents: xrecents }, step());

    }, function (xwhen) {

      ok(compare(xwhen.document, generated), 'xstencil completed');

    });

    ok(compare(when.document, generated), 'stencil generate');

    step(function () {

      stencil.reconstitute(when.document, step());

    }, function (when) {

      stencil.regenerate(when, { recents: recents }, step());

    }, function (when) {

      ok(compare(when.document, generated), 'stencil reconstitute');
      recents.push(extraComment);
      stencil.regenerate(when, { recents: recents }, step());

    }, function (when) {

      ok(compare(when.document, updated), 'stencil updated');
      recents.pop();
      stencil.generate('fixtures/when.stencil', { recents: recents }, step());

    }, function (when) {

      ok(compare(when.document, missing), 'stencil missing');
      stencil.regenerate(when, { article: article, recents: recents }, step());

    }, function (when) {

      ok(compare(when.document, generated), 'stencil completed');

    });
  });
});
