# Stencil Design

## Stencil from the File System

Using Register, Stencil can be served like static HTML files, like PHP, off of
the file system. While considering the implementation of this,

Totally lost the clarity I had that I wanted to record. Not even sure if it is
about serving from the file system, or naming things, or what.

## Stencil and Resource Loading

Key to the Stencil strategy is the notion that your scripts run identically on
the server as they do in the browser, but we're going to say with the exception
of module loading, because I don't want to replace Node.js module loading, which
works fine on the browser, with AMD.

When using Stencil off-line, the current `resolver.js` is what it needs to be.
It loads everything off of the file system.

For the browser, I do want a minimalist implementation, one that uses XHR for
JSON and XML, using it directly because it is there, then I'm using RequireJS
AMD, which is odd, because Stencil 3.37k and no RequireJS AMD is 6.18k. It makes
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

Having gone a couple rounds with resource loading, here's what I've discovered.

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

**Umdate**: Um, but, how are you going to market Stencil? As a command line
application or as a the cure for a noder's Rails envy? Oh, hai, yes, you just
bolt on the only way your program will ever work if you need it, but it wasn't
necessary because in theory, Stencil could be used in burgeoning command line
generated HTML5 field of applications.

Have you stopped to think about how the one thing everyone has to swallow is
that stencil generates **hideous** HTML? Stencil is a DOM templating language,
not a string templating language, they'll hear you say, and then your going to
waggle your ***hideous*** HTML in their face by spewing it all over their
console? People are not going to like you as a person.

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

**TODO**: Hey, bonehead. What about `this`? Isn't that a special variable to
maen the current context. (What a bonehead.)

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
        <s:recurse upto="directory" select="child"/>
      </li>
    </s:each>
  </ul>
</s:each>
</body>
</html>
```

Note: Coming back to change `call` to `upto`. It conveys the recursion, that the
template is supposed to repeat. The attribute `call` makes it seem like you
would be able to invoke any named `each` or `with` in the template. That may be
desirable, but not at this point. That could easily be done using tags.
(Recursion can easily be done using tags in any case.)

Often times you need to write out information that has a tree-like structure, it
could be your site navigation, an organization chart, or folders and the files
and folders inside them. When you do you're going to want to create a template
that can call itself. In computerese something that calls itself is called
recursive &mdash; think recurring which has the same latin root; recurrere. We
call these templates recursive template.

You create a recursive block by defining a block with the `each/with` directive,
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
        <s:recurse upto="directory" select="child" into="directory"/>
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
        <s:recurse upto="r:directory" select="child" into="directory"/>
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
          <s:recurse upto="directory" select="child" into="directory"/>
        </s:tag>
        <s:block inherit="child"/>
      </s:each>
    </s:tag>
    <s:block inherit="directory"/>
  </s:with>
</s:tag>
</s:include>
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
tag, because it ruins the don't-think-about-it-ness of...

Evaluated attributes differ from regular attributes. Regular attributes can be
evaluated, but they will only add a name value pair to the `$attributes` hash.
User tags are going to want the ability to extract objects and arrays from the
context, so that is the difference. Not only do they get evaluated, but they can
produced any type of JSON structure, not just primitives.

Do I evaluate these on behalf of the directive, or to I create a function that
can be invoked in any context? This would allow a directive to create a
complicated structure like an `each`.

When defining a tag, their is no way to define an evaluated attribute. I'm going
to make them explicit, so how would they work? They could get evaluated at the
same time...

Okay, I was wandering around and I remembered exactly how this is supposed to be
done, so I wrote documentation for it, so I won't revisit it and resolve it.

## Incoming

 * Do underbars disappear?

## Let's Make a Deal

Stencil is small. Stencil packs a big punch. That's because Stencil uses the XML
parser that is built into your web browser to create a DOM on the client side,
then manipulates that DOM.

You're going to have to accept the fact that;

For Stencil, HTML is a means to an end. Stencil is a DOM templating language,
and HTML is the serialization format it uses to transfer a DOM from the server
to the client. HTML is not an end in itself. Stencil does not generate
beautiful, hand-crafted HTML any more than your phone's camera generates
beautiful hand-crafted JPGs.

If you love to see hand-crafted HTML, then please use a string templating
language, complaints about unreadable HTML will be dismissed with a sniff.

There are a lot of comments that create out-of-band elements, elements expressed
as comments. That's the clever hack that makes Stencil work.

Here are some nice things about Stencil's HTML serialization:

It doesn't effect CSS selectors, because they are comments, they disappear. This
means you don't have to worry about `div` and `span` elements added solely for
the purpose of giving your component model something to bite into.

It will compress nicely if you gzip your pages when you serve them.

You can serialize at any point and you'll capture the state of the page. After
every regeneration, the HTML5 DOM will contain everything you need to rebuild
the page if you send it over the wire.

Stencil uses XML to express it's template language, but only for the sake of the
parser. I don't like XML any more than you do. It is a meager idea taken far too
far. I built Stencil using knowledge I wish I didn't have, and I'm using XML in
ways that where not intended, and I pray these abuses offend the XML purists,
because that's the sugar that helps the XML medicine go down.

Stencil uses XML because every web browser has an XML parser, so there's no need
to send it one. These XML parsers are old and hardened and usually pretty fast.
They produce a DOM that can be imported in the HTML5 DOM.

Because XML is strict, there's a good chance that the DOM we manipulate on the
server is almost identical to the one that we manipulate in the browser.

Stencil uses XML with namespaces, it rides on the behavior of namespaces, using
XML namespaces to create namespaces for tag libraries and required JavaScript
libraries. This is quite a bit of complexity that falls out of a calculated
misuse of XML.

Stencil uses XML with namesapces, but nothing more. There are no XML Schemas, no
RELAX NG, no Schemtron, no DTDs, no XPath, no XQuery and sure as shooting there
is no XSLT.

Any breathless recommendations to double down on XML standards will be met
derision. This means you Java expats.

For the JSON loving HTML5ers out there, please give it a whirl.

The XML nausea is minimal. Just close your tags and match them, that's all there
it too it. I swear.

## Conditional Templates

This would simply be adding a "when" to the `each` or `with` directive, or maybe
having a `when` directive, explicitly.

## Block Parameters

I thought of a simple notation for creating an object that can appear in scope.

```javascript
<s:include xmlns:s="stencil" xmlns:layout="req:layout.js">
  <s:tag name="document">
    <html>
    <head>
      <title>Hello, World!</title>
      <s:with select="layout.entitle" as="entitle">
        <s:block name="head" params="{ title: entitle.title }"/>
      </s:with>
    </head>
    <body>
      <title>Hello, World!</title>
      <s:block name="body"/>
    </body>
    </html>
  </s:tag>
</s:include>
```

Something like that. I don't have layouts all figured out yet, do I? Do I really
want to create a bunch of parameters? One object will do. What if the name of
context object, which make more sense, a context object, than special tags,
maybe the name of the context object is the name of tag? If you want to reassign
it you use `as`.

What does the template author see?

```javascript
<html xmlns:s="stencil" xmlns:t="inc:_twitter.stencil">
<body>
<t:tweets id="bigeasy">
</t:tweets>
</body>
</html>
```

You have `(context, callback)` as you convention, but what about `this`? What is
`this`? Are people allowed to use objects and they are invoked such that `this`
is assigned correctly? I don't believe so. Wow. Nope, it just falls right out of
the sheer awesomeness of it all.

```javascript
<s:include xmlns:s="stencil">
<s:tag name="parameterized">
  <s:block params="{ one: 1, two: function (context, callback) { callback(null, this.one + 1) } }"/>
</s:tag>
</s:include>
```

No, it doesn't, because you evaluate and return a function. It is then invoked
using `apply`. The `this` may as well be the context. You're not able to get to
the other properties because you're not sure of the name. The only way to be
sure of the name is to add it to the context.

```javascript
<s:include xmlns:s="stencil">
<s:tag name="parameterized">
  <s:block params="{ one: 1, two: function (callback) { callback(null, this.$parameterized.one + 1) } }"/>
</s:tag>
</s:include>
```

We can provide `$parameterized` as it is expected in the evaluation, adding it
to the context when we build the parameters map, then someone could do something
with it, wait, what? We haven't created it yet. Bonehead!

We don't want to rebind these, because they may actually be functions that are
meant to be evaluated, so we don't want to rebind them automagically, that would
be a lot of rules. We could make `$parameterized` the name, or heck, during the
construction of the parameter we can have `$name`.

```javascript
<s:include xmlns:s="stencil">
<s:tag name="parameterized">
  <s:block params="{ one: 1, two: function (callback) { callback(null, this[$name].one + 1) } }"/>
</s:tag>
</s:include>
```

And we remove the `context` as the first argument since all it is is `this`.
That keeps me from wrestling with what `this` should be. It makes me think
objects. You can put them in there, yeah, and they'll work just fine all right,
but you need to invoke them as objects member functions with parens.

**TODO**: Now I'm wondering about named blocks, how those work again. They're
pretty cool, so I don't want to break them, but maybe, just maybe, there is
some way to fold them into tags, but no, they are different aren't they? They're
the guts of the tag, either the default guts or else structured guts.

## Streaming

It occurs to me that, with a slight update to the interface, one could do
streaming. At the end of every directive, emit the end node, which would be the
ending comment. Then serialized the document in document order up to that
comment, so now Stencil is async and streaming, so that's a big win. I hope it
doesn't cost too much in girth.

**TODO**: Do this. I don't see why not.

## Inbox
