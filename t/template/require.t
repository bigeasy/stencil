#!/usr/bin/env node

require("./proof")(1, function (async) {
  var context, fs = require("fs");

  async(function (stencil, resolver) {

    context = stencil.create(__dirname + '/', resolver.create());
    context.generate("fixtures/require.stencil", async("actual"));

  }, function (fixture) {

    fixture("fixtures/require.xml", async("expected"));

  }, function (ok, compare, actual, expected) {

    ok(compare(actual, expected), "called");

  });
});
