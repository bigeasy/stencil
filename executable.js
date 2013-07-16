var cadence = require('cadence')

exports.runner = cadence(function (step, options, stdin, stdout, stderr) {
    if (options.params.help) options.help()
})
