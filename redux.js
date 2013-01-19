! function (definition) {
  if (typeof module == "object" && module.exports) definition(require, module.exports, module);
  else if (typeof define == "function" && typeof define.amd == "object") define(definition);
} (function (require, exports, module) { exports.create = function (base, resolver) {
  var slice = [].slice, templates = {};

  function die () {
    console.log.apply(console, slice.call(arguments, 0));
    return process.exit(1);
  }

  function say () { return console.log.apply(console, slice.call(arguments, 0)) }

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

  function extend (to, from) {
    for (var key in from) to[key] = from[key];
    return to;
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

  var NS_STENCIL = "stencil",
      XMLNS = "http://www.w3.org/2000/xmlns/";

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

  //
  var functions = {};

  //
  function evaluate (source, context, callback) {
    var parameters = [], values = [], callbacks = 0,
        i, I, name, result, compiled;
    source = source.trim();
    compiled = functions[source];
    if (!compiled) {
      for (name in context) parameters.push(name);
      functions[source] = compiled = {
        parameters: parameters,
        expression: Function.apply(Function, parameters.concat([ "return " + source ]))
      }
    } else {
      parameters = compiled.parameters;
    }
    for (i = 0, I = parameters.length; i < I; i++) {
      values.push(context[parameters[i]]);
    }
    invoke(compiled.expression.apply(this, values), context, callback);
  }

  function invoke (result, context, callback) {
    try {
      if (typeof result == "function") {
        result(context, callback); 
      } else {
        callback(null, result);
      }
    } catch (e) {
      callback(e);
    }
  }

  function mark (marker, directive, instance, depth) {
    var reference = marker.nodeType ? marker : marker.reference,
        offsets = [ instance.elements, instance.characters ].join(":"),
        key = [ directive.id, depth, offsets ].join(";"),
        comment = marker.parentNode.ownerDocument.createComment("(Stencil[" + key + "])");
    return marker.parentNode.insertBefore(comment, reference);
  }

  function unmark (marker, instance) {
    var i, removed, parentNode = marker.parentNode;
    for (i = instance.elements; i; i--) {
      parentNode.removeChild(marker.nextSibling);
    }
    for (i = instance.characters; i > 0; i -= removed.nodeValue.length) {
      removed = parentNode.removeChild(marker.nextSibling)
    }
    if (i < 0) {
      parentNode.insertBefore(removed, marker.nextSibling); 
      removed.splitText(removed.nodeValue.length + i);
      parentNode.removeChild(marker.nextSibling);
    }
    removed = { parentNode: parentNode, reference: marker.nextSibling };
    parentNode.removeChild(marker);
    return removed;
  }

  function comments (template, descent, node) {
    var $, i, I, path, part, parts, offsets, children = {}, instance, contains;
    if (node.nodeType == 8 && ($ = /^\(Stencil\[(.+)\]\)$/.exec(node.nodeValue))) {
      parts = $[1].split(/;/);
      offsets = parts[2].split(/:/);
      offsets = { elements: +(offsets[0]), characters: +(offsets[1]) }
      part = extend({ url: parts[0], depth: parts[1], id: parts[2] }, offsets);
      path = [ part ];
      for (i = 0, I = descent.length; i < I; i++) {
        if (path[path.length - 1].depth != descent[i].depth) {
          path.unshift(descent[i]);
        }
      }
      descent.unshift(part);
      // **TODO**: Nest for collections.
      for (i = 0, I = path.length; i < I; i++) {
        path[i] = path[i].url + ";" + path[i].depth;
      }
      extend(follow(template, path), extend({ marker: node }, offsets));
    }
    contains = descent.length + 1;
    for (node = node.firstChild; node; node = node.nextSibling) {
      comments(template, descent, node);
      if (contains == descent.length) {
        switch (node.nodeType) {
        case 1:
          descent[0].elements--;
          break;
        case 3:
          if (!descent[0].elements) {
            descent[0].characters -= node.nodeValue.length;
          }
          break;
        }
        if (descent[0].elements <= 0 && descent[0].characters <= 0) {
          descent.shift();
        }
      } else if (contains < descent.length) {
        throw new Error("cannot reconstitute");
      }
    }
  }

  function instanciate (template) {
    return {
      document: template.document,
      url: template.url,
      directives: JSON.parse(JSON.stringify(template.directives)),
      instanceId: 0,
      instances: {}
    }
  }

  function reconstitute (document, callback) {
    var okay = validator(callback), child, url;

    for (child = document.documentElement.firstChild; child; child = child.nextSibling) {
      if (child.nodeType == 8) {
        url = child.nodeValue.replace(/^Stencil\/Template:/, '');
        if (url.length != child.nodeValue.length) break;
        url = null;
      }
    }

    fetch(url, okay(fetched));

    function fetched (template) {
      template = instanciate(template); 

      comments(template, [], document);

      callback(null, { document: document, _template: template });
    }
  }

  function abracadabra (template, document, parameters, path, depth, callback) {
    var context, okay = validator(callback);

    var handlers = {
      // The value directive replaces a value element with text from the current
      // context.
      value: function (directive, element, context, path, callback) {
        var source = element.getAttribute("select").trim(),
            instance = follow(template, path),
            marker = unmark(instance.marker, instance);

        evaluate(source, context, okay(function (value) {
          // Record the instance.
          instance.characters = String(value).length;
          instance.elements = 0;

          // Mark the new insert.
          instance.marker = mark(marker, directive, instance, depth);

          // Insert the text value.
          marker.parentNode.insertBefore(document.createTextNode(value), marker.reference);

          callback();
        }));
      },
      marker: function (directive, element, context, path, callback) {
        var instance = follow(template, path),
            marker = instance.marker,
            marked = marker.nodeType == 1 ? marker.parentNode : marker.nextSibling,
            attributes = directive.attributes.slice(0);

        // If the element marker it still in place, replace with a comment
        // marker for the duration. It never needs to be recalculated.
        if (marker.nodeType == 1) {
          unmark(marker, instance)
          instance.marker = mark(marked, directive, instance, depth);
        }

        rewrite();

        function rewrite () {
          var attribute; 
          if (attribute = attributes.shift()) {
            evaluate(attribute.value, context, okay(function (value) {
              if (value == null) {
                marked.removeAttribute(attribute.name);
              } else {
                marked.setAttribute(attribute.name, value);
              }
              rewrite();
            }));
          } else {
            callback();
          }
        }
      }
    }

    next({ directives:  template.directives.slice(0), context: parameters });

    function next (descent) {
      if (descent.directives.length) descend(descent);
      else if (descent.parent) next(descent.parent);
      else callback();
    }

    function descend (parent) {
      var directive = parent.directives.shift(),
          operations = directive.operations.slice(0),
          descent = { directives: directive.directives.slice(0), parent: parent, context: {} },
          stack = [], i;

      // Create an evaluation context.
      context = {};
      for (i = descent; i; i = i.parent) stack.push(i);
      for (i = stack.length - 1; i != -1; i--) {
        for (var key in stack[i].context) {
          context[key] = stack[i].context[key];
        }
      }

      operate();

      function operate () {
        var operation = operations.shift() || {};
        switch (operation.type) {
        case "require":
          resolver(template.base + '/' + operation.href, "text/javascript", okay(function (module) {
            invoke(module, context, okay(function (value) {
              context[operation.name] = descent.context[operation.name] = value;
              operate();
            }));
          }));
          break;
        default:
          if (directive.id) rewrite();
          else resume();
          break; 
        }
      }

      function rewrite () {
        var element = template.document.getElementById(directive.id),
            handler = handlers[element.localName];
        handler(directive, element, context, path.concat(directive.id + ";" + depth), resume);
      }

      function resume () { next(descent) }
    }
  }

  // Compile the template at the given url and send it to the given callback.
  function fetch (url, callback) {
    var okay = validator(callback), identifier = 0;

    // Send an pre-compiled template if we have one, otherwise compile the
    // template and cache it.
    if (templates[url]) callback(null, templates[url]);
    else resolver(absolutize(base, url), "text/xml", okay(compile));

    // We compile the URL into a parallel tree of directives. The directives
    // identify the elements that define them in the document using an
    // automatically generated id.
    // 
    // Some directives are directive attributes that can be applied to any
    // element, not just a Stencil attribute. Directive attributes include
    // include object constructors, template includes, and dynamic attributes.
    // When they are applied to an element that is not in the Stencil namespace,
    // we add a marker element as the element's first child, to mark the user
    // element in the template document, without abusing the id of the user
    // element, which would be visible in the output.
    //
    // With the markers in place, all of the element participants in the
    // template can have a unique id, without overriding, or stepping around,
    // any user specified ids on user elements. The user could still choose to
    // use an id in her markup that collides with the auto generated ids, but
    // that is a collision that is easy to avoid. The generated ids are a
    // catenation of Stencil path and sequence number, unlikely to coincide
    // with a desirable name for a section of web page.
    //
    // There is no need for a namespace stack, because we're emitting HTML5,
    // which does not support namespaces. All namespaces will be stripped before
    // serialization. The namespace declarations are removed from the template
    // at they are encountered.
    // 
    // We are using namespaces as part of the mechanics of the template
    // language, of course, but we don't need to track namespace mappings. We're
    // only using the namespace URLs as to locate our objects and templates.
    // We're not actually using the namespace created in the document.
    //
    // Finally, note that we're not stripping namespaces if they are not special
    // to stencil, so namespaces can be used in the document, but their might be
    // problems with serialization if the document. We'll cross this bridge when
    // we get to it.
    //
    // There are some applications of HTML5 that use XHTML5, so it may be
    // crossed by people who adopt the library. Let me know if you care about
    // XHTML5 and we'll talk.

    // Locate all of our directive elements and create a tree of them.
    function compile (document) {
      // Our directives and a temporary list of user elements with Stencil
      // directive attributes.
      var directives = [], unmarked = [];

      // Visit all the nodes creating a tree of directives.
      visit(unmarked, directives, document.documentElement);

      // Some of the elements are not in the Stencil namespace, so we need to
      // insert a marker child element. We do this after we traverse the tree so
      // we don't need special logic to exclude elements we've just inserted.
      unmarked.forEach(function (unmarked) {
        var node = unmarked.node, marker = document.createElementNS("stencil", "marker");
        marker.setAttribute("id", unmarked.id);
        node.insertBefore(marker, node.firstChild);
      });

      // Create our template.
      templates[url] = {
        url: url, document: document, directives: directives,
        base: absolutize(base, url).replace(/\/[^\/]+$/, '/') };

      // Send the template to our caller.
      callback(null, templates[url]);
    }

    // Create a directive structure from the node, if the node is a directive.
    function directivize (unmarked, node) {
      // Only elements can be directives.
      if (node.nodeType != 1) return;

      // Gather object constructors, template includes and dynamic attributes
      // into our array of operations.
      var operations = [], attributes = [];
      for (var i = 0, I = node.attributes.length; i < I; i++) {
        var attr = node.attributes.item(i), protocol;
        switch (attr.namespaceURI) {
        case "http://www.w3.org/2000/xmlns/":
          if (protocol = attr.nodeValue.split(/:/).shift()) {
            var href = normalize(attr.nodeValue.substring(protocol.length + 1));
            if (!"require".indexOf(protocol)) operations.unshift({ type: "require", href: href, name: attr.localName });
            else if (!"include".indexOf(protocol)) operations.unshift({ type: "include", href: href, name: attr.localName });
          }
          break;
        case "stencil":
          attributes.push({ name: attr.localName, value: attr.nodeValue });
          break;
        }
      }

      // Clear out the calculated attribute declarations from the prototype.
      attributes.forEach(function (attribute) {
        node.removeAttributeNS("stencil", attribute.name);
      });

      // We have a directive if the namespace is the Stencil namespace, or we've
      // discovered calculated attributes. If we're not a Stencil directive, we
      // insert a placeholder marker as a child of the element.
      if (node.namespaceURI == "stencil" || attributes.length) {
        var id = url + ":" + (identifier++);
        if (node.namespaceURI != "stencil") {
          unmarked.push({ node: node, id: id });
        } else {
          node.setAttribute("id", id);
        }
        return { id: id, operations: operations, attributes: attributes, directives: []};
      // Otherwise, we have operations that will alter the variable context, but
      // no calculated attributes nor directives that rewrite the DOM.
      } else if (operations.length) {
        return { operations: operations, attributes: attributes, directives: []};
      }
    }
  
    function visit (unmarked, directives, node) {
      var directive, child;
      if (directive = directivize(unmarked, node)) {
        directives.push(directive);
        directives = directive.directives;
      }
      for (child = node.firstChild; child; child = child.nextSibling) {
        visit(unmarked, directives, child);
      }
    }
  }

  function follow(instance, path) {
    for (var i = 0, I = path.length; i < I; i++) {
      if (!instance.instances[path[i]]) {
        instance.instances[path[i]] = { instances: {} };
      }
      instance = instance.instances[path[i]];
    }
    return instance;
  }

  function inorder (parent, path, depth, callback) {
    (parent.directives || []).forEach(function (directive) {
      var subPath = directive.id ? path.concat(directive.id + ";" + depth) : path;
      callback(parent, subPath, directive);
      inorder(directive, subPath, depth, callback);
    });
  }

  function regenerate (instance, parameters, callback) {
    var okay = validator(callback);

    if (typeof parameters == "function") {
      callback = parameters;
      parameters = {};
    }

    var url = normalize(instance._template.url);
    fetch(url, okay(rebase));

    function rebase (template) {
      instance._template.base = template.base;
      abracadabra(instance._template, instance.document, parameters, [], 0, okay(function () {
        callback(null, instance);
      }));
    }
  }

  function generate (url, parameters, callback) {
    var okay = validator(callback);

    if (typeof parameters == "function") {
      callback = parameters;
      parameters = {};
    }

    url = normalize(url);
    fetch(url, okay(interpret));

    function instanciate (template) {
      return {
        document: template.document,
        url: template.url,
        base: template.base,
        directives: JSON.parse(JSON.stringify(template.directives)),
        instanceId: 0,
        instances: {}
      }
    }

    function interpret (template) {
      // We need a fragment because a document node can have only one element
      // child and some operations will replace the root, prepending the new
      // contents before the old root before removing it.
      //
      // This is going to defeat a live update, so we'll have to fix it so that
      // the node operations occur without it.
      //
      // Create a new document.
      //
      // TODO: This not likely to be portable. Need to determine how to create a
      // clone of the document. Ah... I'm going to have to test how to import
      // nodes generated from XML into documents built by parsing HTML5.
      template = instanciate(template);
      var document = template.document.implementation.createDocument();
      document.appendChild(document.importNode(template.document.documentElement, true));

      // Take the instantiated template and insert placeholder instances that
      // use the directive elements as markers.
      //
      // TODO: Come back and consider why you have an instance tree and a
      // directive tree, which data belongs in which. (There is a need for both
      // trees, but the data is getting confused.)
      inorder(template, [], 0, function (parent, path, directive) {
        directive.context = {};
        directive.parent = parent;
        if (directive.id)
          extend(follow(template, path), {
            elements: 0,
            characters: 0,
            marker: document.getElementById(directive.id)
          });
      });

      // Evaluate the template.
      abracadabra(template, document, parameters, [], 0, okay(result));
      
      function result () {
        var comment = document.createComment("Stencil/Template:" + url);
        document.documentElement.insertBefore(comment, document.documentElement.firstChild);
        callback(null, { document: document, _template: template });
      }
    }
  }

  return { generate: generate, regenerate: regenerate, reconstitute: reconstitute }
}});
