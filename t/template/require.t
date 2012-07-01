#!/usr/bin/env node

require("./proof")(1, function (callback) {
  var context, fs = require("fs");

  callback(function (stencil, resolver) {

    context = stencil.create(resolver.create(__dirname));
    context.generate("fixtures/require.stencil", callback("actual"));

  }, function (fixture) {

    fixture("fixtures/require.xml", callback("expected"));

  }, function (ok, compare, actual, expected) {

    ok(compare(actual, expected), "called");

  });
});
