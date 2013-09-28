require('proof')(2, function (deepEqual) {
    var parser = require('../../parser')
    var tree = parser('<html lang="en"></html>')
    deepEqual(tree, {
        type: 'document',
        children:
        [{
            type: 'element',
            name: 'html',
            attributes: [ { name: 'lang', value: 'en' } ],
            children: []
        }]
    }, 'parse double quoted attribute')

    tree = parser("<html lang='en'></html>")
    deepEqual(tree, {
        type: 'document',
        children:
        [{
            type: 'element',
            name: 'html',
            attributes: [ { name: 'lang', value: 'en' } ],
            children: []
        }]
    }, 'parse single quoted attribute')
})
