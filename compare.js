function compare (left, right) {
  if (!right || left.nodeType != right.nodeType) return false;
  switch (left.nodeType) {
  case 1:
    if (left.attributes.length != right.attributes.length) return false;
    for (var i = 0, I = left.attributes.length; i < I; i++) {
      var attr = left.attributes[i];
      if (right.getAttributeNS(attr.namespaceURI, attr.localName).nodeValue != attr.nodeValue)
        return false;
    }
    for (var i = 0, I = left.children.length; i < I; i++)
      if (!compare(left.children[i], right.children[i]))
        return false;
    return true;
  case 3:
  case 4:
    return left.nodeValue == right.nodeValue;
  }
  return true;
}

