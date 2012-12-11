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
  function evaluate (source, context) {
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
    return compiled.expression.apply(this, values);
  }

  function mark (id, reference) {
    var document = reference.ownerDocument,
        comment = document.createComment("(Stencil[" + id + "])");
    return reference.parentNode.insertBefore(comment, reference);
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
    parentNode.removeChild(marker);
  }

  function abracadabra (template, document, parameters, callback) {
    var context;

    var ops = {
      attribute: function (bouquet, operation) {
        var value = evaluate(operation.value, context);
        if (value == null) {
          bouquet.element.removeAttribute(operation.name);
        } else {
          bouquet.element.setAttribute(operation.name, value);
        }
        operate(bouquet);
      }
    };

    function operate (bouquet) {
      if (bouquet.operations.length) {
        var operation = bouquet.operations.shift();
        ops[operation.type](bouquet, operation);
      } else {
        bouquet.callback();
      }
    }

    function operations (directive, element, callback) {
      operate({
        operations: directive.operations.slice(0),
        directive: directive,
        element: element,
        callback: callback
      });
    }

    var handlers = {
      // The value directive replaces a value element with text from the current
      // context.
      value: function (directive, element, context, callback) {
        var source = element.getAttribute("select").trim(),
            value = evaluate(source, context),
            instance = template.instances[directive.id][0],
            marker = template.markers[instance.id];

        // Mark the new insert.
        template.markers[instance.id] = mark(directive.id, marker);

        // Insert the text value.
        var text = document.createTextNode(value);
        marker.parentNode.insertBefore(text, marker);

        // Remove the old marker.
        unmark(marker, instance);

        // Record the instance.
        instance.characters = value.length;
        instance.elements = 0;

        callback();
      },
      marker: function (directive, element, context, callback) {
        var instance = template.instances[directive.id][0],
            marker = template.markers[instance.id],
            marked = marker.nodeType == 1 ? marker.parentNode : marker.nextSibling;

        // If the element marker it still in place, replace with a comment
        // marker for the duration. It never needs to be recalculated.
        if (marker.nodeType == 1) {
          unmark(marker, instance);
          template.markers[instance.id] = mark(directive.id, marked);
        }

        operations(directive, marked, callback);
      }
    }

    next({ directives: template.directives.slice(0), context: parameters }, callback);

    function next (descent, callback) {
      if (descent.directives.length) descend(descent, callback);
      else if (descent.parent) next(descent.parent, callback);
      else callback();
    }

    function descend (descent, callback) {
      var directive = descent.directives.shift(),
          element = template.document.getElementById(directive.id),
          handler = handlers[element.localName],
          stack = [], i;

      // Create an evaluation context.
      context = {};
      for (i = descent; i; i = i.parent) stack.push(i);
      for (i = stack.length - 1; i != -1; i--) {
        for (var key in stack[i].context) {
          context[key] = stack[i].context[key];
        }
      }

      handler(directive, element, context, function () {
        next({ parent: descent, directives: directive.children.slice(0), context: {} }, callback);
      });
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
    // we add a marker element as the elmeent's first child, to mark the user
    // element in the template document, without abusing the id of the user
    // element, which would be visible in the output.
    //
    // With the markers in place, all of the element participants in the
    // template can have a unique id, without overriding, or stepping around,
    // any user specified ids on user elements. The user could still choose to
    // use an id in her markup that collides with the auto generated ids, but
    // that is a collision that is easy to avoid. The generated ids are a
    // catenation of Stencil path and sequence number, unlikely to conincide
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
      templates[url] = { url: url, document: document, directives: directives };

      // Send the template to our caller.
      callback(null, templates[url]);
    }

    // Create a directive structure from the node, if the node is a directive.
    function directivize (unmarked, node) {
      // Only elements can be directives.
      if (node.nodeType != 1) return;

      // Gather object constructors, template includes and dynamic attributes
      // into our array of operations.
      var operations = [];
      for (var i = 0, I = node.attributes.length; i < I; i++) {
        var attr = node.attributes.item(i), protocol;
        switch (attr.namespaceURI) {
        case "http://www.w3.org/2000/xmlns/":
          if (protocol = attr.nodeValue.split(/:/).shift()) {
            var href = attr.nodeValue.substring(protocol.length + 1)
            if (!"object".indexOf(protocol)) operations.unshift({ type: "object", href: href });
            else if (!"include".indexOf(protocol)) operations.unshift({ type: "include", href: href });
          }
          break;
        case "stencil":
          operations.push({ type: "attribute", name: attr.localName, value: attr.nodeValue });
          break;
        }
      }

      operations.forEach(function (operation) {
        if (operation.type == "attribute") {
          node.removeAttributeNS("stencil", operation.name);
        }
      });

      // We have a directive if the namespace is the Stencil namespace, or we've
      // discovered operaitons. If we're not a Stencil directive, we insert a
      // placeholder marker as a child of the element.
      if (node.namespaceURI == "stencil" || operations.length) {
        var id = url + "#" + (identifier++);
        if (node.namespaceURI != "stencil") {
          unmarked.push({ node: node, id: id });
        } else {
          node.setAttribute("id", id);
        }
        return { id: id, operations: operations, children: []};
      }
    }
  
    function visit (unmarked, children, node) {
      var directive, child;
      if (directive = directivize(unmarked, node)) {
        children.push(directive);
        children = directive.children;
      }
      for (child = node.firstChild; child; child = child.nextSibling) {
        visit(unmarked, children, child);
      }
    }
  }

  function inorder (directives, callback) {
    directives.forEach(function (directive) {
      callback(directive);
      inorder(directive.children, callback);
    });
  }

  function regenerate (instance, parameters, callback) {
    if (typeof parameters == "function") {
      callback = parameters;
      parameters = {};
    }

    abracadabra(instance._template, instance.document, parameters, function () {
      callback(null, instance);
    });
  }

  function generate (url, parameters, callback) {
    if (typeof parameters == "function") {
      callback = parameters;
      parameters = {};
    }

    url = normalize(url);
    fetch(base, url, check(callback, interpret));

    function instanciate (template) {
      return {
        document: template.document,
        url: template.url,
        directives: JSON.parse(JSON.stringify(template.directives)),
        instanceId: 0,
        instances: {},
        markers: {}
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

      // Take the instanciated template and insert placeholder instances that
      // use the directive elements as markers.
      inorder(template.directives, function (directive) {
        var instanceId = template.instanceId++;
        template.instances[directive.id] = [{
          id: instanceId,
          elements: 0,
          characters: 0
        }];
        template.markers[instanceId] = document.getElementById(directive.id);
      });

      // Evaluate the template.
      abracadabra(template, document, parameters, function () {
        callback(null, { document: document, _template: template });
      });
    }
  }

  return { generate: generate, regenerate: regenerate }
}});
