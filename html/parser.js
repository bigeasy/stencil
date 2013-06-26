var htmlparser = require("htmlparser");

function copy (document, parent, dom) {
  dom.forEach(function (node) {
    switch (node.type) {
    case "text":
      var child = document.createTextNode(node.data);
      break;
    case "tag":
      var child = document.createElement(node.name);
      for (var key in node.attribs) {
        child.setAttribute(key, node.attribs[key]);
      }
      copy(document, child, node.children || []);
      break;
    }
    parent.appendChild(child);
  });
}

function html (document, html) {
    var handler = new htmlparser.DefaultHandler(),
        frag = document.createDocumentFragment();
    var parser = new htmlparser.Parser(handler);
    parser.parseComplete(html);
    copy(document, frag, handler.dom);
    return frag;
}

module.exports = html;
