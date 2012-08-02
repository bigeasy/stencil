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

  function extend (to, from) {
    for (var key in from) to[key] = from[key];
    return to;
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

  // A structure that surrounds a DOM node, create a level in context stack.
  function wrap (node) {
    return  { node: node
            , tags: {}
            , loading: 0
            , evaluations: {}
            , context: {}
            , attrs: {} }
  }

  // `nodes` is a node who's children are inserted before the given `node`.
  function insertSnippet (stencil, snippet, node, nodes) {
    var identifier = stencil.identifier++
      , text = '[' + (identifier)  + ']'
      , parentNode = node.parentNode
      , child 
      , comment
      ;

    extend(snippet, { elements: 0, characters: 0, identifier: identifier });

    // TODO: To implement specific place-holders, keep this comment. Count the
    // number of character at the outset. If you encounter a place holder,
    // remove this comment.
    stencil.comments[text] = parentNode.insertBefore(node.ownerDocument.createComment(text), node);

    // TODO: What to do about wierdos, like comments and PIs.
    while (nodes.firstChild) {
      child = nodes.firstChild;
      switch (child.nodeType) {
      case 1:
        snippet.elements++;
        snippet.characters = 0;
        break;
      case 3:
      case 4:
        snippet.characters += child.nodeValue.length;
        break;
      }
      parentNode.insertBefore(child, node); 
    }

    snippet.comment = text;

    return snippet;
  }

  // TODO: depth not used.
  // STEP: stack and caller are objects, where stack is this (rather self or callee).
  function xmlify (stencil, url, stack, caller, depth, done) {
    var elements, layoutNS = "", stop = stack.length - 1, returned, dirty = {};

    var base = url.replace(/\/[^\/]+$/, '/');

    function prune (node) {
      node.parentNode.removeChild(node);
      resume();
    }

    function rootObject (context, object) {
      object.context = contextSnapshot(stack);
      object.stack = stackSnapshot(stack);
      return object;
    }

    elements =
    { if: function (record, node) {
        var source = node.getAttribute('select').trim()
          , result = evaluate(contextSnapshot(stack), source);

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
      }
    , each: function (record, node) {
        var source = node.getAttribute('select').trim()
          , result = evaluate(contextSnapshot(stack), source);
        // Need to callback result if it is dynamic.

        replace(result);
        
        // TODO Use callback.
        function replace (result) {
          var into = node.getAttribute('into')
            , limit = node.getAttribute('limit')
            , unique = node.getAttribute('unique')
            , clone
            , context
            , i = 0, item;

          if (limit == '' || limit == null) limit = result.length;
          limit = Math.min(limit, result.length);

          next();

          // TODO: I'm expecting base to always be a full url.
          function execute (id) {
            xmlify(stencil, url, stack, stack, stack.length - 1, check(done, function (nodes, dirty) {
              if (id != null) {
                var snippet = rootObject(context[into],
                  { unique: { source: unique, value: id }
                  , into: into
                  , url: url
                  , dirty: dirty
                  , source: source
                  , node: node.getAttribute('id')
                  });
                insertSnippet(stencil, snippet, node, nodes);
                stencil.snippets[snippet.identifier] = snippet;
                stack.forEach(function (element) {
                  for (var key in element.evaluations) {
                    var evaluation = element.evaluations[key];
                    if (evaluation.index != null) {
                      stencil.evaluations[evaluation.index].dependencies.push(snippet.identifier);
                    }
                  }
                });
              } else {
                while (nodes.firstChild) {
                  node.parentNode.insertBefore(nodes.firstChild, node); 
                }
              }
              next();
            }));
          }

          function next () {
            if (i < limit) {
              stack.unshift(wrap(node.cloneNode(true)));
              stack[0].context[into] = result[i++]; 
              context = contextSnapshot(stack);
              if (unique) {
                execute(evaluate(context, unique));
              } else {
                execute();
              }
            } else {
              prune(node);
            }
          }
        }
      }
    , value: function (record, node) {
        var source = node.getAttribute('select').trim()
          , result = evaluate(contextSnapshot(stack), source)
          ;
        dirty[node.getAttribute('id')] = result;
        var text = node.ownerDocument.createTextNode(result)
        node.parentNode.insertBefore(text, node);
        node.parentNode.removeChild(node);
        record.node = text;
        resume();
      }
    , include: function (record, node) {
        for (var child = node.firstChild; child; child = child.nextSibling) {
          if (child.nodeType == 1 && child.localName == "tag") {
            caller[0].tags[caller.namespaceURI][child.getAttribute('name')] = child;
          }
        }
        record.include = false;
        record.node = { nextSibling: null };
        resume();
      }
    , block: function (record, node) {
        var name = node.getAttribute('name');
        var block;
        for (var child = stack.contents.firstChild; !block && child; child = child.nextSibling) {
          if (child.namespaceURI == stack.namespaceURI && child.localName == name) {
            block = child;
          }
        }
        if (block) {
          caller.unshift(wrap(block));
          xmlify(stencil, url, caller, stack, depth + 1, check(done, function (nodes) {
            caller.shift();
            var child;
            record.node = { nextSibling: node.nextSibling };
            while (child = nodes.firstChild) {
              child = nodes.removeChild(child);
              child.nextSibling = child.previousSibling = null;
              child = node.ownerDocument.importNode(child, true);
              node.parentNode.insertBefore(child, node);
              record.node = child;
            }
            node.parentNode.removeChild(node);
            resume();
          }));
        } else {
          die('not implemented');
        }
      }
    };

    if (children(stack[0].node.firstChild)) {
      done(null, stack[0].node, dirty);
    }

    // @maxogden: jsonp is only for single origin policy restricted GETs
    function requisite (attr) {
      var record = stack.shift()
        , into = attr.localName
        , href = normalize(attr.nodeValue.replace(/^[^:]+:/, ''))
        ;

      href = normalize(base + href);
      resolver(absolutize(stencil.base, href), "text/javascript", check(done, function (module) {
        if (typeof module == 'function' && module.name == 'dynamic') {
          var snapshot = stackSnapshot(stack, record);
          var registration = module(true, x(stencil, { dependencies: [], href: href }, snapshot, function (evaluation) {
            record.context[into] = evaluation.value;
            record.evaluations[into] = { index: evaluation.index };
            record.loading++;
            if (visit(record)) resume();
          }));
          stencil.registrations.push(registration);
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
        , href = normalize(attr.nodeValue.replace(/^[^:]+:/, ''))
        ;

      href = normalize(base + href);
      fetch(absolutize(stencil.base, href), check(done, function (template) {
        var callee = [ wrap(template.doc.cloneNode(true)) ]
          , i, I
          ;

        callee[0].context =
        { source: { file: "foo.js", url: template.url }
        };
        record.tags[attr.nodeValue] = {};

        extend(stack, { namespaceURI: attr.nodeValue });

        xmlify(stencil, href, callee, stack, depth + 1, check(done, function () {
          record.include = false;
          if (visit(stack.shift())) resume();
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

    function tagged (tag, record) {
      var node = record.node
        , href = normalize(node.namespaceURI.replace(/^[^:]+:/, ''))
        , callee = [ wrap(stencil.doc.importNode(tag, true)) ]
        ;
      href = normalize(base + href);
      callee[0].context =
      { source: { file: "foo.js", url: href }
//      , caller: record.node
      , attr: record.attrs
      };
      extend(callee, { namespaceURI: node.namespaceURI, contents: node });
      xmlify(stencil, href, callee, stack, depth + 1, check(done, function (nodes) {
        var child;
        record.node = { nextSibling: node.nextSibling };
        while (child = nodes.firstChild) {
          child = nodes.removeChild(child);
          child.nextSibling = child.previousSibling = null;
          child = node.ownerDocument.importNode(child, true);
          node.parentNode.insertBefore(child, node);
        }
        node.parentNode.removeChild(node);
        resume();
      }));
    }

    // It appears that blocks are connectors that disappear, while layouts
    // rewrite and replace themselves.
    function block (record, node) {
      var block = get("blocks")[node.localName].cloneNode(true);

      // Here we need to re-enter the context of the caller.
      caller.unshift(wrap(block));

      xmlify(stencil, url, caller, stack, depth + 1, check(done, function (transformed) {
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
        done(null, record.node, dirty);
      }
    }

    function get (name) {
      for (var i = stack.length - 1; i != -1; i--)
        if (stack[i].context[name]) return stack[i].context[name];
    }

    function stackSnapshot (stack) {
      var vargs = stack.slice(0).reverse().concat(slice.call(arguments, 1))
        , snapshot = [], i, I, name;
      for (i = 0, I = vargs.length; i < I; i++) {
        snapshot.push({ evaluations: extend({}, vargs[i].evaluations) });
      }
      return snapshot;
    }

    function children (child) {
      for (; child != null; child = child.nextSibling) {
        if (!visit(wrap(child))) return false;
      }
      return true;
    }

    function visit (record) {
      var node = record.node, completed, i, I, attr, attrs = record.attrs, protocol, blocks, tag;
      stack.unshift(record);
      if (node.nodeType == 1) {
        for (I = node.attributes.length; record.loading < I; record.loading++) {
          attr = node.attributes.item(record.loading);
          switch (attr.namespaceURI || 0) {
          case "http://www.w3.org/2000/xmlns/":
            if (protocol = attr.nodeValue.split(/:/).shift()) {
              if (!"require".indexOf(protocol)) return requisite(attr);
              if (!"include".indexOf(protocol)) record.include = attr;
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
        if ("stencil" == node.namespaceURI && elements[node.localName]) {
          return elements[node.localName](record, node); 
        } else if (node.namespaceURI) {
          for (i = 0, I = stack.length; i < I; i++) {
            if (tag = stack[i].tags[node.namespaceURI][node.localName]) {
              return tagged(tag, record);
            }
          }
          /*return block(record, node);*/
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
  function evaluate (context, source) {
    var parameters = [], values = [], callbacks = 0
      , i, I, name, result, compiled;
    source = source.trim();
    compiled = functions[source];
    if (!compiled) {
      for (name in context) parameters.push(name);
      functions[source] = compiled =
      { parameters: parameters
      , expression: Function.apply(Function, parameters.concat([ "return " + source ]))
      }
    } else {
      parameters = compiled.parameters;
    }
    for (i = 0, I = parameters.length; i < I; i++) {
      values.push(context[parameters[i]]);
    }
    try {
      result = compiled.expression.apply(this, values);
    } catch (error) {
      throw error;
      done(error);
    }
    return result;
  }

  var templates = {};

  function check(callback, next) {
    return function (error) {
      if (error) callback(error);
      else next.apply(this, slice.call(arguments, 1));
    }
  }

  function absolutize (base, url) {
    return normalize(url[0] == '/' ? url : base + '/' + url);
  }

  function normalize (url) {
    var parts = url.split('/'), i, I, normal = [];
    for (i = 0, I = parts.length; i < I; i++) {
      if (/\?#/.test(parts[i])) {
        normal.push.apply(normal, parts.slice(i));
        break;
      } if (parts[i] == '..') {
        if (normal.length && normal[normal.length - 1] != '..') {
          if (normal.length == 1 && normal[0] == '') throw new Error('underflow');
          normal.pop();
        } else {
          normal.push(parts[i]); 
        }
      } else if ((parts[i] != '' || i == 0) && parts[i] != '.') {
        normal.push(parts[i]);
      }
    }
    return normal.join('/');
  }

  function fetch (url, callback) {
    url = normalize(url);
    if (templates[url]) callback(null, templates[url]);
    else resolver(absolutize(base, url), "text/xml", check(callback, function (doc) {
      // Give each Stencil element an `id` attribute that will be consistent on
      // the server and in the browser.
      var i, I, each = doc.getElementsByTagNameNS(NS_STENCIL, '*'); 
      for (i = 0, I = each.length; i < I; i++) {
        each.item(i).setAttribute('id', String(i));
      }
      callback(null,  templates[url] = { url: url, doc: doc });
    }));
  }

  function comments (stencil, child) {
    for (;child;child = child.nextSibling) {
      if (child.nodeType == 8) {
        if (/^\[\d+\]$/.test(child.nodeValue)) {
          stencil.comments[child.nodeValue] = child;
        } else {
          var json = child.nodeValue.replace(/^\/\/ Regions./, '');
          if (json.length != child.nodeValue.length) {
            extend(stencil, JSON.parse(json));
          }
        }
      }
      comments(stencil, child.firstChild);
    }
  }

  function x (stencil, evaluation, stack, initializer) {
    if (evaluation.index == null) {
      evaluation.index = stencil.evaluations.length;
    }
    stencil.evaluations[evaluation.index] = evaluation;
    return function (error, object) {
      evaluation.value = object;
      if (initializer) {
        initializer(evaluation);
        initializer = null;
      } else {
        update(stencil, evaluation.dependencies.slice(0));
      }
    }
  }

  function update (stencil, dependencies) {
    var regions = {}, templates = {};

    step();

    // Probably not using snapshot.

    function step () {
      if (!dependencies.length) return;

      var region = stencil.snippets[dependencies.shift()];

      var stack = region.stack.slice(0);
      stack.forEach(function (element, i) {
        stack[i].context = {};
        var context = contextSnapshot(stack.slice(0, i));
        for (var key in element.evaluations) {
          var evaluation = element.evaluations[key];
          if (evaluation.index != null) {
            region.stack[i].context[key] = stencil.evaluations[evaluation.index].value;
          } else if (evaluation.value) {
            region.stack[i].context[key] = evaluation.value;
          } else {
            die(evaluation); 
          }
        }
      });

      stack.reverse();

      var context = contextSnapshot(stack)
        , key = region.url + '#' + region.identifier, table;

      if (!(table = templates[key])) {
        table = templates[key] = {}; 
        evaluate(context, region.source).forEach(function (record) {
          context[region.into] = record;
          table[evaluate(context, region.unique.source)] = record;
        });
      }

      fetch(absolutize(stencil.base, region.url), generate);

      function generate (error, template) {
        if (error) throw error;
        region.stack[0].context[region.into] = table[region.unique.value];
        region.stack[0].node = template.doc.getElementById(region.node).cloneNode(true);

      xmlify({}, region.url, region.stack, null, 0, function (error, nodes, dirty) {
        if (error) throw error;
        // Somehow, I don't believe the counts will mismatch without this also
        // mismatching.
        var count = 0;
        for (var key in dirty) {
          if (region.dirty[key] === dirty[key]) {
            count++;
          }
        }
        if (Object.keys(region.dirty).length != count) {
          var comment = stencil.comments[region.comment]
            , parentNode = comment.parentNode
            , factory = comment.ownerDocument
            , count, removed, chars
            ;
          for (count = region.elements; count; count--) {
            while (parentNode.removeChild(comment.nextSibling).nodeType != 1);
          }
          var length;
          for (count = region.characters; count;) {
            removed = parentNode.removeChild(comment.nextSibling)
            count -= (length = Math.min(count, removed.nodeValue.length));
          }
          if (length < removed.nodeValue.length) {
            var text = removed.nodeValue.slice(length);
            parentNode.insertBefore(removed, comment.nextSibling);
            removed.splitText(length);
            parentNode.removeChild(removed.nextSibling);
          }
          stencil.comments[region.comment] = parentNode.insertBefore(parentNode.ownerDocument.createComment(comment.nodeValue), comment);
          while (nodes.firstChild) {
            parentNode.insertBefore(nodes.firstChild, comment);
          }
          parentNode.removeChild(comment);
        }
        step();
      });
      }
    }
  }

  function contextSnapshot (source) {
    var context = {}, i, I, name, source = source || stack;
    for (i = 0, I = source.length; i < I; i++) {
      for (name in source[i].context) {
        if (name[0] != '!') context[name] = source[i].context[name];
      }
    }
    return context;
  }

  var stencils = {}, stencilId = 0;
  // STEP: NEEDS CALLBACK.
  function deserialize (dom) { 
    var stencil = { comments: {}, registrations: [] };
    comments(stencil, dom.documentElement);
    stencil.base = base;
    stencil.node = dom.documentElement;
    stencil.node.__stencil__ = stencilId++;
    stencils[stencil.node.__stencil__] = stencil;
    var evaluations = stencil.evaluations.slice(0);

    relink();

    function relink() {
      if (!evaluations.length) return;

      var evaluation = evaluations.shift();
      resolver(absolutize(stencil.base, evaluation.href), "text/javascript", function (error, module) {
        if (error) throw error;
        var registration = module(false, x(stencil, evaluation, []));
        stencil.registrations.push(registration);
      });
    }

    return stencil;
  }

  function deregister (node) {
    var stencil = stencils[node.__stencil__];
    stencil.registrations.forEach(function (unlink) {
      unlink();
    });
    delete stencils[node.__stencil__];
  }

  function generate (url, callback) {
    url = normalize(url);
    fetch(url, check(callback, function (template) {
      var frag = template.doc.createDocumentFragment();
      frag.appendChild(template.doc.documentElement.cloneNode(true));
      var stack = [ wrap(frag) ];
      stack[0].context.source = { file: "foo.js", url: template.url };
      stack[0].evaluations.source = { value: stack[0].context.source };
      var stencil = { snippets: {}, identifier: 0, comments: {}, registrations: [], evaluations: [] };
      stencil.doc = template.doc;
      stencil.base = base;
      xmlify(stencil, url, stack, null, 0, check(callback, function () {
        var node;
        while (frag.firstChild.nodeType != 1) frag.removeChild(frag.firstChild);
        stencil.node = node = frag.firstChild;
        stencil.node.__stencil__ = stencilId++;
        stencils[stencil.node.__stencil__] = stencil;
        if (Object.keys(stencil.snippets).length) {
          var serialize =
          { snippets: stencil.snippets
          , evaluations: stencil.evaluations
          };
          node.appendChild(node.ownerDocument.createComment('// Regions.\n' + JSON.stringify(serialize, null, 2)));
        }
        callback(null, stencil)
      }));
    }));
  }

  return { generate: generate, deserialize: deserialize, deregister: deregister };
}; return { create: create } });
