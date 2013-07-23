!function () {
  function resolver (relative) {
    var a = document.createElement('a');
    a.href = '/foo/../example.html';
    return a.href.toString();
  }

  var prefix = /^https?:\/\/[^\/]+/;

  test('dot dot', function() {
    ok(prefix.test(resolver('foo/../example')), '', 'dot dot host');
    equal(resolver('foo/../example').replace(prefix, ''),  '/example.html', 'dot dot path');
  });
}();
