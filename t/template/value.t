#!/usr/bin/env node

var context, fs = require("fs");
require("./proof")(1, function (async, stencil, resolver) {
  context = stencil.create(resolver.create(__dirname));
  context.generate("fixtures/value.stencil", async("actual"));
}, function (async, fixture) {
  fixture("fixtures/value.xml", async("expected"));
}, function (ok, compare, actual, expected) {
  ok(compare(actual, expected), "called");
});

// vim: set ft=javascript:
