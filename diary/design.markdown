# Stencil Design

## Stencil and Resource Loading

Key to the Stencil strategy is the notion that your scripts run identically on
the server as they do in the browser, but we're going to say with the exception
of module loading, becuase I don't want to replace Node.js module loading, which
works fine on the browser, with AMD.

When using Stencil off-line, the current `resolver.js` is what it needs to be.
It loads everything off of the file system. 

For the browser, I do want a minimalist implementation, one that uses XHR for
JSON and XML, using it directly because it is there, then I'm using RequireJS
AMD, which is odd, becuase Stencil 3.37k and no RequireJS AMD is 6.18k. It makes
me want to consider a lighter alternative, but there probably are none, it is a
another rabbit hole and I'm tired of rabbit holes, I want to be building web
applications, not forever building web scaffolding.

My thought now is that resolvers are not resources, we should separate the two.
You create Stencil by providing it with a module resolver and a resource
resolver, which by default is an AMD resolver and an XHR resolver.

I do not know enough about module loading, have enough experience with module
loading, to come to design decision on this right now.

 * [How much speed is gained with RequireJS/AMD in JS?](http://stackoverflow.com/questions/11531091/how-much-speed-is-gained-with-requirejs-amd-in-js).
 * [Organizing your application using Modules (require.js)](http://backbonetutorials.com/organizing-backbone-using-modules/).
 * [Reply to Tom on AMD](http://tagneto.blogspot.com/2012/01/reply-to-tom-on-amd.html).
 * [AMD is the Answer](http://geddesign.com/post/15994566577/amd-is-the-answer).
 * [AMD is Not the Answer](http://tomdale.net/2012/01/amd-is-not-the-answer/).
 * [modulr-node](https://github.com/tobie/modulr-node/tree/v0.6.1).
 * [Lazy evaluation of CommonJS modules](http://calendar.perfplanet.com/2011/lazy-evaluation-of-commonjs-modules/).

## Stencil Context and Variable Names

Currently sorting out the details of context. I've got a pattern for working
with callbacks, one that might lend itself to using the resolver directly for
impromptu queries, ad hoc queries, which might make prototyping more rapid.

Or else, it may simply bloat the library with unnecessary complexity.

But, it seems a worthy goal to see if we can create a resolver that is all the
query you need when all you need is a query.

Here's my thinking so far.

I've chosen `$` to be special, to mean the current context. With it, you can
inspect the local context to see if a variable is set.

The other special variable is `$attributes`, which I don't believe anyone would
begrudge me. There currently is no concept of a parent context. but we do have
parent attributes, if a tag is declared within a tag, the parent attributes are
the attributes for the tag are `$attributes` and the attributes for the parent
tag are `$$attributes`.

I do not believe I'm going to introduce the concept of a parent context, so the
`$` is free to use. I'd like to add the resolver as `$.$`, so that it can be
used as `$.$('query')`. When used in the context it is assumed to be a request
for mime type `application/json`. The `$` variable is already hard wired to be
the context to `$.$` means that we're not going to consume another variable name
with something like `$resolver`.

Maybe `_$` as the special variable disambiguates, can be used in the libraries.
