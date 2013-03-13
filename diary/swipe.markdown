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

Stencil uses XML to express it's template langauge, but only for the sake of the
parser. I don't like XML any more than you do. It is a meager idea taken far too
far. I built Stencil using knowledge I wish I didn't have, and I'm using XML in
ways that where not intended, and I pray these abuses offend the XML purists,
because that's the sugar that helps the XML medicine go down.

Stencil uses XML because every web browser has an XML parser, so there's no need
to send it one. These XML parsers are old and hardened and usually pretty fast.
They produce a DOM that can be imported in the HTML5 DOM.

Because XML is strict, there's a good chance that the DOM we manipulate on the
server is almost identical to the one that we maniuplate in the browser.

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
