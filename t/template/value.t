#!/usr/bin/env node

var context, fs = require("fs");
require("./proof")(1, function (async, stencil, resolver) {
  context = stencil.create(resolver.create(__dirname));
  context.generate("fixtures/value.stencil", async());
}, function (actual, async, fixture) {
  fixture("fixtures/value.xml", async());
}, function (expected, actual, ok, compare) {
  ok(compare(actual, expected), "called");
});

// vim: set ft=javascript:
