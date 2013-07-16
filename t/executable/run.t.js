#!/usr/bin/env node

var fs = require('fs')
var path = require('path')

require('proof')(1, function (step, ok, equal) {
    var run = require('../../stencil.bin')
    var stream = require('stream')
    step(function () {
        var stdout
        step([function () {
            stdout = new stream.PassThrough
            run([ '--help' ], null, stdout, null, step())
        }, function (_, error) {
            equal(error.arguable.type, 'help', 'got help')
        }])
    })
})
