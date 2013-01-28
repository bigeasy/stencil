! function (definition) {
  if (typeof module == "object" && module.exports) definition(require, module.exports, module);
  else if (typeof define == "function" && typeof define.amd == "object") define(definition);
} (function (require, exports, module) {
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
  // explain to people why you're not using the package/module system in a way
  // that they expect you to use it.
  var emitter = new (require('events').EventEmitter)();
  var generator = function dynamic (immediate, callback) {
    if (immediate) callback(null, watchers1);
    emitter.on('update', callback);
    return function () { emitter.removeListener('update', callback) }
  }

  generator.emitter = emitter;
  generator.watchers2 = watchers2;

  module.exports = generator;
  var watchers = [
    [
      {
        "login": "bigeasy",
        "url": "https://api.github.com/users/bigeasy",
        "gravatar_id": "dbd499ef24f9b96e2f9678f8ba93b672",
        "avatar_url": "https://secure.gravatar.com/avatar/dbd499ef24f9b96e2f9678f8ba93b672?d=https://a248.e.akamai.net/assets.github.com%2Fimages%2Fgravatars%2Fgravatar-140.png",
        "id": 34673
      },
      {
        "login": "chadsmith",
        "url": "https://api.github.com/users/chadsmith",
        "gravatar_id": "29f6f8b3b91f03b453514f2482966ada",
        "avatar_url": "https://secure.gravatar.com/avatar/29f6f8b3b91f03b453514f2482966ada?d=https://a248.e.akamai.net/assets.github.com%2Fimages%2Fgravatars%2Fgravatar-140.png",
        "id": 187174
      },
      {
        "login": "azampagl",
        "url": "https://api.github.com/users/azampagl",
        "gravatar_id": "1ed4e09451a8696ad7ffd503013aac2c",
        "avatar_url": "https://secure.gravatar.com/avatar/1ed4e09451a8696ad7ffd503013aac2c?d=https://a248.e.akamai.net/assets.github.com%2Fimages%2Fgravatars%2Fgravatar-140.png",
        "id": 43206
      }
    ]
    ,
    [
      {
        "gravatar_id": "dbd499ef24f9b96e2f9678f8ba93b672",
        "avatar_url": "https://secure.gravatar.com/avatar/dbd499ef24f9b96e2f9678f8ba93b672?d=https://a248.e.akamai.net/assets.github.com%2Fimages%2Fgravatars%2Fgravatar-140.png",
        "id": 34673,
        "login": "bigeasy",
        "url": "https://api.github.com/users/bigeasy"
      },
      {
        "gravatar_id": "29f6f8b3b91f03b453514f2482966ada",
        "avatar_url": "https://secure.gravatar.com/avatar/29f6f8b3b91f03b453514f2482966ada?d=https://a248.e.akamai.net/assets.github.com%2Fimages%2Fgravatars%2Fgravatar-140.png",
        "id": 187174,
        "login": "_chadsmith",
        "url": "https://api.github.com/users/chadsmith"
      },
      {
        "gravatar_id": "1ed4e09451a8696ad7ffd503013aac2c",
        "avatar_url": "https://secure.gravatar.com/avatar/1ed4e09451a8696ad7ffd503013aac2c?d=https://a248.e.akamai.net/assets.github.com%2Fimages%2Fgravatars%2Fgravatar-140.png",
        "id": 43206,
        "login": "azampagl",
        "url": "https://api.github.com/users/azampagl"
      }
    ]
  ];

  module.exports = function (broker, callback) {
    var request = broker.get("request"), index = +(/(\d+)$/.exec(request.url)[1]);
    callback(null, watchers[index]);
  }
});
