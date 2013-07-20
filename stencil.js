var fs = require('fs')

var cadence = require('cadence')

// for a change of pace, let's use actual objects. we can change it back to
// somehting functional later if we dont' like it.
function Stencil () {
}

// new problem, how does our xml engine resolve these? how do we get them to the
// browser to be resolved?
Stencil.prototype.parse = cadence(function (step, source) {
    var htmlparser = require("htmlparser2");
    
    step(function () {
        fs.readFile(source, 'utf8', step())
    }, function (body) {
        var handler = new htmlparser.DefaultHandler()
        var tokenizer = new (require('./tokenizer'))
        var parser = new htmlparser.Parser(handler);
        tokenizer._cbs = parser._tokenizer._cbs
        parser._tokenizer = tokenizer
        parser.parseComplete(body)
        // great. now it's time for a serializer.
        console.log(require('util').inspect(handler.dom, false, null))
    })
})

// maybe it's time to start testing through HTTP, instead of trying to unit
// test, because you're not getting around to the HTTP part of it.
//
var stencil = new Stencil

stencil.parse('t/directives/fixtures/value.stencil', function (error) {
    if (error) throw error
})
