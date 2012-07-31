!function (definition) {
  if (typeof module == "object" && module.exports) module.exports = definition();
  else if (typeof define == "function" && typeof define.amd == "object") define(definition);
  else this.tz = definition();
} (function () {
  var fs = require('fs')
    , watchers1 = JSON.parse(fs.readFileSync(__dirname + '/watchers-1.json', 'utf8'))
    , watchers2 = JSON.parse(fs.readFileSync(__dirname + '/watchers-2.json', 'utf8'))
    , count = 0
    ;
  // STEP: If we don't want to expose both handles to the user, then we need to
  // have this module pull in another module.
  //
  // We're going to need a package/module system for this framework. Don't build
  // an IoC monster. All you need is a package/module system. Then you need to
  // explain to the trolls why you're not using the package/module system in a
  // way that they expect you to use it.
  var emitter = new (require('events').EventEmitter)();
  var generator = function dynamic (immediate, callback) {
    if (immediate) callback(null, watchers1);
    emitter.on('update', callback);
  }

  generator.emitter = emitter;
  generator.watchers2 = watchers2;
  return generator;
});
