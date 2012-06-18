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

function compare (actual, expected) {
  if (typeof expected == "string") {
    expected = new (xmldom.DOMParser)().parseFromString(expected).documentElement;
  }
  var e, a, aa, ea, name, at = [], et = [], remainder;
  actual = flatten(actual);
  expected = flatten(expected);
  a = actual.shift();
  while (expected.length) {
    e = expected.shift();
    switch (e.nodeType) {
    case 1:
      while (a.nodeType == 3 && actual.length) {
        at.push(a.nodeValue);
        a = actual.shift();
      }
      if (a.nodeType != 1) return false;
      if (a.start != e.start) return false;
      if (at.join("").trim() != et.join("").trim()) return false;
      a = a.element;
      e = e.element;
      aa = attributes(a);
      ea = attributes(e);
      for (name in ea) {
        if (!aa[name]) return false;
        if (ea[name].nodeValue != aa[name].nodeValue) return false;
      }
      at.length = et.length = 0;
      a = actual.shift();
      break;
    case 3:
      et.push(e.nodeValue);
      break;
    default:
      throw new Error("Unexpected nodeType: " + e.nodeType);
    }
  }
  while (actual.length) {
    a = actual.shift();
    if (a.nodeType != 3 || a.nodeValue.trim() != "") return false;
  }
  while (expected.length) {
    e = expected.shift();
    if (e.nodeType != 3 || e.nodeValue.trim() != "") return false;
  }
  return true;
}

module.exports = compare;
