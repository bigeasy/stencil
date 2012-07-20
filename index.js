!function (definition) {
  if (typeof module == "object" && module.exports) module.exports = definition();
  else if (typeof define == "function" && typeof define.amd == "object") define(definition);
  else this.tz = definition();
} (function () { function create (base, resolver) {
  var slice = [].slice;

  function die () {
    console.log.apply(console, slice.call(arguments, 0));
    return process.exit(1);
  };

  function say () { return console.log.apply(console, slice.call(arguments, 0)) }

  var trace = {}, getters = {};

  function extend (base, name) {
    return base + '/' + escape(name).replace(/\//g, '%2f');
  }

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

  // Because they can be shared across templates, We cache expressions compiled
  // into functions by their trimmed source.
  var functions = {};

  function wrap (node) {
    return  { node: node
            , loading: 0
            , trace: []
            , context: {}
            , attrs: {} }
  }

  function xmlify (stencil, base, stack, caller, depth, done) {
    var elements, layoutNS = "", stop = stack.length - 1, returned, trace = stack[stop].trace;

    // TODO Belongs elsewhere.
    var hrefs = {};

    function prune (node) {
      node.parentNode.removeChild(node);
      resume();
    }

    function popTrace () {
      return trace.splice(trace.lastIndexOf('')).slice(1);
    }

    function rootObject (context, object) {
      var refs = popTrace(), path, root = refs[0].split(/\//), i, I, j, paths = [], path, context;
      for (j = refs.length - 1; j != 0; j--) {
        var path = refs[j].split(/\//);
        for (i = 0, I = path.length < root.length ? path.length : root.length; i < I; i++) {
          if (path[i] != root[i]) {
            root = root.slice(0, i);
            break;
          }
        }
      }
      for (j = refs.length - 1; j != -1; j--) {
        paths.push({ path: refs[j].split(/\//).slice(root.length) });
      }
      object.context = contextSnapshot();
      // TODO: You want to delete the root object in all cases.
      if (Array.isArray(getJSON(hrefs[unescape(root[1])], root.slice(3, root.length - 1)))) {
        root = root.slice(0, root.length - 1);
        delete object.context[root[2]];
      }
      for (j = refs.length - 1; j != -1; j--) {
        paths[j].value = getJSON(context, paths[j].path);
      }
      if (root.length == 3) root.pop();
      object.root = root.join('/');
      object.references = paths;
      return object;
    }

    elements =
    { if: function (record, node) {
        evaluate(contextSnapshot(), node.getAttribute('select'), function (result) {
          if (result) {
            xmlify(stencil, base, stack, stack, stack.length - 1, check(done, function (doc) {
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
    // TODO Note that `each` is the same thing as `with`.
    , each: function (record, node) {
        evaluate(contextSnapshot(), node.getAttribute('select'), function (result) {
          var into = node.getAttribute('into')
            , limit = node.getAttribute('limit')
            , unique = node.getAttribute('unique')
            , clone
            , context
            , i = 0, item;

          if (limit == '' || limit == null) limit = result.length;
          limit = Math.min(limit, result.length);

          next();

          function execute (id) {
            xmlify(stencil, base, stack, stack, stack.length - 1, check(done, function (doc) {
              var children = [];
              while (doc.firstChild) {
                children.push(node.parentNode.insertBefore(doc.firstChild, node)); 
              }
              if (id != null) {
                stencil.snippets.push(rootObject(context[into],
                  { unique: { name: unique, value: id }
                  , into: into
                  , node: node
                  , children: children
                }));
              }
              next();
            }));
          }

          function next () {
            if (i < limit) {
              stack.unshift(wrap(node.cloneNode(true)));
              stack[0].context[into] = result[i++]; 
              context = contextSnapshot();
              if (unique) {
                trace.push('');
                evaluate(context, unique, execute);
              } else {
                execute();
              }
            } else {
              prune(node);
            }
          }
        });
      }
    , value: function (record, node) {
        evaluate(contextSnapshot(), node.getAttribute("select"), function (result) {
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

    // With thanks to a chat with @hughfdjackson on ##javascript.
    function getter (proto, cache, key, path) {
      return function () {
        if ((object = cache[key]) === void 0) {
          var object = proto[key];
          if (typeof object == 'object' && object != null) {
            object = observe(object, extend(path, key));
          }
          cache[key] = object;
        }
        if (typeof object != 'object' || object == null) {
          trace.push(extend(path, key));
        }
        return object;
      }
    }

    function observe (proto, path) {
      var i, I, key, object, cache, properties;
      if (Array.isArray(proto)) {
        object = proto.slice(0);
        for (i = 0, I = object.length; i < I; i++) {
          object[i] = observe(object[i], extend(path, i), trace);
        }
      } else {
        object = {}, cache = {}, properties = {};
        for (key in proto) properties[key] = { get: getter(proto, cache, key, path), enumerable: true };
        Object.defineProperties(object, properties);
      }
      return object;
    }

    // @maxogden: jsonp is only for single origin policy restricted GETs
    function requisite (attr) {
      var record = stack.shift()
        , into = attr.localName
        , href = normalize(base, attr.nodeValue.replace(/^[^:]+:/, ''))
        ;

      // TODO: I sense that this is all wrong. The application itself is going
      // to want to update the document. Here we are asking the resolver to ask
      // a library. But, I imagine that we're not going to be pulling things in
      // from an library all the time. That sometimes, we're going to want to
      // update a template by forcing some JavaScript into the template.
      //
      // Right now, I really want a data bus. It would be easier to understand,
      // add an abstraction layer, bind things loosely. I can imagine a data
      // bus. I cannot imagine a functional composition.
      //
      // I suppose, for now, I can go ahead and fire off snippets directly using
      // the thing that I got back, because from where I'm sitting, I can't see
      // any one way to wire these programs together.
      //
      // Need to step back and remember that I want to see this from the
      // perspective of the templates, not from MVC frameworkery.
      resolver(href, "text/javascript", check(done, function (module) {
        if (typeof module == 'function' && module.name == 'json') {
          function expires () {}
          var trace = [];
          module(expires, function (error, object) {
            var prototype = {};
            prototype[into] = object;
            hrefs[href] = object;
            stencil.hrefs = {};
            stencil.hrefs[href] = object;
            Object.defineProperty(record.context, into, { get: getter(prototype, {}, into, extend('', href)), enumerable: true });
            record.loading++;
            if (visit(record)) resume();
          });
        } else {
          record.context[into] = module;
          record.loading++;
          if (visit(record)) resume();
        }
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

        callee[0].context =
        { source: { file: "foo.js", url: template.url }
        , caller: record.node
        , attrs: record.attrs
        , blocks: {}
        };

        for (i = 0, I = blocks.length; i < I; i++) {
          callee[0].context.blocks[blocks[i].localName] = blocks[i];
        }

        xmlify(stencil, href, callee, stack, depth + 1, check(done, function (doc) {
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

      xmlify(stencil, base, caller, stack, depth + 1, check(done, function (transformed) {
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
      for (var i = stack.length - 1; i != -1; i--)
        if (stack[i].context[name]) return stack[i].context[name];
    }

    function watchable (context) {
      for (i = stack.length - 1; i != -1; i--)
        for (j = stack[i].trace.length - 1; j != -1; j--)
          if (stack[i].trace[j].object == context) return stack[i].trace[j];
    }

    function watch (context, selector) {
      var path = select.split('/'), i, I, state = watchable(context), object = context;
      for (i = 0, I = path.length; i < I; i++) {
        object = object[path[i]];
      }
      stack[0].trace.push({ object: object, path: state.path + '/' + path });
      return object;
    }

    function contextSnapshot () {
      var context = {}, i, I, name;
      for (i = 0, I = stack.length; i < I; i++) {
        for (name in stack[i].context) {
          if (name[0] != '!') context[name] = stack[i].context[name];
        }
      }
      return context;
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
      } else if (node.nodeType == 4) {
        node.parentNode.replaceChild(document.createTextNode(node.nodeValue), node);
      }
      completed = children(node.firstChild);
      stack.shift();
      return completed;
    }
  }

  // We cache expressions compiled into functions by their trimmed source. We
  // use the variables in scope the first time the function is encountered. If
  // it works at all, then it supposed to work for every occurrence of the
  // function.
  //
  // A branch in the function may mean that in a subsequent call may references
  // a variable not in the parameter list, because the variable was not in scope
  // the first time the function was compiled. This is going to be an
  // *unfortunate* error and potentially very confusing, how can it not be in
  // scope, when I see it right *there*.
  //
  // If it's a problem, don't go thinking you can add a `try/catch` to recompile
  // the function on an error, because that might have side effects, creating
  // spooky, silent erroneous behavior.
  //
  // The nature of Stencils is such that the do not have much logic in their
  // expressions. Maybe our economies in evaluation will survive application.
  function evaluate (context, source, consumer) {
    var parameters = [], values = [], callbacks = 0
      , i, I, name, result, compiled;
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

  function getJSON (object, path) {
    var i, I;
    for (i = 0, I = path.length; i < I; i++) {
      object = object[unescape(path[i])];
      if (!object) return null;
    }
    return object;
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
      callback(null,  templates[url] = { url: url, doc: doc });
    }));
  }

  function _generate (url, caller, stack, callback) {
    if (typeof url != "string") throw new Error();
  }

  // Structure is a little funky. The same unique id would be used for all
  // members.
  function descend (branch, object, counter) {
    var i, I, object, key;
    if (Array.isArray(branch)) {
      var into = branch[0].into
        , unique = branch[0].unique.name
        , context = branch[0].context
        , table = {}
        , key;

      object = object.slice(0);

      counter.count++;
      gather();

      function gather () {
        if (!object.length) return compare();
        context[into] = object.shift();
        evaluate(context, unique, function (key) {
          table[key] = context[into];
          gather();
        });
      }

      function compare () {
        if (!branch.length) return complete();
        var snippet = branch.shift(), i, I;
        var update = table[snippet.unique.value]
        var dirty;
        if (update) {
          for (i = 0, I = snippet.references.length; !dirty && i < I; i++) {
            var actual = getJSON(update, snippet.references[i].path);
            if (actual != snippet.references[i].value) {
              dirty = true;
            }
          }
        }
        if (dirty) {
          var stack = [ wrap(snippet.node.cloneNode(true)) ];
          stack[0].context = context;
          stack[0].context[snippet.into] = update;
          xmlify({}, snippet.url,  stack, null, 0, function (error, doc) {
            if (error) throw error;
            var child;
            while (snippet.children.length != 1) {
              child = snippet.children.shift();
              child.parentNode.removeChild(child);
            }
            child = snippet.children.shift(); 
            while (doc.firstChild) {
              snippet.children.push(child.parentNode.insertBefore(doc.firstChild, child)); 
            }
            child.parentNode.removeChild(child);
            compare();
          });
        } else {
          compare();
        }
      }

      function complete() {
        counter.callback();
      }
    } else {
      for (key in branch) {
        descend(branch[key], object[key], counter);
      }
    }
  }

  function update (url, json, callback) {
    var snippets = this.snippets,
        check = [], tree = {}, branch = tree, i, I, j, J, completed = 0;
    for (i = 0, I = snippets.length; i < I; i++) {
      if (snippets[i].root.substring(1) == url) {
        branch = tree;
        var path = snippets[i].root.split('/').slice(1);
        for (j = 0, J = path.length; j < J - 1; j++) {
          branch = branch[path[j]] || (branch[path[j]] = {});
        }
        (branch[path[j]] || (branch[path[j]] = [])).push(snippets[i]);
      }
    }
    var wrapper = {};
    wrapper[url] = json;
    var counter = { count: 1, callback: function () {
      if (++completed == counter.count) {
        callback(null);
      }
    }};
    descend(tree, wrapper, counter);
    counter.callback();
  }

  function generate (url, callback) {
    url = normalize(base, url);
    fetch(url, check(callback, function (template) {
      var frag = template.doc.createDocumentFragment();
      frag.appendChild(template.doc.documentElement.cloneNode(true));
      var stack = [ wrap(frag) ];
      stack[0].context.source = { file: "foo.js", url: template.url };
      var stencil = { snippets: [] };
      xmlify(stencil, url, stack, null, 0, check(callback, function () {
        stencil.node = frag.firstChild;
        stencil.update = update;
        callback(null, stencil)
      }));
    }));
  }

  return { generate: generate };
}; return { create: create }});
