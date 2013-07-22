var fs = require('fs')
//var domutils = require('domutils')
var xmldom = require('xmldom')

var index = require('./index')

var cadence = require('cadence')

function createXMLTemplate (document, object) {
    function descend (element, object) {
        object.children.forEach(function (child) {
            switch (child.type) {
            case 'tag':
                if (child.attribs['data-stencil'] == 'true') {
                    var append = element.ownerDocument.createElementNS('stencil', 's:' + child.attribs['data-stencil-directive'])
                    for (var name in child.attribs) {
                        var $
                        if ($ = /^data-stencil-attribute-(.*)$/.exec(name)) {
                            var value = child.attribs[name]
                            append.setAttribute($[1], value);
                        }
                    }
                    append.setAttribute('select', child.attribs['data-stencil-select'])
                } else {
                    var append = element.ownerDocument.createElement(child.name)
                    for (var name in child.attribs) {
                        append.setAttribute(name, child.attribs[name])
                    }
                }
                element.appendChild(append)
                descend(append, child)
                break
            case 'text':
                element.appendChild(element.ownerDocument.createTextNode(child.data))
                break
            }
        })
    }

    var element = document.createElement(object.name)
    element.setAttributeNS('http://www.w3.org/2000/xmlns/', 'xmlns:s', 'stencil');
    //console.log(object) 
    document.appendChild(element)
    descend(element, object);
    //console.log(document.documentElement.toString())
}

var htmlparser = require('htmlparser2');
var path = require('path');

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
            tokenizer._cbs = parser._tokenizer._cbs
            parser._tokenizer = tokenizer
            parser.parseComplete(body)
            // great. now it's time for a serializer.
            //console.log('here', domutils.getOuterHTML(handler.dom[0]))
            //console.log(require('util').inspect(handler.dom, false, null))
            var actual = new (xmldom.DOMParser)().parseFromString('<html/>')
            actual.documentElement.parentNode.removeChild(actual.documentElement)
            createXMLTemplate(actual, handler.dom[0])
            //console.log(actual.toString())
            return actual
        })
    })
}

// maybe it's time to start testing through HTTP, instead of trying to unit
// test, because you're not getting around to the HTTP part of it.
