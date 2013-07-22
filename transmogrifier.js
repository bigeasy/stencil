// this will be ugly...
//
// we need to copy all the javascript sources to a new directory, because we
// need to wrap the sources that are invoked as, uh, no. We really ought to just
// say that they need to use module.exports, for now.
//
// Ideally, there would be a wrapper and it would run, but I'd rather not, I'd
// rather just have it be Node.js like. A good place to start.
//
// we use `script` for now, but the relative paths can be wrong, so we're going
// to either have to caveat it, or else we're going to have to create a script
// directive. I like the script directive idea.
//
//      <% script src="./number.js" %>
//
// that gets bundled, maybe these too?
//
//      <% link rel="stylesheet" %>
//      <% img %>
//
// or maybe we caution and say best practice is to anchor, we'll deal with mount
// point rewriting? Do we deal with mount point rewriting?

var fs = require('fs')
var path = require('path')

var cadence = require('cadence')
var find = require('reactor/find')
var xmldom = require('xmldom')

var mkdirp = require('mkdirp')

var transmogrify = cadence(function (step, directory) {
    var routes = find(directory, 'stencil')
    var assets = path.join(directory, '_assets')
    var seen = {}
    step(function () {
        var requires = {}
        step(function (route) {
            if (!seen[route.script]) step(function () {
                var resolved = path.join(directory, route.script)
                step(function () {
                    fs.readFile(resolved, 'utf8', step())
                }, function (body) {
                    route.requirements = []
                    var document = new (xmldom.DOMParser)().parseFromString(body)
                    var scripts = document.getElementsByTagName('script')
                    for (var i = 0, I = scripts.length; i < I; i++) {
                        var element = scripts.item(i)
                        var source = element.getAttribute('src')
                        if (source[0] == '/') source = path.join(directory, source)
                        var source = path.resolve(path.dirname(resolved), source)
                        console.log('x', resolved, element.getAttribute('src'), source, scripts.length)
                        console.log('x', directory, './' + path.relative(directory, source))
                        route.requirements.push('./' + path.relative(directory, source))
                    }
                })
            })
        })(routes)
    }, function () {
        mkdirp(assets, step())
    }, function () {
        var module = []
        module.push('exports.__never__ = function () {')
        module.push(routes.map(function (route) {
            return route.requirements.map(function (requirement) {
                return '    require(' + JSON.stringify(requirement) + ')'
            }).join('\n')
        }).join('\n'))
        module.push('}')
        module.push('', 'require("stencil/router")(require, ' + JSON.stringify(routes, null, 4) + ')')
        var unbundled = path.join(directory, '_unbundled.js')
        fs.writeFile(unbundled, module.join('\n'), 'utf8', step())
    })
})

transmogrify(path.resolve(process.cwd(), process.argv[2]), function (error) {
    if (error) throw error
})
