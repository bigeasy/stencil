#!/usr/bin/env node

function normalize (url) {
  var parts = url.split('/'), i, I, normal = [];
  for (i = 0, I = parts.length; i < I; i++) {
    if (/\?#/.test(parts[i])) {
      normal.push.apply(normal, parts.slice(i));
      break;
    } if (parts[i] == '..') {
      if (normal.length && normal[normal.length - 1] != '..') {
        if (normal.length == 1 && normal[0] == '') throw new Error('underflow');
        normal.pop();
      } else {
        normal.push(parts[i]);
      }
    } else if ((parts[i] != '' || i == 0) && parts[i] != '.') {
      normal.push(parts[i]);
    }
  }
  return normal.join('/');
}

require('proof')(10, function (equal) {
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
