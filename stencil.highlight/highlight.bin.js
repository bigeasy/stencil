/*

    ___ usage ___ en_US ___
    node highlight.bin.js <options> [sockets directory, sockets directory...]

    options:

        --help                          display help message
        -s, --select        <string>    path to select
        -l, --language      <string>    the language
        -t, --trim                      trim leading an trailing whitespace
        -d, --dedent                    dedent code to left-most character

    ___ $ ___ en_US ___

        select is required:
            the `--select` argument is a required argument

        language is required:
            the `--language` argument is a required argument
    ___ . ___

 */
require('arguable')(module, async arguable => {
    const highlight = require('highlight.js')
    const cheerio = require('cheerio')
    const once = require('eject')

    arguable.helpIf(arguable.ultimate.help)
    arguable.required('select', 'language')

    const stdin = []
    arguable.stdin.resume()
    arguable.stdin.on('data', chunk => stdin.push(chunk))
    await once(arguable.stdin, 'end').promise
    const $ = cheerio.load(Buffer.concat(stdin).toString('utf8'))
    $(arguable.ultimate.select).each(function () {
        let text = $(this).text()
        const lines = text.split('\n')
        while (lines.length != 0 && /^\s*$/.test(lines[0])) {
            lines.shift()
        }
        while (lines.length != 0 && /^\s*$/.test(lines[lines.length -1])) {
            lines.pop()
        }
        text = lines.join('\n')
        if (arguable.ultimate.dedent) {
            let min = Infinity
            for (const match of text.matchAll(/^$|(^ *)(\S)/gm)) {
                if (match[1] != null) {
                    min = Math.min(match[1].length, min)
                }
            }
            text = text.replace(new RegExp(`^ {${min}}`, 'gm'), '')
        }
        $(this).html(highlight.highlight(arguable.ultimate.language, text).value)
    })
    arguable.stdout.write($.html())
    return 0
})
