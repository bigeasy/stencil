#!/usr/bin/env node

var context, fs = require("fs");
require("./proof")(1, function (callback, stencil, resolver) {
  context = stencil.create(resolver.create(__dirname));
  context.generate("fixtures/require.stencil", callback("actual"));
}, function (callback, fixture) {
  fixture("fixtures/require.xml", callback("expected"));
}, function (ok, compare, actual, expected) {
  ok(compare(actual, expected), "called");
});
