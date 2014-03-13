var fs = require('fs')
//var domutils = require('domutils')
var xmldom = require('xmldom')

var index = require('./index')

var cadence = require('cadence')

var __slice = [].slice

function createXMLTemplate (document, object) {
    function descend (element, children) {
        children.forEach(function (child) {
            var $, name, append, index
            switch (child.type) {
            case 'tag':
                if (child.attribs['data-stencil-directive']) {
                    var directive = child.attribs['data-stencil-directive']
                    if ((name = directive.replace('.', ':')) == directive) {
                        name = 's:' + directive
                    }
                    append = element.ownerDocument.createElementNS('stencil', name)
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
                    } else if ($ = /^data-stencil-(require|include)-(.*)$/.exec(name)) {
                        append.setAttributeNS('http://www.w3.org/2000/xmlns/', 'xmlns:' + $[2], $[1].substring(0, 3) + ':' + child.attribs[name]);
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
            this._cbs.onattribname(name)
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
    this._attribute = { name: name, data: [] }
}

TokenizerProxy.prototype.onattribdata = function (data) {
    this._attribute.data.push(data)
}

TokenizerProxy.prototype.onattribend = function (data) {
    this._cbs.onattribname(this._attribute.name)
    this._cbs.onattribdata(this._attribute.data.join(''))
    this._cbs.onattribend()
}

TokenizerProxy.prototype.onattribeval = function () {
    this._attribute.name = 'data-stencil-evaluated-attribute-' + this._attribute.name
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
            var tokenizer = new (require('./parser'))
            var parser = new htmlparser.Parser(handler);
            tokenizer._cbs = new TokenizerProxy(parser._tokenizer._cbs)
            parser._tokenizer = tokenizer
            parser.parseComplete(body)
            //console.log('=======')
            // great. now it's time for a serializer.
            //console.log( domutils.getOuterHTML(handler.dom[0]))
            //console.log('=======')
            //console.log(require('util').inspect(handler.dom[0], false, null))
            var actual = new (xmldom.DOMParser)().parseFromString('<html/>')
            actual.documentElement.parentNode.removeChild(actual.documentElement)
            createXMLTemplate(actual, handler.dom[0])
            // Why? Because. Because namespaces. Hateful namespaces.
            var actual = new (xmldom.DOMParser)().parseFromString(actual.toString())

            // You see, in order to use namespaces for tags, like
            // `t:specialized` we need to build that element with the correct
            // namespace url, but the prefix might be defined in that element
            // using `xmlns:t="inc:_foo.stencil"`.
            //
            // This is not going to be unheard of in Stencil. With layouts, you
            // need to import the library, then immediately use the tag. Until
            // you build the tag an insert it into the document, you don't have
            // a full namespace map for the node, because it includes the
            // current node, so `lookupNamespaceURI` won't work if you invoke it
            // on the parent and the node you're inserting renames a namespace.
            // If the current node defines a new namespace, it will do so when
            // you call `setAttributeNS` on the new node, oh, but, you've
            // already build the new node and `namespaceURI` is an immutable
            // property, so now what? Remove it and start over because now you
            // know, but how is that any less ugly than the above, serialize the
            // XML, then parse it, and the parser will sort out the namespaces.
            console.log('=======')
            console.log(actual.toString())
            //console.log('=======')
            return actual
        })
    })
}

// maybe it's time to start testing through HTTP, instead of trying to unit
// test, because you're not getting around to the HTTP part of it.
