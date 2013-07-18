var cadence = require('cadence')

exports.createServer = function (port, directory, probe, callback) {
    var http = require('http')
    var connect = require('connect')

    var server = http.createServer()

    var routes = exports.routes(directory)
    var app = connect()
        .use(connect.logger('dev'))
        .use(connect.favicon())
        .use(function (request, response, next) {
            routes(request, response, function (error, found) {
                if (error) next(error)
                else if (!found) next()
            })
        })
        .use(connect.static(directory))
                       /*
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
*/

    var routes = exports.routes(directory)
    server.on('request', app)

    server.on('error', nextPort)

    function nextPort (e) {
        if (!probe || e.code != 'EADDRINUSE') callback(e)
        else server.listen(++port, '127.0.0.1')
    }

    server.on('listening', function () {
        server.removeListener('error', nextPort)
        callback(null, server)
    })

    server.listen(port, '127.0.0.1')
}

exports.routes = function routes (base) {
    var find = require('reactor/find')
    var path = require('path')
    var serializer = require('./serializer')
  
    var javascript = require('./javascript/common').create(base)
    var xml = require('./xml/file').create(base)
    var html = require('./html/parser')

    var url = require('url')
    var routes = find(base, 'stencil')
    var reactor = require('reactor')(routes)

    var stencils = require('./index').create(javascript, xml, null, html)

    return cadence(function (step, request, response) {
        var uri = url.parse(request.url, true)
        var matches = reactor(uri.pathname)

        if (!matches.length) return false
        
        step(function (match) {
            var pathInfo = match.params.pathInfo ? '/' + match.params.pathInfo : ''

            delete match.params.pathInfo

            stencils.generate(match.script, { greeting: "Hello, World!" }, step());
        }, function (generated) {
            response.setHeader("Content-Type", "text/html; charset=utf8");
            response.end(serializer(generated.document.documentElement));
            step(null, true)
        })(matches)
    })
}

// obviously, need to put some more thought into this
exports.argvParser = function (argv) {
    var path = require('path')
    return { directory: path.resolve(process.cwd(), argv[0]) }
}

exports.runner = cadence(function (step, options, stdin, stdout, stderr) {
    if (options.params.help) options.help()
    var argv = exports.argvParser(options.argv)
    step(function () {
        exports.createServer(8386, argv.directory, false, step())
    })
})
