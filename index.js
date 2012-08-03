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
  function createElement (node) {
    return { node: node
           , includes: {}
           , loading: 0
           , assignments: {}
           , context: {}
           , unresolved: []
           , attrs: {}
           };
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

  function validator (callback) {
    return function (forward) { return check(callback, forward) }
  }

  function check (callback, forward) {
    return function (error) {
      if (error) {
        callback(error);
      } else {
        try {
          forward.apply(null, slice.call(arguments, 1));
        } catch (error) {
          callback(error);
        }
      }
    }
  }

  // STEP: stack and caller are objects, where stack is this (rather self or callee).
  function xmlify (stencil, descent, caller, done) {
    var stack = descent.stack
      , stop = stack.length - 1, returned
      , base = descent.url.replace(/\/[^\/]+$/, '/')
      , dirty = {}
      , okay = validator(done)
      , elements =
    { if: function (record, node) {
        var source = node.getAttribute('select').trim()
          , result = evaluate(contextSnapshot(stack), source);

        if (result) {
          xmlify(stencil, descent, caller, okay(function (nodes) {
            while (nodes.firstChild) {
              node.parentNode.insertBefore(nodes.firstChild, node); 
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
            xmlify(stencil, descent, caller, okay(function (nodes, dirty) {
              if (id != null) {
                var snippet = rootObject(context[into],
                  { unique: { source: unique, value: id }
                  , into: into
                  , url: descent.url
                  , dirty: dirty
                  , source: source
                  , node: node.getAttribute('id')
                  });
                insertSnippet(stencil, snippet, node, nodes);
                stencil.snippets[snippet.identifier] = snippet;
                stack.forEach(function (element) {
                  for (var key in element.assignments) {
                    var assignment = element.assignments[key];
                    if (assignment.index != null) {
                      stencil.dynamics[assignment.index].dependencies.push(snippet.identifier);
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
              stack.unshift(createElement(stencil.document.importNode(node, true)));
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
        var parentNode = node.parentNode;
        while (node.firstChild) parentNode.insertBefore(node.firstChild, node);
        parentNode.removeChild(node);
        if (children(parentNode.firstChild)) resume();
      }
    , tag: function (record, node) {
        var parentNode = node.parentNode;
        while (node.firstChild) parentNode.insertBefore(node.firstChild, node);
        parentNode.removeChild(node);
        if (children(parentNode.firstChild)) resume();
      }
    , parameter: function (record, node) {
        assignment(contextSnapshot(caller.stack), stack[1], record.attrs.select, record.attrs.name);
        node.parentNode.removeChild(node);
        resume();
      }
    , block: function (record, node) {
        var name = node.getAttribute('name'), child, block;
        for (child = descent.contents.firstChild; !block && child; child = child.nextSibling) {
          if (child.namespaceURI == descent.namespaceURI && child.localName == name) {
            block = child;
          }
        }
        if (name && block) {
          caller.stack.unshift(createElement(stencil.document.importNode(block, true)));
          xmlify(stencil, caller, descent, okay(function (nodes) {
            caller.stack.shift();
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
        } else if (!name) {
          var contents = stencil.document.importNode(descent.contents, true);
          caller.stack.unshift(createElement(contents));
          caller.stack[0].includes[descent.namespaceURI] = { descent: descent, tags: {} };
          for (child = node.firstChild; child; child = child.nextSibling) {
            if (child.namespaceURI == "stencil") {
              switch (child.localName) {
              case "tag":
                caller.stack[0].includes[descent.namespaceURI].tags[child.getAttribute('name')] = child;
                break;
              case "parameter":
                contents.insertBefore(stencil.document.importNode(child, true), contents.firstChild);
                break;
              }
            }
          }
          xmlify(stencil, caller, descent, okay(function (nodes) {
            while (nodes.firstChild) {
              node.parentNode.insertBefore(nodes.firstChild, node); 
            }
            var parentNode = node.parentNode;
            node.parentNode.removeChild(node);
            resume();
          }));
        }
      }
    };

    if (children(stack[0].node.firstChild)) {
      done(null, stack[0].node, dirty);
    }

    // Adding a space makes it easier for me to jump to the assignment.
    function assignment (context, record, select, into) {
      record.assignments[into] = { select: select, type: "parameter" };
      record.context[into] = evaluate(context, select);
    }

    function prune (node) {
      node.parentNode.removeChild(node);
      resume();
    }

    function rootObject (context, object) {
      object.context = contextSnapshot(stack);
      object.stack = stackSnapshot(stack);
      return object;
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
          var registration = module(true, x(stencil, { dependencies: [], href: href }, snapshot, function (dynamic) {
            record.context[into] = dynamic.value;
            record.assignments[into] = { index: dynamic.index };
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
        , href = normalize(base + attr.nodeValue.replace(/^[^:]+:/, ''))
        ;

      fetch(absolutize(stencil.base, href), okay(function (template) {
        var root = template.nodes
          , child
          ;

        if (!template.tags) {
          template.tags = {};
          if (root.localName == 'include' && root.namespaceURI == NS_STENCIL) {
            for (child = root.firstChild; child; child = child.nextSibling) {
              if (child.localName == 'tag' && child.namespaceURI == NS_STENCIL) {
                var nodes = stencil.document.importNode(root, false);
                nodes.appendChild(stencil.document.importNode(child, true));
                template.tags[child.getAttribute('name')] = nodes;
              }
            }
          }
        }

        stack[0].includes[attr.nodeValue] = template;

        record.include = false;
        if (visit(stack.shift())) resume();
      }));
    }

    function tagged (include, tag, record) {
      var node = record.node
        , href = normalize(base + normalize(node.namespaceURI.replace(/^[^:]+:/, '')))
        , fragment = stencil.document.createDocumentFragment()
        , callee
        ;

      fragment.appendChild(stencil.document.importNode(tag, true));

      if (include.descent) {
        callee = include.descent;
        callee.stack.unshift(createElement(fragment));
        // TODO: Also assignment.
        callee.stack[0].context.attr = record.attrs;
      } else {
        // TODO: contents will be lost. Need to put it in stack.
      callee = createDescent( stencil
                            , { url: href
                              , namespaceURI: node.namespaceURI
                              , contents: node
                              }
                            , fragment
                            , { source: { file: "foo.js", url: href }
                              , attr: record.attrs
                              }
                            );
      }

      xmlify(stencil, callee, descent, okay(function (nodes) {
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

    function stackSnapshot (stack) {
      var vargs = stack.slice(0).reverse().concat(slice.call(arguments, 1))
        , snapshot = [], i, I, name;
      for (i = 0, I = vargs.length; i < I; i++) {
        snapshot.push({ assignments: extend({}, vargs[i].assignments) });
      }
      return snapshot;
    }

    function children (child) {
      for (; child != null; child = child.nextSibling) {
        if (!visit(createElement(child))) return false;
      }
      return true;
    }

    function attribute () {
      var record = stack.shift()
        , node = record.node
        , attr = record.unresolved.shift()
        , isParameter = node.namespaceURI == 'stencil' && node.localName == 'parameter'
        , result = evaluate(contextSnapshot(isParameter ? caller.stack : stack), attr.nodeValue.trim())
        ;
      node.removeAttributeNode(attr);
      if (result != null) {
        result = String(result);
        node.setAttribute(attr.localName, result);
        record.attrs[attr.localName] = result;
      }
      if (visit(record)) resume();
    }

    function visit (record) {
      var node = record.node, completed, i, I, attr, attrs = record.attrs, protocol, tag, inc;
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
            record.unresolved.push(attr);
            break;
          case 0:
            attrs[attr.localName] = attr.nodeValue;
            break;
          }
        }
        if (record.unresolved.length) {
          return attribute();
        }
        if (record.include) {
          return include(record);
        }
        if ("stencil" == node.namespaceURI && elements[node.localName]) {
          return elements[node.localName](record, node); 
        } else if (node.namespaceURI) {
          for (i = 0, I = stack.length; i < I; i++) {
            if ((inc = stack[i].includes[node.namespaceURI]) && (tag = inc.tags[node.localName])) {
              return tagged(inc, tag, record);
            }
          }
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
  // expressions. Maybe our economies in assignment will survive application.
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
    else resolver(absolutize(base, url), "text/xml", check(callback, function (document) {
      // Give each Stencil element an `id` attribute that will be consistent on
      // the server and in the browser.
      var i, I, each = document.getElementsByTagNameNS(NS_STENCIL, '*'); 
      for (i = 0, I = each.length; i < I; i++) {
        each.item(i).setAttribute('id', String(i));
      }
      callback(null,  templates[url] =
      { url: url
      , document: document
      , nodes: document.documentElement
      });
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

  function x (stencil, dynamic, stack, initializer) {
    if (dynamic.index == null) {
      dynamic.index = stencil.dynamics.length;
    }
    stencil.dynamics[dynamic.index] = dynamic;
    return function (error, object) {
      dynamic.value = object;
      if (initializer) {
        initializer(dynamic);
        initializer = null;
      } else {
        update(stencil, dynamic.dependencies.slice(0));
      }
    }
  }

  function assign (stencil, stack, i) {
    stack[i].context = {};
    var context = contextSnapshot(stack.slice(0, i));
    for (var key in stack[i].assignments) {
      var assignment = stack[i].assignments[key];
      if (assignment.index != null) {
        stack[i].context[key] = stencil.dynamics[assignment.index].value;
      } else if (assignment.value) {
        stack[i].context[key] = assignment.value;
      } else {
        die(assignment); 
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
      stack.forEach(function (element, i) { assign(stencil, stack, i); });

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

        var descent = createDescent(stencil, { url: region.url });
        descent.stack = stack;
        stack[0].context[region.into] = table[region.unique.value];
        stack[0].node = stencil.document.importNode(template.document.getElementById(region.node), true);

      xmlify({}, descent, null, function (error, nodes, dirty) {
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
  function deserialize (document) { 
    var stencil = { comments: {}, registrations: [] };
    comments(stencil, document.documentElement);
    stencil.document = document;
    stencil.base = base;
    stencil.node = document.documentElement;
    stencil.node.__stencil__ = stencilId++;
    stencils[stencil.node.__stencil__] = stencil;
    var dynamics = stencil.dynamics.slice(0);

    relink();

    function relink() {
      if (!dynamics.length) return;

      var dynamic = dynamics.shift();
      resolver(absolutize(stencil.base, dynamic.href), "text/javascript", function (error, module) {
        if (error) throw error;
        var registration = module(false, x(stencil, dynamic, []));
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

  // A structure that surrounds a DOM node, create a level in context stack.
  function createDescent (stencil, descent, node, assignments) {
    var key, actual = {};
    extend(descent, { stack: [] });
    descent.stack.unshift(createElement(node));
    for (key in assignments) {
      descent.stack[0].assignments[key] = { value: assignments[key] };
    }
    assign(stencil, descent.stack, 0);
    return descent;
  }

  function generate (url, callback) {
    url = normalize(url);
    fetch(url, check(callback, function (template) {
      // We need a fragment because a document node can have only one element
      // child and some operations will replace the root, prepending the new
      // contents before the old root before removing it.
      var fragment = template.document.createDocumentFragment();
      fragment.appendChild(template.nodes.cloneNode(true));

      // TODO: Actual file names may at times be named something other than
      // `foo.js`.

      // Start a descent.
      var descent = createDescent(stencil, { url: url }, fragment,
      { source: { file: "foo.js", url: template.url }
      });

      //die(descent);

      // We can wrap everything in a closure to get rid of this object, or else
      // we go the other route and objectify everything. No! We need to get to
      // xmlify from both generate and the push end points.
      // 
      // In fact, serialization and closures together are tricky. This is less
      // tricky, but objects &mdash; data and function wrapped up together
      // &mdash; are also tricky, for the same reasons. I'm learning to avoid
      // objects and just pass structures around, which is something that was
      // becoming apparent to me in way back in Java with cassettes.
      var stencil =
      { base: base
      , comments: {}
      , document: template.document
      , dynamics: []
      , identifier: 0
      , snippets: {}
      , registrations: []
      };

      xmlify(stencil, descent, null, check(callback, function () {
        var node;
        // As noted above, template subsitutions can leave extra text in the
        // document root.
        while (fragment.firstChild.nodeType != 1)
          fragment.removeChild(fragment.firstChild);

        stencil.node = node = fragment.firstChild;

        // We track outstanding documents using a application wide map, because
        // we're going to return just the document in the future.
        stencil.node.__stencil__ = stencilId++;
        stencils[stencil.node.__stencil__] = stencil;

        // If we have dynamic regions, we write out their definitions into a
        // document comment. This could perhaps also be a placed in a script
        // tag, but that would only work for HTML.
        if (Object.keys(stencil.snippets).length) {
          var serialize =
          { snippets: stencil.snippets
          , dynamics: stencil.dynamics
          };
          node.appendChild(node.ownerDocument.createComment('// Regions.\n' + JSON.stringify(serialize, null, 2)));
        }

        callback(null, stencil)
      }));
    }));
  }

  return { generate: generate, deserialize: deserialize, deregister: deregister };
}; return { create: create } });
