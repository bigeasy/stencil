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


  function fetch (base, url, callback) {
    var okay = validator(callback);

    if (templates[url]) callback(null, templates[url]);
    else resolver(absolutize(base, url), "text/xml", okay(attribute));

    // Prepare a newly loaded template for used by the engine.

    // First, iterate through the document looking for attribute variables,
    // removing them, then adding attribute definition elements.
    function attribute (document) {
      var each = document.getElementsByTagName('*'), i, I, j;
      for (i = 0, I = each.length; i < I; i++) {
        // TODO
      }
      identify (document);
    }

    // Now that all of the Stencil directives are elements, give each Stencil
    // element an `id` attribute that will be consistent on the server and in
    // the browser. This will obliterate any id attibute in assigned to the
    // Stencil element by the user, but that is okay, because they're never
    // going to to see the Stencil namespace in an output document.
    function identify (document) {
      var each = document.getElementsByTagName('*'),
          namespaces = { stencil: true },
          id = 0, element, i, I, j, attribute, protocol;
      // Note that you do not need to maintain a namespace stack to track the
      // namespace aliases. If we see a tag library included using the include
      // protocol we know that the namespace URI is a tag library URI.
      // Reassignment or unassigment of an alias will so that a namespace thatbb
      // is redefined
      for (i = 0, I = each.length; i < I; i++) {
        element = each.item(i);
        for (j = element.attributes.length - 1; j != -1; j--) {
          if (element.attributes[j].namespaceURI == XMLNS
          && (protocol = element.attributes[j].nodeValue.split(/:/).shift())
          && (!"include".indexOf(protocol))) {
              namespaces[element.attributes[j].nodeValue] = true;
          }
        }
        if (namespaces[element.namespaceURI])  {
          element.setAttribute('id', url + '#' + (id++));
        }
      }

      compile(document);
    }

    // Finally, we locate all of our elements and create a tree of them.
    function compile (document) {
      var directives = [];
      visit(directives, document.documentElement);

      templates[url] = { url: url, document: document, directives: directives, inorder: inorder };

      callback(null, templates[url]);
    }
  
    function visit (children, node) {
      var record, child;
      if (node.nodeType == 1 && node.namespaceURI == NS_STENCIL) {
        record = { id: node.getAttribute('id'), children: [] };
        children.push(record);
        children = record.children;
      }
      for (child = node.firstChild; child; child = child.nextSibling) {
        visit(children, child);
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
