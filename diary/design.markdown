# Stencil Design

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
