var fs = require("fs"), path = require("path");

function routes (base) {
  var routes = [];
  function children (base, parts) {
    var dir = path.join.apply(path, [ base ].concat(parts)), files = [];
    fs.readdirSync(dir).forEach(function (entry) {
      var file = path.join(dir, entry), stat = fs.statSync(file);
      if (stat.isDirectory()) {
        children(base, parts.concat(file));
      } else { 
        files.push(entry);
      }
    });
    files.forEach(function (entry) {
      var file = path.join(dir, entry);
      if (/^[^_].*\.stencil$/.test(entry)) {
        var $ = /^(.*?)(_?)\.stencil$/.exec(entry),
            name = $[1], pathInfo = !! $[2],
            route = parts.slice(0);
        if (name != "index") route.push(name);
        // Note that we do not use the file systems path separator when
        // resolving stencils.
        routes.push({
          route: "/" + route.join("/"),
          stencil: parts.concat(entry).join("/")
        });
        if (pathInfo) {
          routes.push({
            route: "/" + route.join("/") + "/**:pathInfo",
            stencil: parts.concat(entry).join("/")
          });
        }
      }
    });
  }
  children(base, []);
  return routes;
}

if (require.main === module) console.log(routes('stencils'));
else exports.routes = routes;
