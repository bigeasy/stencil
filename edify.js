var cadence = require('cadence')
var edify = require('edify')

function hydrate (node) {
    if (node.children) node.children.forEach(function (child) {
        if (child.type == 'comment') {
            child.type = 'text'
        }
        hydrate(child)
    })
}

module.exports = cadence(function (step, $, cache) {
    step(function () {
        step(function (element) {
            hydrate(element)
        })($('.hydrate-comments').toArray())
    }, function () {
        edify.marked($, '.markdown', step())
    }, function () {
        edify.pygments($, '.lang-html', 'html', cache, step())
    }, function () {
        edify.pygments($, '.lang-erb', 'erb', cache, step())
    }, function () {
        edify.pygments($, '.lang-xml', 'xml', cache, step())
    }, function () {
        edify.pygments($, '.lang-javascript', 'javascript', cache, step())
    })
})
