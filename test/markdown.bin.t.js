require('proof')(2, async okay => {
    const stream = require('stream')
    const markdown = require('../stencil.markdown/markdown.bin')
    const child = markdown([ '--select', '.markdown' ], {
        $stdin: new stream.PassThrough,
        $stdout: new stream.PassThrough
    })
    child.options.$stdin.write('<div class="markdown">*strong*</div>')
    child.options.$stdin.end()
    okay(await child.exit, 0, 'exit')
    okay(child.options.$stdout.read().toString(), '<html><head></head><body><div class="markdown"><p><em>strong</em></p>\n</div></body></html>', 'running')
})
