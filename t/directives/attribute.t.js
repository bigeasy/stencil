#!/usr/bin/env node

require('./proof')(4, function (step, xstencil, stencil, fixture, ok, compare) {
  var fs = require('fs');

  step(function () {

    xstencil.generate('fixtures/attribute.xstencil', {
        target: null, src: "world.png", alt: "Hello, World!"
    }, step());
    stencil.generate('fixtures/attribute.stencil', {
        target: null, src: "world.png", alt: "Hello, World!"
    }, step());
    fixture('fixtures/attribute-generate.xml', step());
    fixture('fixtures/attribute-regenerate.xml', step());

  }, function (xattribute, attribute, generate, regenerate) {

    ok(compare(xattribute.document, generate), 'xstencil generate');

    step(function () {
      xstencil.regenerate(xattribute, {
        target: "_self", src: "nurse.png", alt: "Hello, Nurse!"
      }, step());

    }, function (xattribute) {

      ok(compare(xattribute.document, regenerate), 'xstencil regenerate');

    });

//    console.log("x-->" + attribute.document + "<-")
 //   console.log("z" + generate)
    ok(compare(attribute.document, generate), 'stencil generate');

    step(function () {
      stencil.regenerate(attribute, {
        target: "_self", src: "nurse.png", alt: "Hello, Nurse!"
      }, step());

    }, function (attribute) {

      ok(compare(attribute.document, regenerate), 'stencil regenerate');

    });
  });
});
