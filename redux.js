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
  
  function remark (marker, part, instance) {
    var marker = mark(marker, part, instance);
    removeChild(marker.parentNode, marker.nextSibling);
    return marker;
  }

  function mark (marker, part, instance) {
    var reference = marker.nodeType ? marker : marker.reference,
        offsets = [ instance.elements, instance.characters ].join(":"),
        key = [ part, offsets ].join(";"),
        comment = marker.parentNode.ownerDocument.createComment("(Stencil[" + key + "])");
    return insertBefore(marker.parentNode, comment, reference);
  }

  function isText (node) { return node.nodeType == 3 || node.nodeType == 4 }

  // Placeholders until issues in `xmldom` are resolved.
  function insertBefore (parentNode, child, reference) {
    if (child.nodeType == 11 && !child.firstChild) {
      return child;
    }
    return parentNode.insertBefore(child, reference);
  }

  function removeChild (parentNode, child) {
    child = parentNode.removeChild(child);
    if (child.parentNode) child.parentNode = null;
    if (child.nextSibling) child.nextSibling = null;
    if (child.previousSibling) child.previousSibling = null;
    return child;
  }

  function unmark (marker, instance, fragment) {
    var i, removed, parentNode = marker.parentNode;
    if (!fragment) {
      fragment = marker.ownerDocument.createDocumentFragment();
    }
    for (i = instance.elements; i;) {
      removed = removeChild(parentNode, marker.nextSibling);
      if (!isText(removed)) i--;
      insertBefore(fragment, removed);
    }
    // **TODO**: What if we run into an elementbefore we get all our characters?
    for (i = instance.characters; i > 0; i -= removed.nodeValue.length) {
      removed = removeChild(parentNode, marker.nextSibling)
      insertBefore(fragment, removed);
    }
    if (i < 0) {
      insertBefore(parentNode, removeChild(fragment, removed), marker.nextSibling); 
      removed.splitText(removed.nodeValue.length + i);
      insertBefore(fragment, removeChild(parentNode, marker.nextSibling));
    }
    removed = { parentNode: parentNode, reference: marker.nextSibling };
    insertBefore(fragment, removeChild(parentNode, marker), fragment.firstChild);
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
      instance.elements++; // kludgey
    }
    i = path.length;
    for (node = startChild || node.firstChild; node; node = node.nextSibling) {
      comments(contents, page, path, node);
      if (1 + i == path.length) {
        if (isText(node)) {
          if (!contents.elements) {
            contents.characters -= node.nodeValue.length;
          }
        } else {
          contents.elements--;
        }
        if (contents.elements <= 0 && contents.characters <= 0) {
          if (startChild) break;
          delete contents.marker;
          path.pop();
        }
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

    fetch(base, url, okay(fetched));

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
    removeChild(spares, spares.firstChild);
    insertBefore(marker.parentNode, fragment, marker.reference);
    return { fragment: spares, instance: prototype };
  }

  function findEnd (instance) {
    var node = instance.marker.nextSibling, elements = instance.elements, characters = instance.characters;
    while (elements || characters > 0) {
      if (isText(node)) {
        if (!elements) characters -= node.nodeValue.length;
      } else if (elements) {
        elements--;
      }
      node = node.nextSibling;
    }
    return node;
  }

  var handlers = {
    // The value directive replaces a value element with text from the current
    // context.
    value: function (parent, page, template, directive, element, context, path, rewrite, callback) {
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
        insertBefore(marker.parentNode, page.document.createTextNode(value), marker.reference);

        callback();
      }));
    },
    if: function (parent, page, template, directive, element, context, path, rewrite, callback) {
      var source = element.getAttribute("select").trim(),
          instance = follow(page, path),
          marker = instance.marker;

      evaluate(source, context, check(callback, function (value) {
        var end;
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
            var salvage = scavenge(template.page, directive.path, page.document);

            instance.marker = mark(marker, directive.id, salvage.instance);
            insertBefore(marker.parentNode, salvage.fragment, marker);
            unmark(marker, instance);

            comments({}, page, path.slice(0, path.length - 1), instance.marker.parentNode, instance.marker);
          }
          rewrite(instance.marker, findEnd(instance), directive.id, directive.directives, path, callback);
        }
      }));
    },
    else: function (parent, page, template, directive, element, context, path, rewrite, callback) {
      element.setAttribute("select", "true");
      handlers.elseif(parent, page, template, directive, element, context, path, rewrite, callback);
    },
    elseif: function (parent, page, template, directive, element, context, path, rewrite, callback) {
      var previous = element.previousSibling,
          instance = follow(page, path),
          marker = instance.marker;
      if (parent.condition) {
        marker = unmark(marker, instance);
        instance.instances.length = instance.characters = instance.elements = 0;
        instance.marker = mark(marker, directive.id, instance);
        callback();
      } else {
        handlers["if"](parent, page, template, directive, element, context, path, rewrite, callback);
      }
    },
    each: function (parent, page, template, directive, element, context, path, rewrite, callback) {
      var source = element.getAttribute("select").trim(),
          idSource = element.getAttribute("key").trim(),
          into = element.getAttribute("into").trim(),
          prototype = follow(page, path),
          marker = prototype.marker,
          sub = path.slice(0), last = sub[sub.length - 1],
          index = 0, previous, parentNode, items = {},
          okay = validator(callback);

      if (prototype.characters || prototype.elements) {
        marker = unmark(marker, prototype);
        prototype.instances.length = prototype.characters = prototype.elements = 0;
        marker = prototype.marker = mark(marker, directive.id, prototype);
      }

      previous = marker.nextSibling;
      parentNode = marker.parentNode;

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
          var instance = follow(page, sub), node, fragment;

          previous = previous ? previous.previousSibling : parentNode.lastChild;

          if (instance.marker) {
            if (previous.nextSibling !== instance.marker) {
              fragment = page.document.createDocumentFragment();
              unmark(instance.marker, instance, fragment);
              insertBefore(previous.parentNode, fragment, previous.nextSibling);
            }
          } else {
            var salvage = scavenge(template.page, directive.path, page.document);

            insertBefore(marker.parentNode, salvage.fragment, previous.nextSibling);
            extend(instance, salvage.instance);
            instance.marker = mark(previous.nextSibling, sub[sub.length - 1], instance);

            // FIXME: Getting multiple stuff back, sub is appended to.
            comments({}, page, sub, instance.marker.parentNode, instance.marker);
          }

          previous = findEnd(instance)

          rewrite(instance.marker, previous, sub[sub.length - 1], directive.directives, sub, okay(shift));
          //rewrite(directive.directives, sub, okay(shift));
        }
      }));
    }
  }

  function rewrite (parent, page, template, directives, library, context, path, callback) {
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

      library = extend({}, library);

      if (directive.id) {
        sub = path.concat(directive.id);
        var instance = follow(page, sub), marker = instance.marker,
            element = directive.element ? directive.element.cloneNode(false) : marker.nextSibling;
      }

      operate(operations.shift());

      function operate (operation) {
        switch (operation && operation.type) {
        case "require":
          resolver(template.base + '/' + operation.href, "text/javascript", okay(function (module) {
            invoke(module, context, okay(function (value) {
              context[operation.name] = value;
              operate(operations.shift());
            }));
          }));
          break;
        case "include":
          fetch(template.base, operation.href, okay(function (included) {
            library[operation.uri] = included;
            operate(operations.shift());
          }));
          break;
        case "attribute":
          evaluate(operation.value, context, okay(function (value) {
            if (value == null) {
              element.removeAttribute(operation.name);
            } else {
              element.setAttribute(operation.name, value);
            }
            operate(operations.shift());
          }));
          break;
        default:
          var included;
          if (directive.interpreter) directive.interpreter(parent, page, template, directive, element, context, sub,
            function (marker, end, part, directives, path, callback) {
              if (arguments.length == 6) {
                rewrite({}, page, template, directives, library, context, path, function () {
                  var node = marker.nextSibling, elements = 0, characters = 0, instance = follow(page, path);
                  while (node != end) {
                    if (isText(node)) {
                      characters += node.nodeValue.length;
                    } else {
                      characters = 0;
                      elements++;
                    }
                    node = node.nextSibling;
                  }
                  instance.marker = remark(marker, part, { elements: elements, characters: characters });
                  instance.elements = elements;
                  instance.characters = characters;
                  callback(null);
                });
              } else {
                directives = arguments[0];
                path = arguments[1];
                path = arguments[1];
                rewrite({}, page, template, directives, library, context, path, callback);
              }
            }, shift);
          else if (directive.element && (included = library[directive.element.namespaceURI])) {
            var include = included.library[directive.element.localName], 
                prototype = follow(included.page, include.path),
                instance = follow(page, sub),
                characters = instance.characters, elements = instance.elements,
                previous = instance.marker, end;

            while (elements) {
              previous = previous.nextSibling; 
              if (!isText(previous)) elements--;
            }

            while (characters > 0) {
              previous = previous.nextSibling; 
              characters -= previous.nodeValue.length;
            }

            if (characters < 0) {
              die(characters);
            }

            end = previous.nextSibling;
            var scrap = scavenge(included.page, include.path, page.document);
            insertBefore(previous.parentNode, scrap.fragment, previous.nextSibling);
            rewrite({}, page, included, include.directives, library, context, sub, okay(function () {
              var node = instance.marker, elements = 0, characters = 0; 
              while (end != node) {
                switch (node.nodeType) {
                case 3:
                case 4:
                  characters += node.nodeValue.length;
                  break;
                default:
                  characters = 0;
                  elements++;
                  break;
                }
                node = node.nextSibling;
              }
              removeChild(node.parentNode, node);
              var m = mark(instance.marker, directive.id, { elements: elements, characters: characters });
              removeChild(instance.marker.parentNode, instance.marker);
              instance.marker = m;
              shift(null);
            }));
          }
          else rewrite({}, page, template, directive.directives, library, context, sub, shift);
          break; 
        }
      }
    }
  }

  // Compile the template at the given url and send it to the given callback.
  function fetch (base, url, callback) {
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
      var directives = [], library = {},
          fragment = document.createDocumentFragment(),
          page = { instances: {}, document: document, fragment: fragment };

      insertBefore(fragment, document.documentElement);

      // Visit all the nodes creating a tree of directives.
      unravel(page, { stencil: true }, library, directives, [], fragment);

      // Create our template.
      templates[url] = {
        url: url, page: page, directives: directives, library: library,
        base: absolutize(base, url).replace(/\/[^\/]+$/, '/')
      };

      // Send the template to our caller.
      callback(null, templates[url]);
    }

    // Create a directive structure from the node, if the node is a directive.
    function directivize (namespaces, node) {
      // Only elements can be directives.
      if (node.nodeType != 1) return;

      // Gather object constructors, template includes and dynamic attributes
      // into our array of operations.
      var operations = [], attributes = [], properties = {}, includes = [];
      for (var i = 0, I = node.attributes.length; i < I; i++) {
        var attr = node.attributes.item(i), protocol;
        switch (attr.namespaceURI) {
        case "http://www.w3.org/2000/xmlns/":
          if (protocol = attr.nodeValue.split(/:/).shift()) {
            var href = normalize(attr.nodeValue.substring(protocol.length + 1));
            if (!"require".indexOf(protocol)) operations.unshift({ type: "require", href: href, name: attr.localName });
            else if (!"include".indexOf(protocol)) {
              operations.unshift({ type: "include", href: href, uri: attr.nodeValue });
              namespaces[attr.nodeValue] = true;
            }
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

      if (namespaces[node.namespaceURI]) {
        directive.element = node;
        directive.interpreter = handlers[node.localName];
      }

      // We have a directive if the namespace is the Stencil namespace, or we've
      // discovered calculated attributes. If we're not a Stencil directive, we
      // insert a placeholder marker as a child of the element.
      if (namespaces[node.namespaceURI] || attributes.length) {
        directive.id = url + ":" + (identifier++);
      }
      
      // Otherwise, we have operations that will alter the variable context, but
      // no calculated attributes nor directives that rewrite the DOM.
      if (directive.id || directive.operations.length) {
        return directive;
      }
    }
  
    function unravel (page, namespaces, library, directives, path, node) {
      var directive, child, elements = 0, characters = 0, before, end;
      if (directive = directivize(namespaces, node)) {
        if (directive.id) {
          path = path.concat(directive.id);
        }
        directives.push(directive);
        directives = directive.directives;
        if (node.namespaceURI == "stencil" && node.localName == "tag") {
          library[node.getAttribute("name")] = directive;
          library = directive.library;
        }
      }
      for (child = node.firstChild; child; child = child.nextSibling) {
        child = unravel(page, extend({}, namespaces), library, directives, path, child);
      }
      child = node;
      if (directive && directive.id) {
        if (namespaces[node.namespaceURI]) {
          var firstChild = node.firstChild;
          while (node.firstChild) {
            child = removeChild(node, node.firstChild);
            if (isText(child)) {
              characters += child.nodeValue.length;
            } else {
              characters = 0;
              elements++;
            }
            insertBefore(node.parentNode, child, node);
          }
        }
        var instance = extend(follow(page, path), {
          elements: elements, characters: characters
        });
        instance.marker = mark(firstChild || node, directive.id, instance);
        if (namespaces[node.namespaceURI]) {
          removeChild(node.parentNode, node);
        }
        directive.path = path;
      }
      return child;
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
    fetch(base, url, okay(rebase));

    function rebase (template) {
      rewrite({}, page, template, template.directives, {}, parameters, [], okay(function () {
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
    fetch(base, url, okay(paginate));
    
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
      insertBefore(fragment, page.document.importNode(template.page.fragment, true));

      comments({}, page, [], fragment);

      // Evaluate the template.
      rewrite({}, page, template, template.directives, {}, parameters, [], okay(result));
      
      function result () {
        insertBefore(page.document, page.fragment);
        var comment = page.document.createComment("Stencil/Template:" + url);
        insertBefore(page.document.documentElement, comment, page.document.documentElement.firstChild);
        callback(null, page);
      }
    }
  }

  return { generate: generate, regenerate: regenerate, reconstitute: reconstitute }
}});
