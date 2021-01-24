/*

    ___ usage ___ en_US ___
    node markdown.bin.js <options> [sockets directory, sockets directory...]

    options:

        --help                          display help message
        -s, --select        <string>    path to select
        -t, --type          <string>    either text or html

    ___ $ ___ en_US ___

        select is required:
            the `--select` argument is a required argument

    ___ . ___

 */
require('arguable')(module, async arguable => {
    const path = require('path')
    const cheerio = require('cheerio')
    const fs = require('fs').promises
    const once = require('eject')

    arguable.helpIf(arguable.ultimate.help)
    arguable.required('select', 'type')
    arguable.assert(/^(?:text|html)$/.test(arguable.ultimate.type), 'bad type')

    const stdin = []
    arguable.stdin.resume()
    arguable.stdin.on('data', chunk => stdin.push(chunk))
    await once(arguable.stdin, 'end').promise
    const $ = cheerio.load(Buffer.concat(stdin).toString('utf8'))
    const selected = $(arguable.ultimate.select)
    for (let i = 0, I = selected.length; i < I; i++) {
        const file = $(selected[i]).attr('data-file')
        const resolved = path.resolve(process.cwd(), file)
        const body = await fs.readFile(resolved, 'utf8')
        $(selected[i])[arguable.ultimate.type](body)
    }
    arguable.stdout.write($.html())
    return 0
})
