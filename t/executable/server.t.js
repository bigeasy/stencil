#!/usr/bin/env node

require('proof')(2, function (step, equal, ok) {
    var createServer = require('../../executable').createServer
    var path = require('path')
    var directory = path.join(__dirname, '/fixtures')

    step(function () {
        createServer({ port: 8386, directory: directory, probe: true }, step())
    }, function (first) {
        var port = first.address().port
        step(function () {
            createServer({ port: 8386, directory: directory, probe: true }, step())
        }, [function (second) {
            ok(port < second.address().port, 'probed')
            second.close()
            createServer({ port: 8386, directory: directory, probe: false }, step())
        }, function (_, error) {
            equal(error.code, 'EADDRINUSE', 'address in use')
            first.close()
        }])
    })
})
