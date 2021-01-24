require('proof')(3, async okay => {
    const path = require('path')
    const json = require('../json')
    okay(await json('"x"'), 'x', 'parse json string')
    okay(await json(path.join(__dirname, 'json.json')), { a: 1 }, 'parse json from file')
    try {
        await json('{')
        throw new Error
    } catch (error) {
        okay(error instanceof SyntaxError, 'failed')
    }
})
