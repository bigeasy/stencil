// Use a regular expression to tidy XML serialized by the `toString` method of
// XML DOM. See [RegEx match open tags except XHTML self-contained
// tags](http://stackoverflow.com/a/1732454/90123). Will only work if the DOM
// implementation has a meaningful `toString` method.
module.exports = function (node) {
  return node.toString().replace(/<([^\s>\/]+)(.*?)\/>/g, function ($1, name, attrs) {
    attrs || (attrs = '');
    return /^(area|base|br|col|command|embed|hr|img|input|keygen|link|meta|param|source|track|wbr)$/.test(name) ?
      '<' + name + attrs + '>' : '<' + name + attrs + '></' + name + '>';
  });
}
