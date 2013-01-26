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
    if (typeof callback != "function") throw new Error("no callback");
    return function (forward) { return check(callback, forward) }
  }

  function check (callback, forward) {
    if (typeof callback != "function") throw new Error("no callback");
    if (typeof forward != "function") throw new Error("no forward");
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

  function mark (marker, part, instance) {
    var reference = marker.nodeType ? marker : marker.reference,
        offsets = [ instance.elements, instance.characters ].join(":"),
        key = [ part, offsets ].join(";"),
        comment = marker.parentNode.ownerDocument.createComment("(Stencil[" + key + "])");
    return marker.parentNode.insertBefore(comment, reference);
  }

  function unmark (marker, instance, fragment) {
    var i, removed, parentNode = marker.parentNode;
    if (!fragment) {
      fragment = marker.ownerDocument.createDocumentFragment();
    }
    for (i = instance.elements; i;) {
      removed = parentNode.removeChild(marker.nextSibling);
      if (removed.nodeType == 1) i--;
      fragment.appendChild(removed);
    }
    // **TODO**: What if we run into a non text node before we get all our
    // characters?
    for (i = instance.characters; i > 0; i -= removed.nodeValue.length) {
      removed = parentNode.removeChild(marker.nextSibling)
      fragment.appendChild(removed);
    }
    if (i < 0) {
      parentNode.insertBefore(fragment.removeChild(removed), marker.nextSibling); 
      removed.splitText(removed.nodeValue.length + i);
      fragment.appendChild(parentNode.removeChild(marker.nextSibling));
    }
    removed = { parentNode: parentNode, reference: marker.nextSibling };
    fragment.insertBefore(parentNode.removeChild(marker), fragment.firstChild);
    return removed;
  }

  function comments (instance, page, path, node, startChild) {
    var $, i, I, path, parts, identity, offsets, contents = {};
    if (node.nodeType == 8 && ($ = /^\(Stencil\[(.+)\]\)$/.exec(node.nodeValue))) {
      parts = $[1].split(/;/);
      offsets = parts[1].split(/:/);
      extend(instance, { elements: +(offsets[0]), characters: +(offsets[1]), marker: node });
      identity = parts[0].split(/:/);
      if (identity.length == 3) {
        follow(page, path.concat(identity.slice(0, 2).join(":"))).items[identity[2]] = true;
      }
      path.push(parts[0]);
      extend(follow(page, path), instance);
    }
    i = path.length;
    for (node = startChild || node.firstChild; node; node = node.nextSibling) {
      comments(contents, page, path, node);
      if (1 + i == path.length) {
        switch (node.nodeType) {
        case 1:
          contents.elements--;
          break;
        case 3:
          if (!contents.elements) {
            contents.characters -= node.nodeValue.length;
          }
          break;
        }
        if (contents.elements <= 0 && contents.characters <= 0) {
          if (startChild) break;
          delete contents.marker;
          path.pop();
        }
      } else if (1 + i < path.length) {
        throw new Error("unable to reconstitute");
      }
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
      var page = {
        template: template,
        document: document,
        url: template.url,
        directives: template.directives,
        instanceId: 0,
        instances: {}
      }

      comments({}, page, [], document);

      callback(null, page);
    }
  }

  function scavenge (scrap, path, document) {
    var prototype = follow(scrap, path), fragment = scrap.document.createDocumentFragment(); 
    var marker = unmark(prototype.marker, prototype, fragment);
    var spares = document.importNode(fragment, true);
    spares.removeChild(spares.firstChild);
    marker.parentNode.insertBefore(fragment, marker.reference);
    return { fragment: spares, instance: prototype };
  }

  var handlers = {
    // The value directive replaces a value element with text from the current
    // context.
    value: function (parent, page, directive, element, context, path, callback) {
      var source = element.getAttribute("select").trim(),
          instance = follow(page, path),
          marker = unmark(instance.marker, instance);

      evaluate(source, context, check(callback, function (value) {
        // Record the instance.
        instance.characters = String(value).length;
        instance.elements = 0;

        // Mark the new insert.
        instance.marker = mark(marker, directive.id, instance);

        // Insert the text value.
        marker.parentNode.insertBefore(page.document.createTextNode(value), marker.reference);

        callback();
      }));
    },
    if: function (parent, page, directive, element, context, path, callback) {
      var source = element.getAttribute("select").trim(),
          instance = follow(page, path),
          marker = instance.marker;

      evaluate(source, context, check(callback, function (value) {
        parent.condition = !!value;
        // If the directive body is already in the document, we have nothing
        // to do, we continue and rewrite the body.
        if (!value) {
          marker = unmark(marker, instance);
          instance.instances.length = instance.characters = instance.elements = 0;
          instance.marker = mark(marker, directive.id, instance);
          callback();
        } else {
          if (!(instance.elements || instance.characters)) {
            var fragment = page.document.createDocumentFragment();
            fragment.appendChild(page.document.importNode(element, true));

            var salvage = scavenge(page.template.page, path, page.document);

            instance.marker = mark(marker, directive.id, salvage.instance);
            marker.parentNode.insertBefore(salvage.fragment, marker);
            unmark(marker, instance);

            comments({}, page, path.slice(0, path.length - 1), instance.marker.parentNode, instance.marker);
          }
          rewrite({}, page, directive.directives, context, path, callback);
        }
      }));
    },
    else: function (parent, page, directive, element, context, path, callback) {
      element.setAttribute("select", "true");
      handlers.elseif(parent, page, directive, element, context, path, callback);
    },
    elseif: function (parent, page, directive, element, context, path, callback) {
      var previous = element.previousSibling,
          instance = follow(page, path),
          marker = instance.marker;
      if (parent.condition) {
        marker = unmark(marker, instance);
        instance.instances.length = instance.characters = instance.elements = 0;
        instance.marker = mark(marker, directive.id, instance);
        callback();
      } else {
        handlers["if"](parent, page, directive, element, context, path, callback);
      }
    },
    each: function (parent, page, directive, element, context, path, callback) {
      var source = element.getAttribute("select").trim(),
          idSource = element.getAttribute("key").trim(),
          into = element.getAttribute("into").trim(),
          prototype = follow(page, path),
          marker = prototype.marker,
          sub = path.slice(0), last = sub[sub.length - 1],
          index = 0, previous, items = {},
          okay = validator(callback);

      if (prototype.characters || prototype.elements) {
        marker = unmark(marker, prototype);
        prototype.instances.length = prototype.characters = prototype.elements = 0;
        marker = prototype.marker = mark(marker, directive.id, prototype);
      }

      previous = marker;

      evaluate(source, context, okay(function (value) {
        if (!Array.isArray(value)) value = [ value ];
        value = value.slice();

        shift();

        function shift () {
          var id, instance;
          if (value.length) {
            context[into] = value.shift();
            if (idSource) evaluate(idSource, context, okay(scribble));
            else scribble(index++);
          } else {
            for (id in prototype.items) {
              sub[sub.length - 1] = last + ":" + id; 
              instance = follow(page, sub);
              unmark(instance.marker, instance);
            }
            prototype.items = items;
            callback();
          }
        }

        function scribble (id) {
          id = escape(id);

          items[id] = true;
          delete prototype.items[id];

          sub[sub.length - 1] = last + ":" + id;
          var instance = follow(page, sub), node, skip, fragment;

          if (instance.marker) {
            if (previous.nextSibling !== instance.marker) {
              fragment = page.document.createDocumentFragment();
              unmark(instance.marker, instance, fragment);
              previous.parentNode.insertBefore(fragment, previous.nextSibling);
            }
          } else {
            var salvage = scavenge(page.template.page, path, page.document);

            marker.parentNode.insertBefore(salvage.fragment, previous.nextSibling);
            extend(instance, salvage.instance);
            instance.marker = mark(previous.nextSibling, sub[sub.length - 1], instance);

            comments({}, page, sub, instance.marker.parentNode, instance.marker);
          }

          skip = extend({}, instance);

          while (skip.elements) {
            previous = previous.nextSibling; 
            if (previous.nodeType == 1) skip.elements--;
          }

          while (skip.characters > 0) {
            previous = previous.nextSibling; 
            skip.characters -= previous.nodeValue.length;
          }

          rewrite({}, page, directive.directives, context, sub, okay(shift));
        }
      }));
    }
  }

  function rewrite (parent, page, directives, context, path, callback) {
    var okay = validator(callback);

    context = extend({}, context);
    directives = directives.slice(0);

    shift();

    function shift (error) {
      if (error) callback(error);
      else if (directives.length) consume();
      else callback();
    }

    function consume () {
      var directive = directives.shift(),
          operations = directive.operations.slice(0),
          sub = path,
          attributed;

      if (directive.id) {
        sub = path.concat(directive.id);
        var instance = follow(page, sub), marker = instance.marker,
            element = directive.element ? directive.element.cloneNode(false) : marker.nextSibling;
      }

      operate(operations.shift());

      function operate (operation) {
        switch (operation && operation.type) {
        case "require":
          resolver(page.template.base + '/' + operation.href, "text/javascript", okay(function (module) {
            invoke(module, context, okay(function (value) {
              context[operation.name] = value;
              operate(operations.shift());
            }));
          }));
          break;
        case "attribute":
          evaluate(operation.value, context, check(callback, function (value) {
            if (value == null) {
              element.removeAttribute(operation.name);
            } else {
              element.setAttribute(operation.name, value);
            }
            operate(operations.shift());
          }));
          break;
        default:
          if (directive.interpreter) directive.interpreter(parent, page, directive, element, context, sub, shift);
          else rewrite({}, page, directive.directives, context, sub, shift);
          break; 
        }
      }
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
      var directives = [], unmarked = [],
          fragment = document.createDocumentFragment(),
          page = { instances: {}, document: document, fragment: fragment };

      fragment.appendChild(document.documentElement);

      // Visit all the nodes creating a tree of directives.
      visit(page, directives, [], fragment);

      // Create our template.
      templates[url] = {
        url: url, page: page, directives: directives,
        base: absolutize(base, url).replace(/\/[^\/]+$/, '/')
      };

      // Send the template to our caller.
      callback(null, templates[url]);
    }

    // Create a directive structure from the node, if the node is a directive.
    function directivize (node) {
      // Only elements can be directives.
      if (node.nodeType != 1) return;

      // Gather object constructors, template includes and dynamic attributes
      // into our array of operations.
      var operations = [], attributes = [], properties = {};
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
          attributes.push({ type: "attribute", name: attr.localName, value: attr.nodeValue });
          break;
        }
      }

      // Clear out the calculated attribute declarations from the prototype.
      attributes.forEach(function (attribute) {
        node.removeAttributeNS("stencil", attribute.name);
      });

      var directive = { operations: operations.concat(attributes), directives: [] };

      if (node.namespaceURI == "stencil") {
        directive.element = node;
        directive.interpreter = handlers[node.localName];
      }

      // We have a directive if the namespace is the Stencil namespace, or we've
      // discovered calculated attributes. If we're not a Stencil directive, we
      // insert a placeholder marker as a child of the element.
      if (node.namespaceURI == "stencil" || attributes.length) {
        directive.id = url + ":" + (identifier++);
      }
      
      // Otherwise, we have operations that will alter the variable context, but
      // no calculated attributes nor directives that rewrite the DOM.
      if (directive.id || directive.operations.length) {
        return directive;
      }
    }
  
    function visit (page, directives, path, node) {
      var directive, child, unravel, elements = 0, characters = 0, before = node.nextSibling;
      if (directive = directivize(node)) {
        unravel = directive.id;
        directives.push(directive);
        directives = directive.directives;
      }
      for (child = node.firstChild; child; child = child.nextSibling) {
        visit(page, directives, path, child);
      }
      if (unravel) {
        while (node.namespaceURI == "stencil" && node.lastChild) {
          child = node.removeChild(node.firstChild);
          switch (child.nodeType) {
          case 1:
            characters = 0;
            elements++;
            break;
          case 3:
          case 4:
            characters += child.nodeValue.length;
            break;
          }
          before = node.parentNode.insertBefore(child, before);
        }
        path = path.concat(directive.id);
        var instance = extend(follow(page, path), {
          elements: elements,
          characters: characters
        });
        instance.marker = mark(node, directive.id, instance);
        if (node.namespaceURI == "stencil") {
          node.parentNode.removeChild(node);
        }
      }
    }
  }

  function follow (instance, path) {
    for (var i = 0, I = path.length; i < I; i++) {
      if (!instance.instances[path[i]]) {
        instance.instances[path[i]] = { instances: {}, items: {} };
      }
      instance = instance.instances[path[i]];
    }
    return instance;
  }

  function regenerate (page, parameters, callback) {
    var okay = validator(callback);

    if (typeof parameters == "function") {
      callback = parameters;
      parameters = {};
    }

    var url = normalize(page.template.url);
    fetch(url, okay(rebase));

    function rebase (template) {
      page.template.base = template.base;
      rewrite({}, page, template.directives, parameters, [], okay(function () {
        callback(null, page);
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
    fetch(url, okay(paginate));
    
    function paginate (template) {
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
      var fragment = template.page.fragment.ownerDocument.implementation.createDocument().createDocumentFragment(),
          page = {
        document: fragment.ownerDocument,
        fragment: fragment,
        template: template,
        instances: {}
      };
      fragment.appendChild(page.document.importNode(template.page.fragment, true));

      comments({}, page, [], fragment);

      // Evaluate the template.
      rewrite({}, page, template.directives, parameters, [], okay(result));
      
      function result () {
        page.document.appendChild(page.fragment);
        var comment = page.document.createComment("Stencil/Template:" + url);
        page.document.documentElement.insertBefore(comment, page.document.documentElement.firstChild);
        callback(null, page);
      }
    }
  }

  return { generate: generate, regenerate: regenerate, reconstitute: reconstitute }
}});
