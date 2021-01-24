/*

    ___ usage ___ en_US ___
    node highlight.bin.js <options> [sockets directory, sockets directory...]

    options:

        --help                          display help message
        -j, --json          <string>    optional json to feed to template

    ___ $ ___ en_US ___

        select is required:
            the `--select` argument is a required argument

        language is required:
            the `--language` argument is a required argument
    ___ . ___

 */
require('arguable')(module, async arguable => {
    arguable.helpIf(arguable.ultimate.help)

    const stream = require('stream')
    const pug = require('pug')
    const once = require('eject')
    const json = require('./json')
    const argv = []
    for (const arg of arguable.argv) {
        argv.push(await json(arg))
    }
    const stdin = []
    arguable.stdin.resume()
    arguable.stdin.on('data', chunk => stdin.push(chunk))
    await once(arguable.stdin, 'end').promise
    const f = pug.compile(Buffer.concat(stdin).toString('utf8'), { pretty: true })
    arguable.stdout.write(f({ argv }) + '\n')
    return 0
})
