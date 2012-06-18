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

  var NS_STENCIL = "stencil";

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

  function wrap (node) { return { node: node, loading: 0, context: {} } }

  function xmlify (template, done) {
    function requireModule(href) {
      var record = stack.pop()
        , into = href.replace(/^.*\/([^.]+).*$/, "$1");

      resolver(href, "text/javascript", check(done, function (module) {
        record.context[into] = module;
        record.loading++;
        if (visit(record)) resume();
      }));

      return false;
    }

    function resume () {
      var record = stack.pop();
      while (stack.length != 0 && children(record.node.nextSibling)) {
        record = stack.pop();
      }
      if (stack.length == 0) {
        done(null, record.node);
      }
    }

    function evaluate(source, consumer) {
      var context = {}, parameters = [], values = []
        , i, I, name, key, func, callbacks = 0;
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
        if (!visit(wrap(child))) {
          return false;
        }
      }
      return true;
    }

    function visit (record) {
      var node = record.node, completed, I;
      stack.push(record);
      if (node.nodeType == 1) {
        for (I = node.attributes.length; record.loading < I; record.loading++) {
          attr = node.attributes.item(record.loading);
          if ("stencil" == attr.namespaceURI) {
            if ("require" == attr.localName) {
              return requireModule(attr.nodeValue);
            }
          }
        }
        if ("stencil" == node.namespaceURI && elements[node.localName]) {
          return elements[node.localName](record, node); 
        }
      }
      completed = children(node.firstChild);
      stack.pop();
      return completed;
    }

    var stack = [], self = {}, doc = template.doc.cloneNode(true), elements;

    elements = {
      value: function (record, node) {
        evaluate(node.getAttribute("select"), function (result) {
          var e = node.ownerDocument.createElement(node.getAttribute("element"));
          e.appendChild(node.ownerDocument.createTextNode(result));
          node.parentNode.insertBefore(e, node);
          node.parentNode.removeChild(node);
          resume();
        });
      }
    };

    var root = wrap(doc.documentElement);
    root.context.source = { file: "foo.js" };
    if (visit(root)) done(null, doc.documentElement);
  }

  var templates = {};

  function check(callback, next) {
    return function (error, result) {
      if (error) callback(error);
      else next(result);
    }
  }

  function generate (url, callback) {
    if (templates[url]) {
      xmlify(templates[url], callback);
    } else {
      resolver(url, "text/xml", check(callback, function (doc) {
        xmlify(templates[url] = { url: url, doc: doc }, callback);
      }));
    }
  }

  return { generate: generate };
}; return { create: create }});
