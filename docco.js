var edify = require("edify").create();
edify.language(
{ lexer: "coffeescript"
, docco: "#"
, ignore: [ /^#!/, /^#\s+vim/ ]
});
module.exports = { docco: edify };
