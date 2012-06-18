!function (definition) {
  if (typeof module == "object" && module.exports) module.exports = definition();
  else if (typeof define == "function" && typeof define.amd == "object") define(definition);
  else this.tz = definition();
} (function () { function create (resolver) {
  // const      ELEMENT_NODE                   = 1;
  // const      ATTRIBUTE_NODE                 = 2;
  // const      TEXT_NODE                      = 3;
  // const      CDATA_SECTION_NODE             = 4;
  // const      ENTITY_REFERENCE_NODE          = 5;
  // const      ENTITY_NODE                    = 6;
  // const      PROCESSING_INSTRUCTION_NODE    = 7;
  // const      COMMENT_NODE                   = 8;
  // const      DOCUMENT_NODE                  = 9;
  // const      DOCUMENT_TYPE_NODE             = 10;
  // const      DOCUMENT_FRAGMENT_NODE         = 11;
  // const      NOTATION_NODE                  = 12;

  var NS_STENCIL = "http://bigeasy.github.com/stencil";

  var REPLACEMENTS =
  { "<": "&lt;"
  , ">": "&gt;"
  , '"': "&quot;"
  , '&': "&amp;"
  };

  function replacements(string) { return REPLACEMENTS[string] }

  function serialize(node) {
    var child, i, I, attr;
    switch (node.nodeType) {
    case 1:
      process.stdout.write("<" + node.localName);
      for (i = 0, I = node.attributes.length; i < I; i++) {
        attr = node.attributes.item(i);
        if (attr.namespaceURI) continue;
        process.stdout.write([ " ", attr.name, '="', attr.value.replace(/[<>&"]/g, replacements), '"'].join(""))
      }
      process.stdout.write(">");
      for (child = node.firstChild; child != null; child = child.nextSibling) {
        serialize(child);
      }
      process.stdout.write("</" + node.localName + ">");
      break;
    case 3:
      process.stdout.write(node.nodeValue);
      break;
    }
  }

  function loadModule(descent, node) {
    var href = node.getAttribute("href"), into = node.getAttribute("into");
    descent.context[0][into] = require(href);
    resume(descent);
  }

  function resume(descent) {
    var stack = descent.stack, node = stack.pop()
    while (stack.length != 0 && children(descent, node.nextSibling)) {
      node = stack.pop();
    }
    if (stack.length == 0) {
      descent.complete(null, node);
    }
  }

  function evaluate(descent, source, callback) {
    var args = [], values = [], i, I, result;
    for (var key in descent.context[0]) {
      args.push(key);
    }
    for (i = 0, I = args.length; i < I; i++) {
      values.push(descent.context[0][args[i]]);
    }
    var f = Function.apply(Function, args.concat([ "return " + source ]));
    descent.callback = callback;
    try {
      result = f.apply(this, values);
    } catch (e) {
      descent.complete(e);
    }
    if (!descent.calledback) {
      descent.callback(result);
    }
  }

  function writeValue(descent, node) {
    evaluate(descent, node.getAttribute("select"), function (result) {
      var e = node.ownerDocument.createElement(node.getAttribute("element"));
      var text = node.ownerDocument.createTextNode(result);
      e.appendChild(text);
      node.parentNode.insertBefore(e, node);
      node.parentNode.removeChild(node);
      resume(descent);
    });
  }

  function children(descent, child) {
    for (; child != null; child = child.nextSibling) {
      if (!visit(descent, child)) {
        return false;
      }
    }
    return true;
  }

  function visit(descent, node) {
    var i, I, child;
    descent.stack.push(node);
    switch (node.nodeType) {
    case 1:
      if (NS_STENCIL == node.namespaceURI) {
        switch (node.localName) {
        case "require":
          node.parentNode.removeChild(node);
          loadModule(descent, node); 
          return false;
        case "value":
          writeValue(descent, node);
          return false;
  /*      case "each":
          each(descent, node);
          return false;*/
        }
      } else {
        for (i = 0, I = node.attributes.length; i < I; i++) {
          if (NS_STENCIL == node.attributes.item(i).namespaceURI) {
            console.log(node.attributes.item(i).namespaceURI);
          }
        }
      }
    }
    var completed = children(descent, node.firstChild);
    descent.stack.pop();
    return completed;
  }

  function completed(error, doc) {
    if (error) throw error;
    else serialize(doc);
  }

  function processor(callback) {
    return function (error, file) {
      if (error) {
        callback(error);
      } else {
        descent.context[0].callback = function () {
          descent.calledback = true;
          return function (error, result) {
            if (error) descent.complete(error);
            else descent.callback(result);
          }
        };
      }
    }
  }

  var templates = {};

  function check(callback, next) {
    return function (error, result) {
      if (error) callback(error);
      else next(result);
    }
  }

  function Template (url, doc) {
    this.url = url;
    this.doc = doc;
  }

  Template.prototype = {
    generate: function Template_generate (callback) {
      var descent =
      { stack: []
      , context: [ { source: { file: "foo.js" } } ]
      , complete: callback
      };
      descent.context[0].callback = function () {
        descent.calledback = true;
        return function (error, result) {
          if (error) descent.complete(error);
          else descent.callback(result);
        }
      };
      var doc = this.doc.cloneNode(true);
      if (visit(descent, doc.documentElement)) {
        callback(null, doc.documentElement);
      }
    }
  };

  function generate (url, callback) {
    if (templates[url]) {
      templates[url].generate(callback);
    } else {
      resolver(url, check(callback, function (doc) {
        templates[url] = new Template(url, doc);
        templates[url].generate(callback);
      }));
    }
  }

  return { generate: generate };
}; return { create: create }});
