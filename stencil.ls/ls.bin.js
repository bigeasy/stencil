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

    const fs = require('fs').promises
    const path = require('path')
    const coalesce = require('extant')

    const dir = coalesce(arguable.argv[0], '.')
    const ls = []
    for (const file of await fs.readdir(dir)) {
        const stats = await fs.stat(path.join(dir, file))
        ls.push({
            name: file,
            path: path.join(dir, file),
            stats: stats,
            isFile: stats.isFile(),
            isDirectory: stats.isDirectory(),
            isBlockDevice: stats.isBlockDevice(),
            isCharacterDevice: stats.isCharacterDevice(),
            isSymbolicLink: stats.isSymbolicLink(),
            isFIFO: stats.isFIFO(),
            isSocket: stats.isSocket()
        })
    }

    arguable.stdout.write(JSON.stringify(ls) + '\n')

    return 0
})
