var xmldom = require("xmldom"), fs = require("fs");

function visit (array, element) {
  array.push({ start: true, element: element, nodeType: 1 });
  for (var child = element.firstChild; child; child = child.nextSibling) {
    if (child.nodeType == 1) {
      visit(array, child);
    } else {
      array.push(child);
    }
  }
  array.push({ start: false, element: element, nodeType: 1 });
  return array;
}

function flatten (doc) {
  return visit([], doc.documentElement || doc);
}

function attributes (element) {
  var attrs = {}, name, attr, i, I;
  for (i = 0, I = element.attributes.length; i < I; i++) {
    attr = element.attributes.item(i);
    name = attr.localName;
    if (attr.namespaceURI) name += ":(" + attr.namespaceURI + ")";
    attrs[name] = attr;
  }
  return attrs;
}

function _name (node) {
  return node.localName + (node.namespaceURI ? '(' + node.namespaceURI + ')' : '');
}

function compare (actual, expected) {
  var _actual = actual, _expected = expected;
  function abend(e) {
    console.log(_actual.toString());
    console.log(_expected.toString());
    var stack = [], attrs = [], e = e.nodeType == 1 ? e.element : e.parentNode, i;
    do {
      attrs.length = 0;
      if (e.nodeType == 1) for (i = 0; i < e.attributes.length; i++) {
        attrs.push(_name(e.attributes[i]) + '=' + e.attributes[i].nodeValue)
      }
      stack.unshift(_name(e) + (attrs.length ? '[' + (attrs.join(' ')) + ']' : ''));
    } while ((e = e.parentNode) && e.nodeType == 1);
    throw new Error(stack.join('/'));
  }
  if (typeof expected == "string") {
    expected = new (xmldom.DOMParser)().parseFromString(expected).documentElement;
  }
  var e, a, aa, ea, an, en, name, at = [], et = [], remainder;
  actual = flatten(actual);
  expected = flatten(expected);
  a = actual.shift();
  while (expected.length) {
    e = expected.shift();
    switch (e.nodeType) {
    case 1:
      while (a.nodeType != 1 && actual.length) {
        if (a.nodeType == 3) {
          at.push(a.nodeValue);
        }
        a = actual.shift();
      }
      if (a.nodeType != e.nodeType) return abend(e);
      if (a.start != e.start) return abend(e);
      if (at.join("").trim() != et.join("").trim()) return abend(e);
      if (a.nodeType == 1) {
        an = a.element;
        en = e.element;
        aa = attributes(an);
        ea = attributes(en);
        for (name in ea) {
          if (!aa[name]) return abend(e);
          if (ea[name].nodeValue != aa[name].nodeValue) return abend(e);
          delete(aa[name]);
        }
        if (Object.keys(aa).length) return abend(e);
      }
      at.length = et.length = 0;
      a = actual.shift();
      break;
    case 3:
      et.push(e.nodeValue);
      break;
    case 8:
      break;
    default:
      throw new Error("Unexpected nodeType: " + e.nodeType);
    }
  }
  while (actual.length) {
    a = actual.shift();
    if (a.nodeType != 3 || a.nodeValue.trim() != "") return abend(e);
  }
  while (expected.length) {
    e = expected.shift();
    if (e.nodeType != 3 || e.nodeValue.trim() != "") return abend(e);
  }
  return true;
}

module.exports = compare;
