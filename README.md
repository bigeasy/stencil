<a href="http://www.flickr.com/photos/74182631@N00/77864703/" title="stencil by
mufflevski, on Flickr"><img
src="http://farm1.staticflickr.com/38/77864703_db8027986c_z.jpg?zz=1"
width="722" height="541" alt="stencil"></a>

# Stencil [![Build Status](https://secure.travis-ci.org/bigeasy/stencil.png?branch=master)](http://travis-ci.org/bigeasy/stencil) [![Coverage Status](https://coveralls.io/repos/bigeasy/stencil/badge.png?branch=master)](https://coveralls.io/r/bigeasy/stencil)

Asynchronous HTML5 templating for Node.js and the browser. Photo by <a
href="http://www.flickr.com/people/74182631@N00/">mufflevski</a>.

Thoughts on Stencil? Join the
[Discussion](https://github.com/bigeasy/stencil/issues/11).

## Synopsis

Layouts.

```xml
<s:include xmlns:s="stencil">
  <s:tag name="document">
    <html>
    <head>
      <title><s:value select="attr.title"/></title>
      <s:block name="head"/>
    </head>
    <body>
      <h1><s:value select="attr.title"/></h1>
      <s:block name="body"/>
    </body>
    </html>
  </s:tag>
</s:include>

```

Pages laid out.

```xml
<o:document xmlns:s="stencil" xmlns:o="inc:layout.stencil" title="Hello, World!">
  <o:head><meta http-equiv="Content-Type" content="text/html; charset=UTF-8"/></o:head>
  <o:body><p>Hello, World!</p></o:body>
</o:document>
```

The same templates run on the browser and in Node.js, so you can use the same
logic you use to serve a generate page to refresh that page.

## Stencil on the Server

On the server, we create a template and serialize it to HTML5. You can also
serialize to older HTML flavors for older browsers.

## Stencil on the Browser

On the browser, when we generate Stencil XML, we simply import it into the
existing DOM using `Document.adoptNode`.

### The `when` Directive

The `when` directive is used to only update a section of a template if the data
is available. When the `when` directive is encountered during an update, the
`select` attribute is evaluated, if it evaluates to `true`, then the contents of
the `when` directive are re-evaluated. It it evaluates to `false`, then the
contents are left as they are.

This is useful if you have generated a page and are checking the server for
updates, but only to certain dynamic sections of the page.

If, for example, you have a blog page that has an article and a sidebar, you
might be updating the sidebar with recent comments. You want to push a new
collection of recent comments through your Stencil, but if you don't also
provide the article, the Stencil will erase your article.

Here's how we avoid that.

```xml
<html xmlns:s="stencil">
<body>
<s:when select="this.article">
  <div class="article">
    <h1><s:value select="article.title"/></h1>
    <p class="sub-title">
      By <s:value select="article.author"/>
      on <s:value select="article.publishedAt"/></p>
    <div>
      <s:value select="article.body" type="html"/>
    </div>
  </div>
</s:when>
<div class="sidebar">
  <h2>Recent Comments</h2>
  <ul>
    <s:each select="recents" as="comment">
      <li><s:value select="comment.snippet"/> ~
          <s:value select="comment.author"/> on <s:value select="comment.articleTitle"/></li>
    </s:each>
  </ul>
</div>
</body>
</html>
```

The `when` directive is primarily for updates, since it is assumed that you'll
have all your data on hand when you first generate the page on the server side.
However, if during generation a `when` directive evaluates to `false`, it
behaves as an `if` directive, removing the content. It will then generate the
content on the next update where the `when` directive evaluates to `true`.

TODO: Should the `when` directive support `else`?

### The Context Object

From within your templates you can reference the context object itself either by
referencing `this` or the special variable dollar sign `$` with is an alias for
for `this`.

```xml
<html xmlns:s="stencil">
<body>
<dl>
<s:each select="Object.keys(this)" as="key">
  <dt><s:value select="key"/></dt>
  <dd><s:value select="this[key]"/></dd>
</s:each>
</dl>
</body>
</html>
```

You can also use the dollar sign `$` alias, if you find that more aesthetically
pleasing.

```xml
<html xmlns:s="stencil">
<body>
<dl>
<s:each select="Object.keys($)" as="key">
  <dt><s:value select="key"/></dt>
  <dd><s:value select="$[key]"/></dd>
</s:each>
</dl>
</body>
</html>
```

But, again, why? Only because I'm doing this stupid thing with prototypes that
I'm going to try to document right here...

### The `stencil` Variable

The `stencil` variable is a special object added to the context by the Stencil
that has properties of the current template. It is not visible in the ordinary
scope of template, (why? why not? I mean really, why was this important? now you
have to add a paragraph explaining special properties? Are you just being a
bonehead? Didn't we talk about that? No really, I can't wait to see this...)

You can distinguish the context variables set by the Stencil engine from the
context variables set by your application using `hasOwnProperty`. I'm not sure
if this is useful, but it's there.

(Oh, you're a real prize. Can we please [kill this
poodle](http://www.lileks.com/bleats/archive/03/0103/010301.html#010303)? You
know how else you could distinguish between a property set by the Stencil engine
and a property provided by your application? `key == "stencil"`. Yes. You are a
bonehead. TODO: Don't be such a bonehead. Then you don't have to document this.
You might not be able to accept this right now, but there are people in this
world how are smart enough to figure that out for themselves, I know, hard to
accept that world won't embrace the genius of your using object prototypes to do
something, that you know what you're doing, but there are object prototypes
involved and that's really special, so, I can't even, I can't.)

## Tag Libraries

Using the same language as used in templates, Stencil supports the creation of
tag libraries. With tag libraries you can doe more to hide the complexity of a
template. You can create tags that name collections in application domain.

### Passing Parameters to Blocks

When you create tags you're going to want to have them add values to the
caller's template context, TK what? blech! ... many useful tags are going to
fetch data and then expose it to the caller. This is done with a `params`
attribute on the `block` directive. Use the `params` directive to define a
single JavaScript object that will be visible to the caller.

```xml
<s:include xmlns:s="stencil">
<s:tag name="numbers">
  <s:block params="{ one: 1, two: 2, three: 3 }"/>
</s:tag>
</s:include>
```

You can all this tag from your template and it will create a property in the
template context named `$numbers`, that is, the tag name with dollar sign `$` in
front of it.

```xml
<html xmlns:s="stencil" xmlns:t="inc:_params.stencil">
<body>
<t:numbers>
<ul>
  <li><s:value select="$numbers.one"/></li>
  <li><s:value select="$numbers.two"/></li>
  <li><s:value select="$numbers.three"/></li>
</ul>
</t:numbers>
</html>
</body>
```

The output of this template is, of course:

```html
<html>
<body>
<ul>
  <li>1</li>
  <li>2</li>
  <li>3</li>
</ul>
</html>
</body>
```

The caller can always rename the reserved attribute `as`.

```xml
<html xmlns:s="stencil" xmlns:t="inc:_params.stencil">
<body>
<t:numbers as="digits">
<ul>
  <li><s:value select="digits.one"/></li>
  <li><s:value select="digits.two"/></li>
  <li><s:value select="digits.three"/></li>
</ul>
</t:numbers>
</html>
</body>
```

Note that the object is only visible inside the body of the tag.

When you define your parameter object inside the tag library, there's maybe a
bit of a problem in that you won't know it's name, which may or may not matter,
it is so early in the life of Stencil for me to know. So, when you define your
object, you can reference the user provided name of the object using `$name`.

```xml
<s:include xmlns:s="stencil">
<s:tag name="numbers">
  <s:block params="{ one: 1,
                     two: function (callback) { callback(null, this[$name].one + 1) },
                     three: 3 }"/>
</s:tag>
</s:include>
```

The above calculates the value of `two` using the value of `one`, referencing
the generated object in the context using the special variable `name`.

### Creating Evaluated Tag Properties

Sometimes you will want to specify an evaluated property in your tags. We have a
tricky trick for your tag definition that will give you want you want. When you
want the user to provide you with a statement that you can use in an `each` or
`value` directive, do a double evaluation in your tag library.

Here is a minimal example, we're going to create an alias for the `value`
directive named `say` that has an evaluated called `stuff`. As you can see, we
use an evaluated attribute for the `select` attribute of the `value` directive
in the tag. The evaluated select attribute will use the `stuff` attribute passed
to the tag.

```xml
<s:include xmlns:s="stencil">
<s:tag name="say">
  <s:value s:select="$attribute.stuff"/>
</s:tag>
</s:include>
```

When the template author is ready to say stuff, he invokes the `say` tag with an
ordinary `stuff` attribute, he doesn't have to know that it's evaluated.

The attribute `stuff` has a value of `"1 + 1"`. That is not evaluated. It is
passed into the tag as `$attributes.stuff`. Inside the tag, `$attributes.stuff`
has a string value of `"1 + 1"`. The evaluated `select` attribute of value
evaluates `$attributes.stuff` and creates a `select` attribute for the `value`
directive with a string value of `"1 + 1"`.

```xml
<html xmlns:s="stencil" xmlns:t="inc:_tags.xml">
<body>
<p><t:say stuff="1 + 1"/></p>
</body>
<html>
```

The `value` attribute will then evaluate the `select` attribute, unaware and
unconcerned that it was once an evaluated attribute. It's not a static attribute
as far as the `value` attribute is concerned. It evaluates the JavaScript
statement `1 + 1` and gets `2`.

Here is the output.

```html
<html>
<body>
<p>2</p>
</body>
<html>
```

You'd probably want to use `select` as your attribute, instead of `stuff`
because it follows convention and requires less explanation. We use `stuff` in
the example above to make it easier to pick out the working parts.

Here's a slightly more complicated, every-so-slightly more realistic example.
Here we put our select attribute into an evaluated select attribute of an `each`
directive. We're creating a `loopy` tag.

```xml
<s:include xmlns:s="stencil">
<s:tag name="loopy">
  <s:each s:select="$attribute.select" as="item">
    <s:tag name="item" select="item"/>
  </s:each>
</s:tag>
</s:include>
```

Here's how we use it with the object `{ numbers: [ 1, 2, 3 ] }`. As you can see,
we pass in the string `"numbers"` in a select attribute. It does not get
evaluated. It is passed into the tag as the property `$attributes.select`. The
value of `$attributes.select` will be the string `"numbers"`.

When we use an evaluated `select` attribute with the `each` directive, it
evaluates to the value of `$attribute.select` with is `"numbers"`. That creates
a select value for the `each` directive that is `"numbers"`. That is evaluated
by the `each` directive to obtain the numbers array.

```xml
<html xmlns:s="stencil" xmlns:t="inc:_tags.xml">
<body>
<ul>
  <t:loopy select="numbers">
    <li><t:item/></li>
  </t:loopy>
</ul>
</body>
<html>
```

Which gives us the html.

```html
<html>
<body>
<ul>
  <li>1</li>
  <li>2</li>
  <li>3</li>
</ul>
</body>
</html>
```

## Remember

 * It's not a query tool. It's a templating tool.

## Expand

 * Functions must have no side-effects; i.e. do not use your template functions
   to create a hit counter.
 * It's not hard to write template functions that do not have side effects. The
   sort of functions that might have side effects are not likely to appear in
   the logic that supports emitting markup.

## Motivations

Revisiting the ideas explored in a [Java based
Stencil](https://github.com/defunct/stencil).

Stencil is asynchronous HTML5 templating for Node.js and the browser. It based
on some ideas from yesteryear and some ideas from tomorrow.

This project evolved from work with Streamline and CoffeeScript. That work has
been moved to a project named [Pastiche](https://github.com/bigeasy/pastiche).

## Philosophy

Especially when dealing with a library that has a goal of being small, you're
limited as to how much scaffolding you can offer developers. My approach for
Stencil is to define three roles, application developer, web developer, and web
designer, and say the first two roles labor to create a childlike sense of
wonder in the latter role.

An application developer creates APIs that the web developer can query. The web
developer wraps those APIs in tag libraries, so that the web designer can focus
on semantic layout.

## Change log

Changes for each release.

### Version 0.0.5

Mon Apr 22 19:07:43 UTC 2013

 * Fix non-directive with attribute child directives. #108.

### Version 0.0.4

Tue Apr 16 14:15:19 UTC 2013

 * Add `request` and `response` to Stencil service. #106.
