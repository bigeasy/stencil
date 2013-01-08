require([ 'jquery', '/npm/stencil.js', '/npm/reactor.js', 'text!/routes.json' ], function ($, stencil, reactor, routes) {
  var context = stencil.create('/stencils/', function (url, mimeType, callback) {
    $.get(url, function (data) {
      callback(null, data);
    }, mimeType.substring(mimeType.indexOf("/") + 1));
  });
  var reactor = reactor.createReactor();
  var stencil = context.reconstitute(document, function (error, stencil) {
    if (error) throw error;
    JSON.parse(routes).forEach(function (route) {
      reactor.get(route.route, function (params, request, response) {
        var pathInfo = params.pathInfo ? '/' + params.pathInfo : '';
          context.regenerate(stencil, { pathInfo: pathInfo }, function (error, stencil) {
            if (error) throw error;
          });
      });
    });
  });
  window.addEventListener('popstate', function (event) {
    reactor.react('GET', window.location.pathname)
  }, true);
  $('body').delegate('a', 'click', function (event) {
    // Path is about to be reassigned by a Stenci update, so we need to grab a
    // copy for our subsequent `pushState`.
    var path = this.pathname;
    if (reactor.react('GET', path)) {
      event.preventDefault();
      history.pushState({}, "", path);
      return false;
    }
    return true;
  });
});
