/*

    ___ usage ___ en_US ___
    node markdown.bin.js <options> [sockets directory, sockets directory...]

    options:

        --help                          display help message
        -s, --select        <string>    path to select

    ___ $ ___ en_US ___

        select is required:
            the `--select` argument is a required argument

    ___ . ___

 */
require('arguable')(module, async arguable => {
    const marked = require('marked')
    const cheerio = require('cheerio')
    const once = require('eject')

    arguable.helpIf(arguable.ultimate.help)
    arguable.required('select')

    const stdin = []
    arguable.stdin.resume()
    arguable.stdin.on('data', chunk => stdin.push(chunk))
    await once(arguable.stdin, 'end').promise
    const $ = cheerio.load(Buffer.concat(stdin).toString('utf8'))
    $(arguable.ultimate.select).each(function () { $(this).html(marked($(this).text())) })
    arguable.stdout.write($.html())
    return 0
})
