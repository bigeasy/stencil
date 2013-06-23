#!/usr/bin/env node

require('proof')(1, function (step, equal) {
  var connect = require('connect'),
      http = require('http'),
      path = require('path'),
      service = require('../../service'),
      app;
  step(function () {
    var fixtures = path.join(__dirname, 'fixtures'),
        javascript = require('../../javascript/common').create(fixtures),
        xml = require('../../xml/file').create(fixtures),
        json = require('../../json/file').create(fixtures),
        context = require('../..').create(javascript, xml, json);
    var func = service.create(fixtures, context);
    app = connect()
      .use(func)
      .listen(8082);
/*    on(app, 'listen');
  }, function () {
    var on = step('on');*/
    var req = http.get("http://127.0.0.1:8082/hello");
    req.on('response', step.event());
    req.on('error', step.error());
  }, function (message) {
    message.setEncoding('utf8');
    message.on('data', step.event([]));
    message.on( 'end', step.event());
    message.on( 'error', step.error());
  }, function (data) {
    equal(data.join(''), '<html><!--stencil:/hello.stencil-->\n<body>\n<p>Hello, World!</p>\n</body>\n</html>', 'connect');
    app.close();
  });
});
