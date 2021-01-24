#!/usr/bin/env node

/*
    ___ usage ___ en_US ___
    usage: prolific <protocol> <protocol args>

            --help                      display this message

    ___ $ ___ en_US ___

        udp is required:
            the `--udp` address and port is a required argument

        port is not an integer:
            the `--udp` port must be an integer

    ___ . ___
*/
require('arguable')(module, async arguable => {
    arguable.helpIf(arguable.ultimate.help)
    const delegate = arguable.delegate(require, 'stencil.%s', arguable.argv.shift())
    const child = delegate(arguable.argv)
    arguable.destroyed.then(child.destroy.bind(child))
    return await child.exit
})
