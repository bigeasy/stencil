require('proof')(1, async okay => {
    const edify = require('../edify.bin')
    const child = edify([ 'test' ])
    okay(await child.exit, 0, 'exit')
})
