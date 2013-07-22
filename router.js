module.exports = function (_require, routes) {
    var router = require('reactor')(routes)
    var matches = router(location.pathname)
    matches.forEach(function (match) {
        match.route.requirements.forEach(function (requirement) {
            _require(requirement)()
            _require(requirement)()
        })
    })
}
