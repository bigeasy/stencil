var Tokenizer = require('./tokenizer')
var util = require('util')

var i = 55,
    TEXT = 0,
    BEFORE_DIRECTIVE = i++,
    BEFORE_TEXT_DIRECTIVE = i++,
    BEFORE_HTML_DIRECTIVE = i++,
    AFTER_TEXT_DIRECTIVE_START = i++,
    IN_TEXT_DIRECTIVE = i++

function whitespace (c) {
    return c === " " || c === "\n" || c === "\t" || c === "\f" || c === "\r";
}

function attribute (cbs, name, value) {
    cbs.onattribname(name)
    cbs.onattribdata(value)
    cbs.onattribend()
}

function send (cbs, directive) {
    cbs.onopentagname('div')
    attribute(cbs, 'data-stencil-directive', directive.name)
    for (var name in directive.attributes) {
        attribute(cbs, 'data-stencil-attribute-' + name, directive.attributes[name])
    }
    cbs.onopentagend()
    cbs.onclosetag('div');
}

function Stencilizer () {
    this._stencilizer = {
        text: [],
        attributes: {}
    }
    Tokenizer.call(this)
}
util.inherits(Stencilizer, Tokenizer)

Stencilizer.prototype._consume = function (c) {
    var directive = this._stencilizer
    switch (this._state) {
    case TEXT:
        switch (c) {
        case '[':
            if(this._index > this._sectionStart){
                this._cbs.ontext(this._getSection());
            }
            this._state = BEFORE_DIRECTIVE
            return true
        }
        return false
    case BEFORE_DIRECTIVE:
        if (c == '<') {
            this._state  = BEFORE_TEXT_DIRECTIVE
            directive.name = 'value'
            directive.attributes.type = 'html'
        } else {
            this._state = IN_TEXT_DIRECTIVE
        }
        return true
    case BEFORE_TEXT_DIRECTIVE:
        if (c == '<') {
            this._state  = BEFORE_HTML_DIRECTIVE
            directive.attributes.type = 'text'
        } else {
            this._state = IN_TEXT_DIRECTIVE
        }
        return true
    case BEFORE_HTML_DIRECTIVE:
        this._state = IN_TEXT_DIRECTIVE
        return true
    case IN_TEXT_DIRECTIVE:
        if (c == ']') {
            directive.attributes.select = directive.text.join('').trim()
            send(this._cbs, directive)
            this._state = TEXT
            this._sectionStart = this._index + 1;
        } else {
            directive.text.push(c)
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
