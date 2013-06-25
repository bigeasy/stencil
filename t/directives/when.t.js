#!/usr/bin/env node

require('./proof')(5, function (step, context, fixture, ok, compare) {
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

  step(function (stencil, resolver) {

    context.generate('fixtures/when.stencil', { article: article, recents: recents }, step());
    fixture('fixtures/when-generate.xml', step());
    fixture('fixtures/when-update.xml', step());
    fixture('fixtures/when-missing.xml', step());

  }, function (actual, generated, updated, missing) {

    ok(compare(actual.document, generated), 'generate');

    step(function () {

      context.reconstitute(actual.document, step());

    }, function (actual) {

      context.regenerate(actual, { recents: recents }, step());

    }, function (actual) {

      ok(compare(actual.document, generated), 'reconstitute');
      recents.push(extraComment);
      context.regenerate(actual, { recents: recents }, step());

    }, function (actual) {

      ok(compare(actual.document, updated), 'updated');
      recents.pop();
      context.generate('fixtures/when.stencil', { recents: recents }, step());

    }, function (actual) {

      ok(compare(actual.document, missing), 'missing');
      context.regenerate(actual, { article: article, recents: recents }, step());

    }, function (actual) {

      ok(compare(actual.document, generated), 'completed');

    });
  });
});
