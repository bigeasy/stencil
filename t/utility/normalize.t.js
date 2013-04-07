#!/usr/bin/env node

require('proof')(10, function (equal) {
  var normalize = require('../..').create().normalize;
  equal(normalize('foo.js'), 'foo.js', 'relative already normalized');
  equal(normalize('./foo.js'), 'foo.js', 'leading dot');
  equal(normalize('/foo.js'), '/foo.js', 'absolute already normalized');
  equal(normalize('//foo.js'), '/foo.js', 'double slashes');
  equal(normalize('/bar/./foo.js'), '/bar/foo.js', 'absolute with dot');
  equal(normalize('bar/./foo.js'), 'bar/foo.js', 'relative with dot');
  equal(normalize('./bar/./foo.js'), 'bar/foo.js', 'leading dot with dot');
  equal(normalize('/bar/baz/../foo.js'), '/bar/foo.js', 'absolute with parent');
  equal(normalize('../..'), '../..', 'relative above root');
  equal(normalize('../../bar/baz/../foo.js'), '../../bar/foo.js', 'relative above root with parent');
});
