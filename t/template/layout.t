#!/usr/bin/env node

require("./proof")(1, function (async) {
  var context, fs = require("fs");
  async(function (stencil, resolver) {

    context = stencil.create(resolver.create(__dirname));
    context.generate("fixtures/layedout.stencil", async("actual"));

  }, function (fixture) {

    fixture("fixtures/layedout.xml", async("expected"));
    
  }, function (ok, compare, actual, expected) {

    ok(compare(actual, expected), "called");

  });
});
