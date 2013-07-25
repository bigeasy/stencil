var cadence = require('cadence')

// okay, well a dependency woudl be either a file name, or a URL. Without a
// scheme we assume a file path. The only scheme that makes sense though is HTTP
// or HTTPS, maybe FTP, but are you really going to want to touch an FTP server
// as part of a build.
//
// Then it propagates an event.


function Artifact () {
}

Artifact.prototype.make = function () {
}

Artifact.prototype.dependencies = function ()
}

function Application () {
}

// too difficult, what is actually simple?

function Catenate (file, files) {
    this._file = file
    this._files = files
}

// cool, so when a component is rebuild, we remove it, then have it re-register
// itself, right?
Catenate.prototype.register = cadence(function (step, registrar) {
    var artifact = registrar.artifact(this._file)
    this._files.forEach(artifact.depends.bind(artifact))
})

function Project () {
}

Project.prorotype.register = cadence(function (step, registrar) {
    step(function (component) {
        component.register(registrar, step())
    })(this._components)
})

// I'm seeing an array of functions. They are called and return expired, true or
// false. If they are expired, they are removed from the array, or whatever sort
// of collection we have, maybe a tree, maybe linked list. Probably an array.
//
// Inside the function is an array that has a boolean, if it flips to false,
// this is expired. Otherwise there is some sort of a test. These are the tests
// that need to be tickled, like stats or gets.
//
// Most targets are going to have a build step that hoovers in all that's
// needed, like LESS or browserify. Adding a dependency reporting step will
// ensure that they are only run as needed.


Reactor.prototype.rule = cadence(function (step) {
    step(function () {

    })
})

function Trigger () {
}
Trigger.prototype.x = () {
}

function Builder () {
}

Builder.prototype.rebuild = function () {
}
