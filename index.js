!function (definition) {
  if (typeof module == "object" && module.exports) module.exports = definition();
  else if (typeof define == "function" && typeof define.amd == "object") define(definition);
  else this.tz = definition();
} (function () { function create (resolver) {
  var __slice = [].slice;

  function die () {
    console.log.apply(console, __slice.call(arguments, 0));
    return process.exit(1);
  };

  function say () { return console.log.apply(console, __slice.call(arguments, 0)) }

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

  var NS_STENCIL = "stencil"
    , XMLNS = "http://www.w3.org/2000/xmlns/"
    ;

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

  var functions = {};

  function wrap (node) { return { node: node, loading: 0, context: {}, attrs: {} } }

  var counter = 0, called =0;

  function xmlify (stack, caller, depth, done) {
    var self = {}, elements, layoutNS = "", stop = stack.length - 1, top, returned;

    elements =
    { value: function (record, node) {
        evaluate(node.getAttribute("select"), function (result) {
          var e = node.ownerDocument.createElement(node.getAttribute("element"));
          e.appendChild(node.ownerDocument.createTextNode(result));
          node.parentNode.insertBefore(e, node);
          node.parentNode.removeChild(node);
          record.node = e;
          resume();
        });
      }
    };

    if (visit(top = stack.shift())) {
      done(null, top.node);
    }

    function requisite (attr) {
      var record = stack.shift()
        , into = attr.localName
        , href = attr.nodeValue.replace(/^[^:]+:/, '')
        ;

      resolver(href, "text/javascript", check(done, function (module) {
        record.context[into] = module;
        record.loading++;
        if (visit(record)) resume();
      }));

      return false;
    }

    function include (record) {
      var node = record.node
        , attr = record.include
        , href = attr.nodeValue.replace(/^[^:]+:/, '')
        ;

      fetch(href, check(done, function (template) {
        var callee = [ wrap(template.doc.documentElement.cloneNode(true)) ]
          , blocks = record.node.getElementsByTagNameNS(attr.nodeValue, '*')
          , i, I
          ;

        callee[0].funcs = template.funcs;

        callee[0].context =
        { source: { file: "foo.js", url: template.url }
        , caller: record.node
        , attrs: record.attrs
        , blocks: {}
        };

        for (i = 0, I = blocks.length; i < I; i++) {
          callee[0].context.blocks[blocks[i].localName] = blocks[i];
        }

        xmlify(callee, stack, depth + 1, check(done, function (doc) {
          doc = node.ownerDocument.importNode(doc, true);
          node.parentNode.insertBefore(doc, node);
          node.parentNode.removeChild(node);
          record.node = doc;
          resume();
        }));
      }));
    }

    function layout (record) {
      var attr = record.layout
        , $ = /^[^:]+:(\w[\w\d]+)?(?:\(([^)]*)\))$/.exec(attr.nodeValue)
        , name = $[1] || "!default"
        , params = $[2] ? $[2].split(/\s*,\s*/) : []
        , i, I
        ;
      for (i = 0, I = params.length; i < I; i++) {
        record.context[params[i]] = stack[0].context.attrs[params[i]];
      }
      layoutNS = attr.nodeValue;
    }

    // It appears that blocks are connectors that disappear, while layouts
    // rewrite and replace themselves.
    function block (record, node) {
      var block = get("blocks")[node.localName].cloneNode(true);

      // Here we need to re-enter the context of the caller.
      caller.unshift(wrap(block));

      xmlify(caller, stack, depth + 1, check(done, function (transformed) {
        var child;
        record.node = { nextSibling: node.nextSibling };
        while (child = transformed.firstChild) {
          child = transformed.removeChild(child);
          child.nextSibling = child.previousSibling = null;
          child = node.ownerDocument.importNode(child, true);
          node.parentNode.insertBefore(child, node);
          record.node = child;
        }
        node.parentNode.removeChild(node);
        resume();
      }));
    }

    function resume () {
      var record = stack.shift(), stopped;
      while (stack.length != stop && children(record.node.nextSibling)) {
        record = stack.shift();
      }
      if (!returned && stack.length == stop) {
        returned = true;
        done(null, record.node);
      }
    }

    function get (name) {
      for (var i = stack.length - 1; i != -1; i++)
        if (stack[i].context[name]) return stack[i].context[name];
    }

    function evaluate (source, consumer) {
      var context = {}, parameters = [], values = []
        , i, I, name, key, func, callbacks = 0, result;
      for (i = 0, I = stack.length; i < I; i++) {
        for (name in stack[i].context) {
          context[name] = stack[i].context[name];
        }
      }
      for (name in context) parameters.push(name);
      parameters.sort();
      for (i = 0, I = parameters.length; i < I; i++) {
        values.push(context[parameters[i]]);
      }
      key = parameters.join(",") + "|" + source;
      if (!(func = functions[key])) {
        func = Function.apply(Function, parameters.concat([ "callback", "return " + source ]));
        functions[key] = func;
      }
      values.push(function callback () {
        if (callbacks++) throw new Error("multiple callbacks");
        return function (error, result) {
          if (error) done(error);
          else consumer(result);
        }
      });
      try {
        result = func.apply(self, values);
      } catch (error) {
        done(error);
      }
      if (!callbacks) consumer(result);
    }

    function children (child) {
      for (; child != null; child = child.nextSibling) {
        if (!visit(wrap(child))) return false;
      }
      return true;
    }

    function visit (record) {
      var node = record.node, completed, I, attr, attrs = record.attrs, protocol, blocks;
      stack.unshift(record);
      if (node.nodeType == 1) {
        for (I = node.attributes.length; record.loading < I; record.loading++) {
          attr = node.attributes.item(record.loading);
          switch (attr.namespaceURI || 0) {
          case "http://www.w3.org/2000/xmlns/":
            if (protocol = attr.nodeValue.split(/:/).shift()) {
              if (!"require".indexOf(protocol)) return requisite(attr);
              if (!"include".indexOf(protocol)) record.include = attr;
              if (!"layout".indexOf(protocol)) record.layout = attr;
            }
            break;
          case "stencil":
            return attribute(attr);
          case 0:
            attrs[attr.localName] = attr.nodeValue;
          }
        }
        if (record.include) {
          return include(record);
        }
        if (record.layout) {
          layout(record);
        }
        if (node.namespaceURI == layoutNS) {
          return block(record, node);
        } else if ("stencil" == node.namespaceURI && elements[node.localName]) {
          return elements[node.localName](record, node); 
        }
        for (attr in attrs) {
          node.setAttributeNS(null, attr, String(attrs[attr]));
        }
      }
      completed = children(node.firstChild);
      stack.shift();
      return completed;
    }
  }

  var templates = {};

  function check(callback, next) {
    return function (error, result) {
      if (error) callback(error);
      else next(result);
    }
  }

  function fetch (url, callback) {
    if (templates[url]) callback(null, templates[url]);
    else resolver(url, "text/xml", check(callback, function (doc) {
      callback(null,  templates[url] = { url: url, doc: doc, funcs: {} });
    }));
  }

  function _generate (url, caller, stack, callback) {
    if (typeof url != "string") throw new Error();
  }

  function generate (url, callback) {
    fetch(url, check(callback, function (template) {
      var stack = [ wrap(template.doc.documentElement.cloneNode(true)) ];
      template.doc.createDocumentFragment().appendChild(stack[0].node);
      stack[0].context.source = { file: "foo.js", url: template.url };
      stack[0].funcs = template.funcs;
      xmlify(stack, null, 0, callback);
    }));
  }


  return { generate: generate };
}; return { create: create }});
