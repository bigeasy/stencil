#!/usr/bin/env node

require('./proof')(2, function (step, fixture, compare, equal, ok) {
    var stream = require('stream')
    var path = require('path')

    var request = require('request')

    var run = require('../../stencil.bin')

    var directory = path.join(__dirname, '/fixtures')

    var stdout = new stream.PassThrough
    step(function () {
        fixture('fixtures/index.xml', step())
        run([ directory ], null, stdout, null, step())
    }, function (expected, server) {
        console.log(stdout.read())
        step(function () {
            request('http://127.0.0.1:' + server.address().port + '/', step())
        }, function (response, body) {
            ok(compare(body, expected), 'get')
        }, function () {
            request('http://127.0.0.1:' + server.address().port + '/index.xml', step())
        }, function (response, body) {
            ok(compare(body, expected), 'get xml')
            server.on('close', step(-1))
            server.close()
        })
    })
})
