require('proof')(1, function (deepEqual) {
    var parser = require('../../parser')
    var tree = parser('<html></html>')
    deepEqual(tree, {
        type: 'document',
        children:
        [{
            type: 'element',
            name: 'html',
            attributes: [],
            children: []
        }]
    }, 'parse a single element')
})
