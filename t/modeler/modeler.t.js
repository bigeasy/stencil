#!/usr/bin/env node

require("proof")(1, function (equal) {
  var exports = {}, modeler = require("../../modeler").createModeler(exports), called = 0;
  modeler.dynamic("watchers", function (broker, callback) { called++ });
  exports._namespace.watchers.callback();
  equal(called, 1, "constructed");
});
