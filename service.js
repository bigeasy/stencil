var find = require('reactor/find'),
    serializer = require('./serializer'),
    url = require('url');

function say () {
  var all = [].slice.call(arguments),
      filtered = all.filter(function (argument) { return argument !== say });
  console.log.apply(console, filtered);
  if (filtered.length != all.length) process.exit(1);
}

exports.create = function (base, context) {
  var reactor = require('reactor').createReactor();
  find(base, 'stencil').forEach(function (route) {
    reactor.get(route.route, function (params, request, response, next) {
      var pathInfo = params.pathInfo ? '/' + params.pathInfo : '';
      context.generate(route.script, {
        request: request, response: response, pathInfo: pathInfo
      }, function (error, stencil) {
        if (error) {
          next(error);
        } else {
          response.setHeader("Content-Type", "text/html; charset=utf8");
          response.end(serializer(stencil.document.documentElement));
        }
      });
    });
  });
  return function (req, res, next){
    if (!reactor.react(req.method, url.parse(req.url).pathname, req, res, next)) next();
  }
}
