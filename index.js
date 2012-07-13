!function (definition) {
  if (typeof module == "object" && module.exports) module.exports = definition();
  else if (typeof define == "function" && typeof define.amd == "object") define(definition);
  else this.tz = definition();
} (function () { function create (base, resolver) {
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

  // Because they can be shared across templates, We cache expressions compiled
  // into functions by their trimmed source.
  var functions = {};

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

  function wrap (node) { return { node: node, loading: 0, context: {}, attrs: {} } }

  function xmlify (base, stack, caller, depth, done) {
    var elements, layoutNS = "", stop = stack.length - 1, top, returned;

    function prune (node) {
      node.parentNode.removeChild(node);
      resume();
    }

    elements =
    { if: function (record, node) {
        evaluate(node.getAttribute("select"), function (result) {
          if (result) {
            xmlify(base, stack, stack, stack.length - 1, check(done, function (doc) {
              while (doc.firstChild) {
                node.parentNode.insertBefore(doc.firstChild, node); 
              }
              prune(node);
            }));
          } else {
            prune(node);
          }
        });
      }
    , each: function (record, node) {
        evaluate(node.getAttribute("select"), function (result) {
          var into = node.getAttribute('into')
            , clone
            , i = 0, item;

          next();

          function next () {
            if (i < result.length) {
              stack.unshift(wrap(node.cloneNode(true)));
              stack[0].context[into] = result[i++]; 
              xmlify(base, stack, stack, stack.length - 1, check(done, function (doc) {
                while (doc.firstChild) {
                  node.parentNode.insertBefore(doc.firstChild, node); 
                }
                next();
              }));
            } else {
              prune(node);
            }
          }
        });
      }
    , value: function (record, node) {
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

    if (children(stack[0].node.firstChild)) {
      done(null, stack[0].node);
    }

    function requisite (attr) {
      var record = stack.shift()
        , into = attr.localName
        , href = attr.nodeValue.replace(/^[^:]+:/, '')
        ;

      resolver(normalize(base, href), "text/javascript", check(done, function (module) {
        record.context[into] = module;
        record.loading++;
        if (visit(record)) resume();
      }));

      return false;
    }

    function include (record) {
      var node = record.node
        , attr = record.include
        , href = normalize(base, attr.nodeValue.replace(/^[^:]+:/, ''))
        ;

      fetch(href, check(done, function (template) {
        var callee = [ wrap(template.doc.cloneNode(true)) ]
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

        xmlify(href, callee, stack, depth + 1, check(done, function (doc) {
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
        record.context[params[i]] = get('attrs')[params[i]];
      }
      layoutNS = attr.nodeValue;
    }

    // It appears that blocks are connectors that disappear, while layouts
    // rewrite and replace themselves.
    function block (record, node) {
      var block = get("blocks")[node.localName].cloneNode(true);

      // Here we need to re-enter the context of the caller.
      caller.unshift(wrap(block));

      xmlify(base, caller, stack, depth + 1, check(done, function (transformed) {
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

    // We cache expressions compiled into functions by their trimmed source. We
    // use the variables in scope the first time the function is encountered. If
    // it works at all, then it supposed to work for every occurrence of the
    // function.
    //
    // A branch in the function may mean that in a subsequent call may
    // references a variable not in the parameter list, because the variable was
    // not in scope the first time the function was compiled. This is going to
    // be an *unfortunate* error and potentially very confusing, how can it not
    // be in scope, when I see it right *there*.
    //
    // If it's a problem, don't go thinking you can add a `try/catch` to
    // recompile the function on an error, because that might have side effects,
    // creating spooky, silent erroneous behavior.
    //
    // The nature of Stencils is such that the do not have much logic in their
    // expressions. Maybe our economies in evaluation will survive application.
    function evaluate (source, consumer) {
      var context = {}, parameters = [], values = [], callbacks = 0
        , i, I, name, result, compiled;
      for (i = 0, I = stack.length; i < I; i++) {
        for (name in stack[i].context) {
          context[name] = stack[i].context[name];
        }
      }
      compiled = functions[source.trim()];
      if (!compiled) {
        for (name in context) parameters.push(name);
        functions[source.trim()] = compiled =
        { parameters: parameters
        , expression: Function.apply(Function, parameters.concat([ "callback", "return " + source ]))
        }
      } else {
        parameters = compiled.parameters;
      }
      for (i = 0, I = parameters.length; i < I; i++) {
        values.push(context[parameters[i]]);
      }
      values.push(function () {
        if (callbacks++) throw new Error("multiple callbacks");
        return function (error, result) {
          if (error) done(error);
          else consumer(result);
        }
      });
      try {
        result = compiled.expression.apply(this, values);
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

  function relativize (base, url) {
    var $;
    if (url[0] == '/') {
      return ($ = /^(https?:\/\/[^\/]+/.exec(base)) ? $[1] + url : url;
    }
    if (!url.indexOf('http')) {
      return url;
    }
    return /^([^?#]*\/).*$/.exec(base)[1] + url;
  }

  function normalize (base, url) {
    var parts = relativize(base, url).split('/'), i, I, normal = [], http = /^https?:$/.test(parts[0]) ? 4 : 1;
    for (i = http, I = parts.length; i < I; i++) {
      if (/\?#/.test(parts[i])) {
        normal.push.apply(normal, parts.slice(i));
        break;
      } if (parts[i] == '..') {
        if (!parts.pop()) throw new Error('underflow');
      } else if (parts[i] != '.') {
        normal.push(parts[i]);
      }
    }
    normal.unshift.apply(normal, parts.slice(0, http));
    return normal.join('/');
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
    url = normalize(base, url);
    fetch(url, check(callback, function (template) {
      var frag = template.doc.createDocumentFragment();
      frag.appendChild(template.doc.documentElement.cloneNode(true));
      var stack = [ wrap(frag) ];
      stack[0].context.source = { file: "foo.js", url: template.url };
      stack[0].funcs = template.funcs;
      xmlify(url, stack, null, 0, check(callback, function () { callback(null, frag.firstChild) }));
    }));
  }


  return { generate: generate };
}; return { create: create }});
