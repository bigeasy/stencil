var connect = require('connect'), send = require('send'),
    stencil = require('stencil'), reactor = require('reactor'),
    serializer = require('stencil/serializer'),
    util = require('util'),
    parse = require('url').parse;

var context = stencil.create(__dirname + '/public/stencils/', require('stencil/resolver').create());
var reactor = reactor.createReactor();
var slice = [].slice;

send.mime.types.stencil = "text/xml";

// TODO: Pass in request, it will get parsed. If not passed in, or, rather,
// we'll determine our context somehow, to determine that the context object is,
// probably `window.location`.
var routes = require('./routify').routes(__dirname + '/public/stencils');
routes.forEach(function (route) {
  reactor.get(route.route, function (params, request, response) {
    var pathInfo = params.pathInfo ? '/' + params.pathInfo : '';
    context.generate(route.stencil, { pathInfo: pathInfo }, function (error, stencil) {
      if (error) throw error;
      response.setHeader("Content-Type", "text/html; charset=utf8");
      response.end(serializer(stencil.document.documentElement));
    });
  });
});

function die () {
  console.log.apply(console, slice.call(arguments, 0));
  return process.exit(1);
};

function say () { return console.log.apply(console, slice.call(arguments, 0)) }

var app = connect()
  .use(connect.logger('dev'))
  .use(connect.favicon())
  .use(connect.static('public'))
  .use(function (req, res, next) {
    if (req.url == "/routes.json") {
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(routes));
    } else {
      next();
    }
  })
  .use(require("connect-npm")({
    modules: [ "reactor", "stencil" ],
    require: require,
    format: "/npm/%s.js"
  }))
  .use(function(req, res, next){
    var url = parse(req.url, true);
    if (!reactor.react(req.method, url.pathname, req, res)) next();
   })
  .listen(8079);
