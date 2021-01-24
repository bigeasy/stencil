require('proof')(5, async okay => {
    const stream = require('stream')
    const ls = require('../stencil.ls/ls.bin')
    const child = ls([ __dirname  ], {
        $stdout: new stream.PassThrough
    })
    okay(await child.exit, 0, 'exit')
    const json = JSON.parse(child.options.$stdout.read().toString())
    okay(json.length, 6, 'length')
    okay(json[0].stats != null, 'stats')
    okay(/\.bin\.t\.js$/.test(json[0].path), 'path')
    okay(json[0].isFile, 'is file')
})
