<a href="http://www.flickr.com/photos/74182631@N00/77864703/" title="stencil by
mufflevski, on Flickr"><img
src="http://farm1.staticflickr.com/38/77864703_db8027986c_z.jpg?zz=1"
width="850" height="638" alt="stencil"></a>

# Stencil [![Build Status](https://secure.travis-ci.org/bigeasy/stencil.png?branch=master)](http://travis-ci.org/bigeasy/stencil)

Asynchronous HTML5 templating for Node.js and the browser. Photo by <a
href="http://www.flickr.com/people/74182631@N00/">mufflevski</a>.

Thoughts on Stencil? Join the
[Discussion](https://github.com/bigeasy/stencil/issues/11).

## Synopsis

Layouts.

```xml
<html xmlns:s="stencil" xmlns:o="layout:(title)">
<head>
  <s:value select="title" element="title"/>
  <o:head/>
</head>
<body>
  <s:value select="title" element="h1"/>
  <o:body/>
</body>
</html>
```

Pages laid out.

```xml
<div xmlns:s="stencil" xmlns:o="inc:fixtures/layout.stencil" title="Hello, World!">
  <o:head><meta http-equiv="Content-Type" content="text/html; charset=UTF-8"/></o:head>
  <o:body><p>Hello, World!</p></o:body>
</div>
```

The same templates run on the browser and in Node.js, so you can use the same
logic you use to serve a generate page to refresh that page.

## Stencil on the Server

On the server, we create a template and serialize it to HTML5. You can also
serialize to older HTML flavors for older browsers.

## Stencil on the Browser

On the browser, when we genrerate Stencil XML, we simply import it into the
existing DOM using `Document.adoptNode`.

## Motivations

Revisiting the ideas explorted in a [Java based
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

An application developer creates APIs that the web develoepr can query. The web
developer wraps those APIs in tag libraries, so that the web designer can focus
on semantic layout.

## Change Log

Changes for each release.

### Version 0.0.2

Released: Pending.

 * Update `t/sizes` to work with Bash 3, OS X. #46.

### Version 0.0.1

Released: Sun Jul 22 22:05:35 UTC 2012.

 * Push JSON update into DOM. #37.
 * Implement HTML serializer. #10.
 * Implement `if`. #31.
 * Reference `xmldom` dependency by SHA1.
 * Build on Windows. #36.
 * Implement expression function cache. #9.
 * Normalize URLs. #22. #13. #4. #3.
 * Implement `each`. #7.
 * Create `README.md`. #34. 
 * Implement layouts.
 * Implement require. #15.
 * Build on Travis CI. #41. #19. #6.
 * Create XML comparision function #8. #5.
 * Implement value replacement. #2.
 * Create test directory. #35. #33. #21. #16. #1.
