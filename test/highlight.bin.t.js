require('proof')(4, async okay => {
    const stream = require('stream')
    const highlight = require('../stencil.highlight/highlight.bin')
    // Straight.
    {
        const child = highlight([ '--select', 'pre.javascript', '--language', 'javascript' ], {
            $stdin: new stream.PassThrough,
            $stdout: new stream.PassThrough
        })
        child.options.$stdin.write('<pre class="javascript">var i = 0;</div>')
        child.options.$stdin.end()
        okay(await child.exit, 0, 'exit')
        okay(child.options.$stdout.read().toString(), '<html><head></head><body><pre class="javascript"><span class="hljs-keyword">var</span> i = <span class="hljs-number">0</span>;</pre></body></html>', 'highlight')
    }
    // Trim and dedent.
    {
        const child = highlight([ '--select', 'pre.javascript', '--language', 'javascript', '--dedent' ], {
            $stdin: new stream.PassThrough,
            $stdout: new stream.PassThrough
        })
        child.options.$stdin.write(`
            <pre class="javascript">

                var i = 0;

                i++
            </div>
        `)
        child.options.$stdin.end()
        okay(await child.exit, 0, 'exit')
        okay(child.options.$stdout.read().toString(), '<html><head></head><body><pre class="javascript"><span class="hljs-keyword">var</span> i = <span class="hljs-number">0</span>;\n\ni++</pre></body></html>', 'highlight')
    }
})
