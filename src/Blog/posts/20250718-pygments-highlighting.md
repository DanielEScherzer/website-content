---
extensions:
  footnotes: true
  pygments: true
  toc: true
title: Pygments Syntax Highlighting for Markdown
---

# Pygments Syntax Highlighting for Markdown

This week, I published a new composer package that adds support for syntax
highlighting of code snippets embedded in Markdown documents. The new package
uses the Pygments highlighting library (from Python) and connects it to the
CommonMark PHP library for rendering Markdown.

When I first started the blog section on my website, I wanted a way to write
blog posts that was easier than using HTML. I'm no stranger to HTML, but given
the limited subset of formatting that I wanted to be able to use, directly
writing HTML (or building the HTML from PHP) seemed a bit much.

## Markdown

Instead of HTML, I decided to write the posts using [Markdown][markdown-site],
a markup language (like HTML) but with a much simpler syntax. There have been
various versions of Markdown since it was first released in 2004; I'm using the
[CommonMark][commonmark] version, which has a clear specification and was
designed as a standardized version of Markdown. Among its features:

- lists can be made with `-` or `*` (ordered lists use '1.', '2.', etc.)
- headings can be declared with `#` (or `##` for subheadings, `###` for even
smaller headings, and so on)
- text can be made bold **\*\*like this\*\***
- or italic _\_like this\__
- or monospaced `` `like this` ``

Much simpler than writing out the various HTML element tags.[^1]

I'm so used to writing Markdown that I find that I use it even in places where
it isn't supported, like plain text emails, or even my handwritten notes for
math class, where section headings are still declared with `##`.

To render the Markdown, I use the [`league/commonmark`][league] composer
package, which provides a simple interface for both handling Markdown and adding
extensions to expand functionality. It also comes with a number of built-in
extensions that you can enable, like adding footnotes, strike through, a table
of contents, and more! See [the list of built-in extensions][ext-list].

However, one thing that is _not_ provided by the library is a way to add syntax
highlighting for code examples. This functionality is present in most of the
Markdown renderers that I have used, including VSCode's Markdown preview and
GitHub's rendering of Markdown files and comments, but it is not strictly part
of the CommonMark specification. The language of a multi-line code example is
declared on the same line as the starting backtics, but the CommonMark
specification explicitly does not mandate any treatment of text in that
location (in the example below, the "example" in the first line).[^2]
The fact that the text there is used to indicate a program language is an
extra feature.

````markdown
```example

Code in some example language
```
````

I first noticed this missing functionality when writing my blog post
["Attributes on Constants"][blog-attribs-on-constants]. I wanted to use the
highlighting from the [Pygments library][pygments]. I tried searching for an
existing extension to this integration, but couldn't find one. So, being a
developer, I set out to write it myself.

## Extension creation

The first issue I ran into is that Pygments is a _Python_ library, not a PHP
library - but, there is a nice PHP library, [`ramsey/pygments`][ramsey-lib],
that allows linking the two together. Using that library, I can give it the
text of the code to highlight, and the name of the language to highlight it in,
and that other library will take care of interacting with Python (by executing a
subprocess) and give me back the HTML to output. Open source is great!

The second issue I encountered was how to interact with the existing code used
for rendering fenced code blocks. After all, I only wanted to change a part
of the behavior - if the code block had a language declared, run it through
Pygments, but otherwise output it as normal. Unfortunately, the code that
renders fenced code blocks in the CommonMark library, the `FencedCodeRenderer`
class, is `final`, meaning that I could not extend that class and override the
render method.

My solution was to use composition rather than inheritance: instead of my
renderer being a version of the default `FencedCodeRenderer`, my class would
hold a reference to a separate `FencedCodeRenderer` instance and call methods
on it.

The final issue is that the HTML that Pygments provides doesn't actually have
highlighting; it has a bunch of classes around different parts of the code, and
you need to separately apply the CSS to highlight them. Pygments provides a few
themes that contain the CSS necessary (and `ramsey/pygments` makes it possible
to access them from PHP) but that CSS still needs to be loaded on the page for
the highlighting to take effect.

At this point, I was ready to add the highlighting support. To make things
easier, I added that extension directly in the code base for my website, so I
could use it right away without needing to deal with setting up a library and
making the code usable by others. You can see my implementation in the git
commit to my website repository [here][orig-impl-commit] (look for the
`PygmentsHighlightExtension` and `PygmentsHighlightRenderer` classes in the
`src/Blog` directory).

## Librarization

Having written the code, I felt that others might benefit from it. My first
thought was that this might be a candidate for bundling within the
`league/commonmark` library itself - after all, it is a feature that is common
in Markdown renderers, and a lower barrier to use (you wouldn't need to
download it separately) would make it more useful. But, after
[asking on GitHub][gh-issue-1073], the library author suggested that releasing
the functionality as a separate library would be a better option.

And so, I did just that. I moved the implementation from within the code for
my website to a [separate GitHub repository][gh-repo], and released it as a
composer package,
[`danielescherzer/commonmark-ext-pygment-highlighter`][composer-package].

In the process of converting the extension to a dedicated library, I also added
some configuration options for flexibility:

- the path to the `pygmentize` command can now be specified to override the
default that `ramsey/pygments` uses
- when the pygmentization fails, the extension can be told to
	- ignore the error and render the code as if the extension was not
	installed,
	- render the code as if the extension was not installed, with a warning,
	that the highlighting failed, or
	- raise a PHP exception so that the calling code can decide what to do

The default is to show a warning and then render the code without highlighting.
For example:

```broken
This tries to use a missing language 'broken'
```

The warning is in red because of the CSS on this site, but it can be customized
with the `.pygments-highlighter-failed` selector.

## Usage

To make use of the new highlighting extension, install the package via composer,
e.g. with
```bash
composer require danielescherzer/commonmark-ext-pygments-highlighter
```

and add it to your CommonMark Environment:

```php
<?php

use DanielEScherzer\CommonMarkPygmentsHighlighter\PygmentsHighlighterExtension;
use League\CommonMark\Environment\Environment;
use League\CommonMark\Extension\CommonMark\CommonMarkCoreExtension;
use League\CommonMark\MarkdownConverter;

// These are the defaults for the extension, you can change them
$config = [
    'pygments_highlighter' => [
        'pygmentize_path' => null, // Use `pygmentize` from PATH
        'on_exception' => 'warn',
    ],
];

// Configure the Environment with the desired extensions
$environment = new Environment( $config );
$environment->addExtension( new CommonMarkCoreExtension() );
$environment->addExtension( new PygmentsHighlighterExtension() );

// And convert your markdown
$converter = new MarkdownConverter($environment);
echo $converter->convert("```php\n<?php\necho 'testing...';\n```");
```

The resulting HTML output will have CSS classes applied to different parts to
support highlighting; CSS to actually do the highlighting still needs to be
included in the output. More details can be found in the documentation
[on GitHub][gh-repo]. If you have any issues or feature requests, please report
them GitHub. Contributions are welcome.

[^1]: For a quick overview of the Markdown syntax supported by
CommonMark, see [this cheatsheet][cheatsheet].

[^2]: Of course, the Pygments highlighting library is smart enough that
if I try to embed an example with a real programming language, that language's
highlighting takes over in the example, so a fake language name is used.

[markdown-site]: https://daringfireball.net/projects/markdown/
[league]: https://packagist.org/packages/league/commonmark
[ext-list]: https://commonmark.thephpleague.com/2.7/extensions/overview/
[blog-attribs-on-constants]: /Blog/20250429-attributes-on-constants
[pygments]: https://pygments.org/
[ramsey-lib]: https://packagist.org/packages/ramsey/pygments
[orig-impl-commit]: https://github.com/DanielEScherzer/website-content/commit/d161dbf17d90f41be60c4aab9ba83d01f7aa609a
[gh-issue-1073]: https://github.com/thephpleague/commonmark/issues/1073
[gh-repo]: https://github.com/DanielEScherzer/commonmark-ext-pygments-highlighter
[composer-package]: https://packagist.org/packages/danielescherzer/commonmark-ext-pygments-highlighter
[commonmark]: https://commonmark.org/
[cheatsheet]: https://commonmark.org/help/
