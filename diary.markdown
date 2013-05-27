# Stencil Design

## Stencil from the File System

Using Register, Stencil can be served like static HTML files, like PHP, off of
the file system. While considering the implementation of this, 

Totally lost the clarity I had that I wanted to record. Not even sure if it is
about serving from the file system, or naming things, or what.

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

Having gone a couple rounds with resource loading, here's what I've disovered.

The JSON resource loading is not needed by Stencil itself, therefore it doesn't
belong in Stencil itself. However, there is hardly ever going to be a Stencil
program that doesn't load some JSON. Okay, perhaps there are applications where
the JSON is loaded and pushed into Stencil, and that is the only way, so maybe
it isn't a lie, you know, like Windows 95, which is pointless without Office 95.

Actually, there are a lot of applications where you might push information into
a template, without having the template pull in other resources, like command
line applications. More to the point, the Stencil template function itself never
uses JSON resources, it loads JavaScript modules, it loads XML, but it does not
load JSON resources. That should be set in the context by the application or the
application framework, then pushed through Stencil to the scaffolds that use it.

## Module Loading

I'm not loving having all that cladding wrapped around a Stencil scaffold, when
these scaffolds are supposed to be short and tidy. I prefer CommonJS method. I'm
feeling like there needs to be a file system organization that is a convention,
that these programs take a normal form, it gets wrapped during development, and
you use browserfy or AMD's pre-processor to wrap the module for production.

Actually, I'm tending toward the notion of each bit of your program being a
small file, which ought to be okay with Noders. It ends up being like the CGI of
old. This eschews all that REST nausea, how many verbs can dance on the head of
a pin? It's a way to go. It lends credibility to the Stencils to come up with an
analogous way to respond to another URL.

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

## Recursive Templates

Going to implement the style of reentrancy that is currently in my head, but
here are some more.

```xml
<html xmlns:s="stencil">
<body>
<s:each select="directory" into="directory" id="directory">
  <p><s:value select="directory.name"/></p>
  <ul>
    <s:each select="directory.children" into="child">
      <li>
        <s:recurse call="directory" select="child"/>
      </li>
    </s:each>
  </ul>
</s:each>
</body>
</html>
```

Often times you need to write out information that has a tree-like structure, it
could be your site navigation, an organization chart, or folders and the files
and folders inside them. When you do you're going to want to create a template
that can call itself. In computerese something that calls itself is called
recursive &mdash; think recurring which has the same latin root; recurrere. We
call these templates recursive template.

You create a recusive block by defining a block with the `each/with` directive,
giving it an `id` attribute. Within the block, when you want to invoke the block
again you use a `recurse` directive. The `recurse` directive has a `call`...

You are allowed only one `recurse`.

Okay, I can see it.

What I'm doing now...

```xml
<html xmlns:s="stencil" xmlns:r="recurse">
<body>
<r:directory select="directory">
  <p><r:name/></p>
  <ul>
    <r:children>
      <li>
        <r:directory select="child"/>
      </li>
    </r:children>
  </ul>
</r:directory>
</body>
</html>
```

Given this template...

```xml
<s:include xmlns:s="stencil">
<s:tag name="directory" evaluated="select">
  <s:tag name="name"><s:value select="$$attribute.select.name"/></s:tag>
  <s:tag name="children"><s:value select="$$attribute.select.children"/></s:tag>
  <s:block/>
</s:tag>
</s:include>
</body>
</html>
```

Which could as easily be...

```xml
<html xmlns:s="stencil" xmlns:r="recurse">
<body>
<r:directory select="directory" id="directory">
  <p><r:name/></p>
  <ul>
    <r:children>
      <li>
        <s:recurse call="directory" select="child" into="directory"/>
      </li>
    </r:children>
  </ul>
</r:directory>
</body>
</html>
```

Or maybe...

```xml
<html xmlns:s="stencil" xmlns:r="recurse">
<body>
<r:directory select="directory" id="directory">
  <p><r:name/></p>
  <ul>
    <r:children>
      <li>
        <!-- Oh, we're tracking namespaces in attributes? Bloat! -->
        <s:recurse call="r:directory" select="child" into="directory"/>
        <!-- How is this different than what I had? -->
        <r:subdirectory select="child"/>
      </li>
    </r:children>
  </ul>
</r:directory>
</body>
</html>
```

Recursive is a concept that is complicated. Here I'm pushing recursive into
tags, but they don't break out of the tags. There's no good way to have a tag
layout recursion for you, is there? Ah, that's a layout. Oh, boy, here it is...

```xml
<s:include xmlns:s="stencil">
<s:tag name="directory" evaluated="select" name="directory">
  <s:with select="$attribute.select" into="directory" name="directory">
    <s:tag name="name"><s:value select="directory.name"/></s:tag>
    <s:tag name="children">
      <s:each select="$$attribute.select.children" into="child">
        <s:tag name="subdirectory">
          <s:recurse call="directory" select="child" into="directory"/>
        </s:tag>
        <s:block inherit="child"/>
      </s:each>
    </s:tag>
    <s:block inherit="directory"/>
  </s:with>
</s:tag>
</s:include>
</body>
</html>
```

And then the template author gets to say...

```xml
<html xmlns:s="stencil" xmlns:r="recurse">
<body>
<r:directory select="directory">
  <p><r:name/></p>
  <ul>
    <r:children>
      <li><r:subdirectory/></li>
    </r:children>
  </ul>
</r:directory>
</body>
</html>
```

## Evaluated Attributes

Currently, there is no concept of an evaluated attribute, but it will be
necessary. It is either the case that `select` is by default always evaluated
and that other attributes require an `s:`, which doesn't make sense. Only if it
is also the case that you only ever want one and only one evaluated property per
tag, because it ruins the don't-think-about-it-ness of 

## Incoming

 * Do underbars disappear?
