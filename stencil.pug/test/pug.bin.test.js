require('proof')(2, async okay => {
    okay.leak('__core-js_shared__')
    const stream = require('stream')
    const pug = require('../pug.bin')
    const child = pug([ '"x"' ], {
        $stdin: new stream.PassThrough,
        $stdout: new stream.PassThrough
    })
    child.options.$stdin.write('p Hello, World! #{argv[0]}')
    child.options.$stdin.end()
    okay(await child.exit, 0, 'exit')
    okay(child.options.$stdout.read().toString(), '\n<p>Hello, World! x</p>\n', 'pug')
})
