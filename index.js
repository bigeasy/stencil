! function (definition) {
  if (typeof module == "object" && module.exports) definition(require, module.exports, module);
  else if (typeof define == "function" && typeof define.amd == "object") define(definition);
} (function (require, exports, module) { exports.create = function (javascript, xml, json) {
  var slice = [].slice, templates = {};

  if (!javascript) {
    javascript = function (url, callback) {
      require([ url ], function (module) { callback(null, module) });
    }
  }

  function get (url, property, callback) {
    var xhr = new XMLHttpRequest(), done;
    xhr.open( "GET", url, true );
    xhr.onerror = function (event) {
      console.log(event);
    }
    xhr.onreadystatechange = function () {
      if (!done && xhr.readyState == 4 && xhr.status == 200) {
        done = true;
        callback(null, xhr[property]);
      }
    }
    xhr.send(null);
  }

  if (!xml) {
    xml = function (url, callback) {
      get(url, 'responseXML', callback);
    }
  }

  if (!json) {
    json = function (url, callback) {
      get(url, 'responseText', function (error, body) {
        if (error) callback(error);
        else callback(null, JSON.parse(body));
      });
    }
  }

  function die () {
    console.log.apply(console, slice.call(arguments, 0));
    process.exit(1);
  }

  function say () { console.log.apply(console, slice.call(arguments, 0)) }

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
    var parameters = ['$'], values = [context], callbacks = 0,
        i, I, name, result, compiled;
    source = source.trim();
    compiled = functions[source];
    if (!compiled) {
      parameters.push.apply(parameters, Object.keys(context));
      functions[source] = compiled = {
        parameters: parameters,
        expression: Function.apply(Function, parameters.concat([ "return " + source ]))
      }
    } else {
      parameters = compiled.parameters;
    }
    for (i = 1, I = parameters.length; i < I; i++) {
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

  function vivify (page, path, node) {
    var child, parts;
    for (child = node.firstChild; child; child = child.nextSibling) {
      if (child.nodeType == 8) {
        if (/^[\w\/.-]+:\d+(?:;[\d\w%]+)?$/.test(child.nodeValue)) {
          parts = child.nodeValue.split(/;/);
          if (parts.length == 2) {
            follow(page, path.concat(parts[0])).items[parts[1]] = true;
          }
          path.push(child.nodeValue);
          follow(page, path).begin = child;
        } else if (child.nodeValue == "?") {
          follow(page, path).end = child;
          path.pop();
        }
      }
      vivify(page, path, child);
    }
  }

  function reconstitute (document, callback) {
    var okay = validator(callback), child, url;

    for (child = document.documentElement.firstChild; child; child = child.nextSibling) {
      if (child.nodeType == 8) {
        url = child.nodeValue.replace(/^stencil:/, '');
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
        markers: {}
      }

      vivify(page, [], document);

      callback(null, page);
    }
  }

  function copy (document, node, end) {
    var fragment = document.createDocumentFragment();
    while (node != end) {
      insertBefore(fragment, document.importNode(node, true));
      node = node.nextSibling;
    }
    return fragment;
  }

  function erase (node, end) {
    var next;
    while (node != end) {
      next = node.nextSibling;
      removeChild(node.parentNode, node);
      node = next;
    }
  }

  function empty (marker) {
    return marker.begin.nextSibling == marker.end;
  }

  function fill (marker, node) {
    insertBefore(marker.end.parentNode, node, marker.end);
  }

  function cut (marker) {
    var fragment = marker.begin.ownerDocument.createDocumentFragment(),
        node = marker.begin, end = marker.end.nextSibling, next;
    while (node !== end) {
      next = node.nextSibling;
      insertBefore(fragment, removeChild(node.parentNode, node));
      node = next;
    }
    return fragment;
  }

  var handlers = {
    // The value directive replaces a value element with text from the current
    // context.
    value: function (parent, frames, page, template, includes,
                     directive, element, context, path, generating, callback) {
      var source = element.getAttribute("select").trim(), marker = follow(page, path);

      evaluate(source, context, check(callback, function (value) {
        // Delete the directive body.
        erase(marker.begin.nextSibling, marker.end);

        // Insert the text value.
        fill(marker, page.document.createTextNode(value));

        callback();
      }));
    },
    if: function (parent, frames, page, template, includes,
                  directive, element, context, path, generating, callback) {
      var source = element.getAttribute("select").trim(), marker = follow(page, path);

      evaluate(source, context, check(callback, function (value) {
        parent.condition = !!value;
        // If the directive body is already in the document, we have nothing to
        // do, we continue and rewrite the body.
        if (!value) {
          erase(marker.begin.nextSibling, marker.end);
          follow(page, path).markers = {};
          callback();
        } else {
          if (empty(marker)) {
            var prototype = follow(template.page, directive.path),
                fragment = copy(page.document, prototype.begin.nextSibling, prototype.end);
            vivify(page, path, fragment);
            fill(marker, fragment);
            generating = true;
          }
          rewrite({}, frames, page, template, includes, directive.directives,
                  path, context, generating, callback);
        }
      }));
    },
    else: function (parent, frames, page, template, includes,
                    directive, element, context, path, generating, callback) {
      element.setAttribute("select", "true");
      handlers.elseif(parent, frames, page, template, includes,
                      directive, element, context, path, generating, callback);
    },
    elseif: function (parent, frames, page, template, includes,
                      directive, element, context, path, generating, callback) {
      var marker = follow(page, path);
      if (parent.condition) {
        erase(marker.begin.nextSibling, marker.end);
        follow(page, path).markers = {};
        callback();
      } else {
        handlers["if"](parent, frames, page, template, includes,
                       directive, element, context, path, generating, callback);
      }
    },
    each: function (parent, frames, page, template, includes,
                    directive, element, context, path, generating, callback) {
      var source = element.getAttribute("select").trim(),
          idSource = element.getAttribute("key").trim(),
          into = element.getAttribute("into").trim(),
          head = follow(page, path), items = head.items,
          previous = head.end, parentNode = previous.parentNode,
          base = path.slice(0, path.length - 2),
          markers = follow(page, base).markers,
          index = 0,
          okay = validator(callback);

      head.items = {};

      if (!empty(head)) {
        erase(head.begin.nextSibling, head.end);
        follow(page, path).markers = {};
      }

      evaluate(source, context, okay(function (value) {
        if (!Array.isArray(value)) value = [ value ];
        value = value.slice();

        shift();

        function shift () {
          var id, marker, part;
          if (value.length) {
            context[into] = value.shift();
            if (idSource) evaluate(idSource, context, okay(scribble));
            else scribble(index++);
          } else {
            for (id in items) {
              part = directive.id + ";" + id;
              marker = follow(page, base.concat([ part ]));
              erase(marker.begin, marker.end.nextSibling);
              delete markers[part];
            }
            callback();
          }
        }

        function scribble (id) {
          id = escape(id);

          delete items[id];
          head.items[id] = true;

          var qualified = directive.id + ";" + id,
              path = base.concat([ qualified ]),
              marker = follow(page, path);

          if (marker.begin) {
            if (previous.nextSibling !== marker.begin) {
              insertBefore(previous.parentNode, cut(marker), previous.nextSibling);
            }
          } else {
            var prototype = follow(template.page, directive.path),
                fragment = copy(page.document, prototype.begin.nextSibling, prototype.end.nextSibling);
            insertBefore(fragment, page.document.createComment(qualified), fragment.firstChild);
            vivify(page, base, fragment);
            insertBefore(previous.parentNode, fragment, previous.nextSibling);
            generating = true;
          }

          previous = follow(page, path).end;

          rewrite({}, frames, page, template, includes, directive.directives,
                  path, context, generating, okay(shift));
        }
      }));
    },
    block: function (parent, frames, page, template, includes, directive, element,
                     context, path, generating, callback) {
      var name = element.getAttribute("name"), marker, fragment, definition,
          caller = frames[0], prototype, i, I;
      if (name) {
        definition = caller.directive.directives.filter(function (directive) {
          return directive.element.localName == name
              && directive.element.namespaceURI == caller.directive.element.namespaceURI;
        }).shift();
      } else {
        definition = caller.directive;
      }
      if (generating) {
        prototype = follow(caller.template.page, definition.path);
        if (prototype.begin.nextSibling != prototype.end) {
          fragment = copy(page.document, prototype.begin.nextSibling, prototype.end);
          marker = follow(page, path);
          marker.markers = {};
          vivify(page, path, fragment);
          erase(marker.begin.nextSibling, marker.end);
          insertBefore(marker.end.parentNode, fragment, marker.end);
        }
      }
      frames = [{ template: template, directive: directive }].concat(frames);
      rewrite({}, frames, page, caller.template, includes, definition.directives,
              path, context, generating, callback);
    },
    tag: function (parent, frames, page, template, includes, directive, element,
                   context, path, generating, callback) {
      var marker = follow(page, path);
      if (!empty(marker)) {
        erase(marker.begin.nextSibling, marker.end);
        follow(page, path).markers = {};
      }
      directive = extend({}, directive);
      directive.frame = frames[0];
      includes[includes[template.url]].tags[element.getAttribute("name")] = directive;
      callback();
    }
  }

  function rewrite (parent, frames, page, template, includes,
                    directives, path, context, generating, callback) {
    var okay = validator(callback), prefix = '$';
    context = extend(Object.create({ $: function (url) {
      return function (context, callback) {
        json(absolutize(template.url + '/..', url), function (error, result) {
          callback(error, result);
        });
      }
    }}), context);
    if (frames[0].attributes) {
      frames[0].attributes.forEach(function (attributes) {
        context[prefix + 'attributes'] = attributes;
        prefix += '$';
      });
    } else {
      while (context[prefix + 'attributes']) {
        delete context.$attributes;
        prefix += '$';
      }
    }
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
          sub = path, include,
          attributed;

      // **TODO**: Probably doesn't do much.
      includes = extend({}, includes);

      if (directive.id) {
        sub = path.concat(directive.id);
        var element = directive.element || follow(page, sub).end.nextSibling;
      }

      operate(operations.shift());

      function operate (operation) {
        switch (operation && operation.type) {
        case "require":
          javascript(absolutize(template.url + '/..', operation.href), okay(function (module) {
            invoke(module, context, okay(function (value) {
              context[operation.name] = value;
              operate(operations.shift());
            }));
          }));
          break;
        case "include":
          fetch(absolutize(template.url + '/..', operation.href), okay(function (included) {
            // See `tag` directive handler for where we need to lookup the URL
            // of the included document by the URI specified as the attribute
            // value to the `xmlns:*` attribute.
            included = extend({}, included);
            included.tags = extend({}, included.tags);
            includes[operation.uri] = included;
            includes[included.url] = operation.uri;
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
          if (directive.interpreter) {
            directive.interpreter(parent, frames, page, template, includes,
                                  directive, element, context, sub, generating, shift);
          } else if (directive.element && (included = includes[directive.element.namespaceURI])) {
            var attributes = {};
            for (var i = 0, I = directive.element.attributes.length; i < I; i++) {
              var attribute = directive.element.attributes[i];
              if (attribute.namespaceURI == null) attributes[attribute.localName] = attribute.nodeValue;
            }
            var include = included.tags[directive.element.localName];
            if (generating) {
              var prototype = follow(included.page, include.path);
                  var marker = follow(page, sub);
                  var fragment = copy(page.document, prototype.begin, prototype.end.nextSibling);
              vivify(page, sub, fragment);
              erase(marker.begin.nextSibling, marker.end);
              fill(marker, fragment);
            }
            sub.push(include.id);
            var frame = include.frame || { attributes: [],
                                           template: template,
                                           directive: directive,
                                           includes: includes }
            frame.attributes.unshift(attributes);
            frames = [frame].concat(frames);
            rewrite({}, frames, page, included, includes, include.directives,
                    sub, context, generating, okay(shift));
          }
          else {
            rewrite({}, frames, page, template, includes, directive.directives,
                    path, context, generating, shift);
          }
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
    else xml(url, okay(compile));

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
      var directives = [], tags = {},
          fragment = document.createDocumentFragment(),
          page = { markers: {}, document: document, fragment: fragment };

      insertBefore(fragment, document.documentElement);

      // Visit all the nodes creating a tree of directives.
      unravel(page.document, { stencil: true }, tags, directives, [], fragment);
      vivify(page, [], fragment);

      // Create our template.
      templates[url] = {
        url: url, page: page, directives: directives, tags: tags
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
      for (var i = 0; i < node.attributes.length; i++) {
        var attr = node.attributes[i], protocol;
        switch (attr.namespaceURI) {
        case "http://www.w3.org/2000/xmlns/":
          if (protocol = attr.nodeValue.split(/:/).shift()) {
            var href = normalize(attr.nodeValue.substring(protocol.length + 1));
            if (!"require".indexOf(protocol)) {
              operations.unshift({ type: "require", href: href, name: attr.localName });
              namespaces[attr.nodeValue] = true;
            } else if (!"include".indexOf(protocol)) {
              operations.unshift({ type: "include", href: href, uri: attr.nodeValue });
              namespaces[attr.nodeValue] = true;
            }
          }
          if (namespaces[attr.nodeValue]) {
            node.removeAttributeNode(attr);
            i--;
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

      var directive = { operations: operations.concat(attributes), directives: [], tags: {} };

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

    function unravel (document, namespaces, tags, directives, path, node) {
      if (!tags) throw new Error();
      var directive, child, parentNode, marker, end;
      if (directive = directivize(namespaces, node)) {
        if (directive.id) {
          path = path.concat(directive.id);
        }
        directive.path = path;

        directives.push(directive);
        directives = directive.directives;

        if (node.namespaceURI == "stencil" && node.localName == "tag") {
          tags[node.getAttribute("name")] = directive;
          tags = directive.tags;
        }
      }
      for (child = node.firstChild; child; child = child.nextSibling) {
        child = unravel(document, extend({}, namespaces), tags, directives, path, child);
      }
      if (directive && directive.id) {
        end = node;
        parentNode = node.parentNode;
        insertBefore(parentNode, document.createComment(directive.id), node);
        if (namespaces[node.namespaceURI]) {
          end = node.nextSibling;
          while (node.firstChild) {
            insertBefore(parentNode, removeChild(node, node.firstChild), node);
          }
          removeChild(parentNode, node);
        }
        return insertBefore(parentNode, document.createComment("?"), end);
      }
      return node;
    }
  }

  function follow (marker, path) {
    for (var i = 0, I = path.length; i < I; i++) {
      if (!marker.markers[path[i]]) {
        marker.markers[path[i]] = { markers: {}, items: {} };
      }
      marker = marker.markers[path[i]];
    }
    return marker;
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
      rewrite({}, [{}], page, template, {}, template.directives,
              [], parameters, false, okay(function () {
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

    url = absolutize('/', normalize(url));
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
      var fragment = template.page.fragment.ownerDocument
                             .implementation.createDocument().createDocumentFragment(),
          page = {
        document: fragment.ownerDocument,
        fragment: fragment,
        template: template,
        markers: {}
      };
      insertBefore(fragment, page.document.importNode(template.page.fragment, true));

      vivify(page, [], fragment);

      // Evaluate the template.
      rewrite({}, [{}], page, template, {}, template.directives,
              [], parameters, true, okay(result));

      function result () {
        insertBefore(page.document, page.fragment);
        var comment = page.document.createComment("stencil:" + url);
        insertBefore(page.document.documentElement, comment, page.document.documentElement.firstChild);
        callback(null, page);
      }
    }
  }

  return { generate: generate, regenerate: regenerate, reconstitute: reconstitute, normalize: normalize }
}});
