function parse (source) {
    var index = 0
    var out = []
    var stack = []
    var line = 1
    var REGEX = new RegExp('(\\' + '/ . * + ? | ( ) [ ] { } \\'.split(' ').join('|\\') + ')', 'g')

    function token () {
        return out.splice(0, out.length).join('')
    }

    function text () {
        var text = token()
        if (text.length) {
            stack[0].children.push({ type: 'text', data: text })
        }
    }

    function expect (regex, keep) {
        return gather(regex, 1, keep)
    }

    function gather (regex, count, keep) {
        if (typeof regex == "string") {
            regex = new RegExp(part.replace(REGEX, '\\$1'))
        }
        var start = index
        while (index - start < count && lookAhead(regex, 1)) {
            if (keep) {
                out.push(source[index])
            }
            index++
            if (source[index] == '\n') {
                line++
            }
        }
        return index - start
    }

    function whitespace (keep) {
        return gather(/^\s$/, Infinity, keep)
    }

    function at () {
        console.log(source.substring(index))
    }

    function identifier (object) {
        whitespace(false)
        if (!gather(/[a-z]/, Infinity, true)) {
            throw new Error
        }
        return token()
    }

    function value () {
        switch (source[index]) {
        case '"':
            expect(/^"$/)
            gather(/^[^"]$/, Infinity, true)
            expect(/^"$/)
            break;
        case "'":
            expect(/^'$/)
            gather(/^[^']$/, Infinity, true)
            expect(/^'$/)
            break;
        default:
        }
        return token()
    }

    function attribute () {
        var attribute = {}
        attribute.name = identifier()
        expect(/^=$/)
        attribute.value = value()
        return attribute
    }

    function attributes () {
        var attributes = []
        whitespace(false)
        while (!expect(/^>$/)) {
            attributes.push(attribute())
            whitespace(false)
        }
        return attributes
    }

    function startElement () {
        if (!expect(/^<$/, false)) {
            return false
        }
        whitespace(false)
        push({
            type: 'element',
            name: identifier(),
            attributes: attributes(),
            children: []
        })
        return true
    }

    function lookAhead (regex, distance) {
        return regex.test(source.substr(index, distance))
    }

    function children () {
        for (;;) {
            if (gather(/^[^<]$/)) {
                throw new Error
            }
            if (lookAhead(/<\//, 2)) {
                break
            }
            if (element()) {
                throw new Error
            }
        }
    }

    function endElement () {
        if (!(expect(/</) && expect(/\//))) {
            throw new Error
        }
        var name = identifier()
        if (stack[0].name != name) {
            throw new Error
        }
        pop()
    }

    function element () {
        if (startElement()) {
            children()
            endElement()
            return true
        }
        return false
    }

    function push (object) {
        stack[0].children.push(object)
        stack.unshift(object)
    }

    function pop () {
        return stack.shift()
    }

    stack = [{ type: 'document', children: [] }]
    whitespace()
    text()
    element()
    whitespace()
    return pop()
}

module.exports = parse
