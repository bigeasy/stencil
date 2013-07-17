var fs = require('fs')
var path = require('path')

module.exports = require('proof')(function () {
    var context = {}
    context.fixture = function (file, callback) {
        fs.readFile(path.resolve(__dirname, file), 'utf8', callback)
    }
    context.compare = require('../compare')
    return context
})
