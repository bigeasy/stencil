var fs = require('fs')
//var domutils = require('domutils')
var xmldom = require('xmldom')

var index = require('./index')

var cadence = require('cadence')

var __slice = [].slice

function createXMLTemplate (document, object) {
    function descend (element, children) {
        children.forEach(function (child) {
            var $, name, append
            switch (child.type) {
            case 'tag':
                if (child.attribs['data-stencil-directive']) {
                    append = element.ownerDocument.createElementNS('stencil', 's:' + child.attribs['data-stencil-directive'])
                    delete child.attribs['data-stencil-directive']
                    for (name in child.attribs) {
                        if ($ = /^data-stencil-attribute-(.*)$/.exec(name)) {
                            append.setAttribute($[1], child.attribs[name]);
                            delete child.attribs[name]
                        }
                    }
                } else {
                    append = element.ownerDocument.createElement(child.name)
                }
                for (name in child.attribs) {
                    if ($ = /^data-stencil-evaluated-attribute-(.*)$/.exec(name)) {
                        append.setAttributeNS('stencil', 's:' + $[1], child.attribs[name]);
                        delete child.attribs[name]
                    } else if ($ = /^data-stencil-require-(.*)$/.exec(name)) {
                        append.setAttributeNS('http://www.w3.org/2000/xmlns/', 'xmlns:' + $[1], 'req:' + child.attribs[name]);
                        delete child.attribs[name]
                    }
                }
                for (name in child.attribs) {
                    append.setAttribute(name, child.attribs[name])
                }
                if (element.nodeType == 11) {
                    append.setAttributeNS('http://www.w3.org/2000/xmlns/', 'xmlns:s', 'stencil');
                }
                element.appendChild(append)
                descend(append, child.children)
                break
            case 'text':
                element.appendChild(element.ownerDocument.createTextNode(child.data))
                break
            }
        })
    }

    var fragment = document.createDocumentFragment()
    //console.log(object) 
    descend(fragment, [ object ]);
    document.appendChild(fragment)
    //console.log(document.documentElement.toString())
}

var htmlparser = require('htmlparser2');
var path = require('path');


function TokenizerProxy (cbs) {
    this._cbs = cbs 
}

'oncdataend oncdatastart \
 onclosetag oncomment onselfclosingtag \
 oncommentend onerror onopentagname onopentagend \
 onprocessinginstruction onreset ontext onend'.split(/\s+/).forEach(function (method) {
    TokenizerProxy.prototype[method] = function () {
        this._cbs[method].apply(this._cbs, __slice.call(arguments))
    }
})

TokenizerProxy.prototype.ondirective = function (directive) {
    if (/^(end|else)$/.test(directive.name)) {
        this._cbs.onclosetag('div')
    }
    if ('end' != directive.name) {
        // todo: single quotes.
        this._cbs.onopentagname("div")
        this._cbs.onattribname("data-stencil-directive")
        this._cbs.onattribvalue(directive.name)
        for (var name in directive.attributes) {
            this._cbs.onattribname("data-stencil-attribute-" + name)
            this._cbs.onattribvalue(directive.attributes[name])
        }
        this._cbs.onopentagend()
        if (directive.name == 'value' || directive.name == 'recurse') {
            this._cbs.onclosetag('div')
        }
    }
}

TokenizerProxy.prototype.onimportname = function (name) {
    if (name != "require" && name != "include") {
        throw new Error(name)
    }
    this._importName = name;
}

TokenizerProxy.prototype.onimportvalue = function (value) {
    var $ = /^([\w$_][\w\d$_]*):\s*('(?:[^\\']|\\.)*'|"(?:[^\\"]|\\.)*")\s*$/.exec(value);
    if (!$) {
        throw new Error;
    }
    var variable = $[1]
    var path = $[2].replace(/^.(.*).$/, '$1').replace(/\\(.)/g, '$1')
    this._cbs.onattribname('data-stencil-' + this._importName + '-' + variable)
    this._cbs.onattribvalue(path)
}

TokenizerProxy.prototype.onattribname = function (name) {
    this._attributeName = name;
}

TokenizerProxy.prototype.onattribeval = function () {
    this._attributeName = 'data-stencil-evaluated-attribute-' + this._attributeName
}

TokenizerProxy.prototype.onattribvalue = function (value) {
    this._cbs.onattribname(this._attributeName);
    this._cbs.onattribvalue(value);
}

// new problem, how does our xml engine resolve these? how do we get them to the
// browser to be resolved? We have stencil and xstencil. We need to bundle to
// get these back down to the browser, or serve the XML.
exports.createParser = function (base) {
    return cadence(function (step, source) {
        
        step(function () {
            fs.readFile(path.join(base, source), 'utf8', step())
        }, function (body) {
            var handler = new htmlparser.DefaultHandler()
            var tokenizer = new (require('./tokenizer'))
            var parser = new htmlparser.Parser(handler);
            tokenizer._cbs = new TokenizerProxy(parser._tokenizer._cbs)
            parser._tokenizer = tokenizer
            parser.parseComplete(body)
            // great. now it's time for a serializer.
            //console.log('here', domutils.getOuterHTML(handler.dom[0]))
            //console.log(require('util').inspect(handler.dom[0], false, null))
            var actual = new (xmldom.DOMParser)().parseFromString('<html/>')
            actual.documentElement.parentNode.removeChild(actual.documentElement)
            createXMLTemplate(actual, handler.dom[0])
            //console.log('--->', actual.toString())
            return actual
        })
    })
}

// maybe it's time to start testing through HTTP, instead of trying to unit
// test, because you're not getting around to the HTTP part of it.
