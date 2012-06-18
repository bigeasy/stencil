#!/usr/bin/env node

var context, fs = require("fs");
require("./proof")(1, function (callback, stencil, resolver) {
  context = stencil.create(resolver.create(__dirname));
  context.generate("fixtures/value.stencil", callback("actual"));
}, function (callback, fixture) {
  fixture("fixtures/value.xml", callback("expected"));
}, function (ok, compare, actual, expected) {
  ok(compare(actual, expected), "called");
});

// vim: set ft=javascript:
