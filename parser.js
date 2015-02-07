var Tokenizer = require('./tokenizer')
var util = require('util')

var TEXT = 0,
    BEFORE_ATTRIBUTE_NAME = 7,
    IN_ATTRIBUTE_NAME = 8,
    BEFORE_ATTRIBUTE_VALUE = 10,

    i = 55,

    BEFORE_DIRECTIVE = i++,
    BEFORE_TEXT_DIRECTIVE = i++,
    BEFORE_HTML_DIRECTIVE = i++,
    AFTER_TEXT_DIRECTIVE_START = i++,
    IN_TEXT_DIRECTIVE = i++,

    IN_ATTRIBUTE_VALUE_EVAL = i++,

    IN_JAVASCRIPT_STRING = i++,
    IN_JAVASCRIPT_STRING_ESCAPE = i++,

    BEFORE_DIRECTIVE_NAME = i++,
    IN_DIRECTIVE_NAME = i++,
    IN_DIRECTIVE = i++,

    IN_EXPRESSION = i++,
    IN_IDENTIFIER_START = i++,
    IN_IDENTIFIER = i++,
    IN_AS = i++,
    IN_KEY = i++,

    BEFORE_BLOCK = i++

function whitespace (c) {
    return c === ' ' || c === '\n' || c === '\t' || c === '\f' || c === '\r'
}

function attribute (cbs, name, value) {
    cbs.onattribname(name)
    cbs.onattribdata(value)
    cbs.onattribend()
}

function begin (cbs, stencilizer) {
    cbs.onopentagname('div')
    attribute(cbs, 'data-stencil-directive', stencilizer.name)
    for (var name in stencilizer.attributes) {
        attribute(cbs, 'data-stencil-attribute-' + name, stencilizer.attributes[name])
    }
    cbs.onopentagend()
    stencilizer.attributes = {}
}

function end (cbs) {
    cbs.onclosetag('div')
}

function AttributeCBS (cbs, stencilizer) {
    this.cbs = cbs
    this._stencilizer = stencilizer
    this._data = []
}

AttributeCBS.prototype.onattribname = function (name) {
    this._name = name
}

AttributeCBS.prototype.onattribdata = function (data) {
    this._data.push(data)
}

AttributeCBS.prototype.onattribend = function () {
    this._stencilizer.attributes[this._name] = this._data.join('')
}

function Stencilizer () {
    this._stencilizer = {
        text: [],
        attributes: {},
        state: [],
        blocks: 0
    }
    Tokenizer.call(this)
}
util.inherits(Stencilizer, Tokenizer)

Stencilizer.prototype._consume = function (c) {
    var stencilizer = this._stencilizer
    switch (this._state) {
    case TEXT:
        switch (c) {
        case '}':
            if (stencilizer.blocks) {
                if(this._index > this._sectionStart){
                    this._cbs.ontext(this._getSection())
                }
                this._sectionStart = this._index + 1
                stencilizer.blocks--
                end(this._cbs)
            }
            return true
        case '[':
            if(this._index > this._sectionStart){
                this._cbs.ontext(this._getSection())
            }
            this._state = BEFORE_DIRECTIVE
            return true
        }
        return false
    case BEFORE_ATTRIBUTE_NAME:
        if (this._inAttributeDirective) {
            this._cbs = this._cbs.cbs
            this._inAttributeDirective = false
            this._state = IN_DIRECTIVE
            return this._consume(c)
        }
        return false
    case BEFORE_ATTRIBUTE_VALUE:
        if (c === '(') {
            this._cbs.onattribeval()
            this._sectionStart = this._index + 1
            this._state = IN_ATTRIBUTE_VALUE_EVAL
            return true
        }
        return false
    case IN_ATTRIBUTE_VALUE_EVAL:
        switch (c) {
        case '\'':
        case '"':
            stencilizer.character = c
            stencilizer.state.push(this._state)
            this._state = IN_JAVASCRIPT_STRING
            break
        case ')':
            this._cbs.onattribdata(this._getSection())
            this._cbs.onattribend()
            this._state = BEFORE_ATTRIBUTE_NAME
            break
        }
        return true
    case IN_JAVASCRIPT_STRING:
        if (c == '\\') {
            this._state = IN_JAVASCRIPT_STRING_ESCAPE
        } else if (c == stencilizer.character) {
            this._state = stencilizer.state.pop()
        }
        return true
    case IN_JAVASCRIPT_STRING_ESCAPE:
        this._state = IN_JAVASCRIPT_STRING
        return true
    case BEFORE_DIRECTIVE:
        if (c == '<') {
            this._state = BEFORE_TEXT_DIRECTIVE
            stencilizer.name = 'value'
            stencilizer.attributes.type = 'html'
        } else {
            this._state = BEFORE_DIRECTIVE_NAME
        }
        return true
    case BEFORE_TEXT_DIRECTIVE:
        if (c == '<') {
            this._state = BEFORE_HTML_DIRECTIVE
            stencilizer.attributes.type = 'text'
        } else {
            this._sectionStart = this._index
            this._state = IN_TEXT_DIRECTIVE
        }
        return true
    case BEFORE_HTML_DIRECTIVE:
        this._state = IN_TEXT_DIRECTIVE
            this._sectionStart = this._index
        return true
    case IN_TEXT_DIRECTIVE:
        if (c == ']') {
            stencilizer.attributes.select = this._getSection()
            begin(this._cbs, stencilizer)
            end(this._cbs)
            this._state = TEXT
            this._sectionStart = this._index + 1
        }
        return true
    case BEFORE_DIRECTIVE_NAME:
        if (!whitespace(c)) {
            this._sectionStart = this._index
            this._state = IN_DIRECTIVE_NAME
        }
        return true
    case IN_DIRECTIVE_NAME:
        if (whitespace(c)) {
            stencilizer.name = this._getSection()
            this._state = IN_DIRECTIVE
        }
        return true
    case IN_DIRECTIVE:
        if (c === '(' || c === '|' || c === '[') {
            stencilizer.terminator = ({ '(': ')', '|': '|', '[': ']' })[c]
            stencilizer.attribute = ({ '(': 'select', '|': 'as', '[': 'key' })[c]
            stencilizer.state.push(this._state)
            this._state = IN_EXPRESSION
            this._sectionStart = this._index + 1
        } else if (c === '@') {
            stencilizer.attribute = 'label'
            stencilizer.state.push(this._state)
            this._state = IN_IDENTIFIER_START
            this._sectionStart = this._index + 1
            break
        } else if (c === ']') {
            begin(this._cbs, stencilizer)
            this._state = BEFORE_BLOCK
            this._sectionStart = this._index + 1
        } else if (!whitespace(c)) {
            this._inAttributeDirective = true
            this._cbs = new AttributeCBS(this._cbs, stencilizer)
            this._state = IN_ATTRIBUTE_NAME
            this._sectionStart = this._index
        }
        return true
    case IN_EXPRESSION:
        if (c == stencilizer.terminator) {
            this._state = stencilizer.state.pop()
            stencilizer.attributes[stencilizer.attribute] = this._getSection()
            return true
        }
        switch (c) {
        case '\'':
        case '"':
            stencilizer.character = c
            stencilizer.state.push(this._state)
            this._state = IN_JAVASCRIPT_STRING
            break
        }
        return true
    case IN_IDENTIFIER_START:
        if (!/^[a-zA-Z_$]$/.test(c)) {
            throw new Error
        }
        this._state = IN_IDENTIFIER
        return true
    case IN_IDENTIFIER:
        if (!/^[0-9a-zA-Z_$]$/.test(c)) {
            this._state = stencilizer.state.pop()
            stencilizer.attributes[stencilizer.attribute] = this._getSection()
        }
        return true
    case BEFORE_BLOCK:
        if (c == '{') {
            stencilizer.blocks++
            this._state = TEXT
            this._sectionStart = this._index + 1
        } else if (!whitespace(c)) {
            end(this._cbs)
            this._state = TEXT
            return false
        }
        return true
    }
    return false
}

Stencilizer.prototype._intercept = function (c) {
    if (this._consume(c)) {
        this._index++
        return true
    }
    return false
}

module.exports = Stencilizer
