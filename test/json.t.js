require('proof')(2, async okay => {
    const path = require('path')
    const json = require('../stencil.pug/json')
    const parsed = await json(path.join(__dirname, 'json.json'))
    okay(parsed, { a: 1 }, 'parse json file')
    try {
        await json(path.join(__dirname, 'missing.json'))
    } catch (error) {
        okay(error instanceof SyntaxError, 'cannot parse json')
    }
})
