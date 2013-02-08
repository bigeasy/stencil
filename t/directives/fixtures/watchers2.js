define([ "fs" ], function (fs) {
  return function (modeler) {
    modeler.pipe("watchers");
    modeler.init("watchers", function (request, callback) {
      try {
        var data = JSON.parse(fs.readFileSync("json.xml", "utf8"));
        callback(null, data);
      } catch (error) {
        callback(error);
      }
    });
  }
});
