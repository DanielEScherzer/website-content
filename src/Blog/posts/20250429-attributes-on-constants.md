---
extensions:
  pygments: true
  toc: true
---

# Attributes on constants

Earlier today, the [attributes-on-constants][rfc] RFC implementation was finally
merged. This was a project I worked on for months and a significant reason I
became more active as a PHP core developer. The initial motivation was to add a
way for constants to be marked as deprecated, so that MediaWiki could use that
feature to signal deprecated constants instead of relying solely on
documentation.

## Background

PHP 8 introduced support for [attributes][php-attribs], which allowed recording
metadata for classes, functions, methods, class properties, class constants,
and function parameters. In my presentation at the Fall 2024 edition of the
*MediaWiki Users and Developers Conference* in Vienna ([details][mwcon]), I
talked about the then-new [`#[\Deprecated]` attribute][deprecated-attrib], which
was introduced in PHP 8.4. The attribute could be used to emit deprecation
warnings for

* calling non-class functions
* calling class methods
* accessing class constants

In the first two cases, MediaWiki was already able to emit deprecation warnings
by manually sending out error messages, in line with its
["Stable Interface Policy"][sip]. However, without engine support (in the form
of this attribute) MediaWiki was unable to "hard deprecate" class constants by
emitting deprecation warnings. That on its own meant that the new attribute
would be very useful once it was applied throughout the MediaWiki code base.

However, there are some parts of a library's (in this case MediaWiki's) public
interface that might become deprecated and were not supported by this attribute,
meaning that warning messages would need to be created manually (if possible).
Some facets of a library's interface that I discussed in the presentation were

* Global constants
* Class aliases

I decided to try my hand at implementing support for deprecating global
constants. But, since global constants were not something that even supported
attributes, this wasn't merely a question of updating the engine to handle the
`#[\Deprecated]` attribute and make it usable on constants. First, PHP needed
to add support for attributes on constants in general.

## Feature

The feature presented in the RFC is to allow using attributes on compile-time
non-class constants. By "compile-time", I meant constants that were declared
like

```php
<?php

const MY_CONST = 'Testing';
```

rather than "runtime" constants declared like

```php
<?php

define( 'MY_CONST', 'Testing' );
```

I started with "compile-time" constants because one of the fundamental features
of attributes is that they are not evaluated at compile time, but rather when
the information is retrieved via reflection. Trying to support a parameter to
`define()` that would allow passing in attributes but not evaluating them was
something that I thought would be trickier; in retrospect, it might have been
easier than adding support for attributes on the `const`-defined constants.

### Compile time or not

The line between compile-time and run-time constants is not as straightforward
as just the use of `const` or the use of `define()`.

Consider the following PHP file (`include_class.php`):
```php
<?php

return;

throw new Exception( 'Unreached' );

class Demo {}
```

If this file were to be [included][php-include] in a PHP program
- the file would be compiled
- the `return;` would be executed
- subsequent lines in the file would not be executed (the exception is thrown
in this demo just to demonstrate that the code after the `return;` is not
executed)

However, if you were to examine whether or not the `Demo` class exists before
and after inclusion of the file, you would notice something slightly surprising:
even though the statements after the `return;` are not executed, the `Demo`
class gets defined when the file is included!

```php
<?php

var_dump( class_exists( Demo::class ) ); // False

require_once __DIR__ . '/include_class.php';

var_dump( class_exists( Demo::class ) ); // True
```

This is because class declarations are processed at *compile time*, rather than
*runtime*. When the file is included, *before* it gets executed, the class
declaration is processed. This allows referencing classes before (line-wise)
they have been defined, such as
```php
<?php

var_dump( class_exists( Later::class ) ); // True

class Later {}
```

However, in the case of "compile-time" constants, the constants do not actually
get defined until their definition is *executed*. Try including the following
PHP file (`include_constant.php`):

```php
<?php

return;

throw new Exception( 'Unreached' );

const MY_CONSTANT = 'Testing';
```

You'll find that because of the `return;`, the constant never gets defined:

```php
<?php

var_dump( defined( 'MY_CONSTANT' ) ); // False

require_once __DIR__ . '/include_constant.php';

var_dump( defined( 'MY_CONSTANT' ) ); // False
```

Thus, adding support for attributes on constants means that any attributes that
are applied to the constant would need to be processed *at runtime*, something
that wasn't previously done because all other supported attribute targets were
compile-time constructs (classes, functions, parameters, etc.).

### Optimization of `define()`

The line gets even blurrier when looking at PHP's built-in optimizer. As part
of "pass 1" with simple local optimizations ([pass1.c as of merge][pass1]),
for any function call where
- the function name is known to be `define()`,
- the first parameter (name) is a literal string, and
- the second parameter (value) is a scalar

the optimizer will replace the op codes for a function call with the opcodes
that would be generated by using the `const` compile-time form. In other words,
* regardless of which form is used by the developer, the constant is not
actually defined at compile time, but only when the declaration gets executed.
* the opcodes for the declaration of a runtime constant can be changed to match
those of a compile-time constant.

### Implementation

If you want to take a look at the actual code, the implementing PR is available
[on GitHub][pr-16952]. I'm not going to explain it in depth here, just with
broad strokes. The first three parts are for general attribute support, the last
two are to add engine support for deprecations.

1. When attributes are found at the start of the declaration of a constant, they
are processed into the abstract syntax tree (AST) for that constant's
declaration.
2. When the AST is converted into opcodes that will be executed by the PHP
runtime, constants are normally represented with a `ZEND_DECLARE_CONST` opcode.
If the constant has attributes, however, the opcode is changed to
`ZEND_DECLARE_ATTRIBUTED_CONST`, the attributes are extracted from the AST and
compiled, and then those are emited with a `ZEND_OP_DATA` code to indicate that
the operation has an extra parameter.
3. When a file gets added to the opcache (PHP's cache of opcodes for processed
files) the attributes get copied into the new location.
4. When (at run-time) the `ZEND_DECLARE_ATTRIBUTED_CONST` opcode is processed,
the attributes get added to the declared constant; if `#[\Deprecated]` is among
the attributes, the `CONST_DEPRECATED` flag is added to the constant.
5. When a constant is used, if marked with `CONST_DEPRECATED`, a deprecation
warning will be emitted, including any details included in the `#[\Deprecated]`
declaration.

## Using

Now that constants support attributes, developers can apply userland attributes
to their constants to add various metadata. But, for me, the real power is in
the attributes that PHP itself provides, since those are able to hook into parts
of the engine.

As part of the RFC, the `#[\Deprecated]` attribute was updated to also support
being added to userland constants. It is thus now possible for developers to
deprecate a non-class constant and have the engine emit deprecation warnngs
when the constant is used. From one of the tests for this new feature:

```php
<?php

#[\Deprecated(message: "use DEPRECATED_CONST_4", since: "1.0")]
const DeprecatedConst4 = 4;

echo DeprecatedConst4 . "\n";
```

a warning will be triggered:

> Deprecated: Constant DeprecatedConst4 is deprecated since 1.0, use
> DEPRECATED_CONST_4 in {file} on line {line}

My hope is that MediaWiki and other libraries will apply this attribute to send
warnings where previously only documentation could be used to indicate
deprecations.

### Backwards compatibility

However, using this attribute in MediaWiki, and more generally, in any tool that
supports versions of PHP before 8.5 (which isn't even out yet!) presents a
problem: because using attributes on constants requires syntax that was invalid
in PHP 8.4 and below, the logic cannot merely be guarded behind a version flag,
because the code wouldn't be parsable. And, even if the logic could be guarded
behind a version flag to avoid errors on PHP 8.4, when the 8.5 code was executed
to define a constant PHP would emit a different error, because PHP does not
allow constants to be declared (with `const`) within blocks. For example, the
following code triggers a parser error, and it doesn't use attributes:

```php
<?php

if ( true ) {
    const DEMO = 'example';
}
```

So, if a library wanted to make a constant as deprecated, it would need to
either

* Update the miminum version of PHP supported to PHP 8.5, or
* Use some sort of logic to parse different code in PHP 8.5+ versus 8.4 and
below

The first is undesirable for a number of reasons, not the least of which is the
fact that at least for MediaWiki, one of the core principles is that it needs to
be usable by the Wikimedia Foundation servers (where, e.g., Wikipedia is hosted)
that are currently in the process of
[migrating from PHP 7.4 to PHP 8.1][T319432]. It will likely be a while before
MediaWiki drops support for PHP 8.4 and below.

The second is possible by either loading specific files based on the version,
and having the PHP 8.5+ declarations in files that don't even get loaded in PHP
8.4, or by using [`eval()`][eval] to process the PHP 8.5+ declarations. Since
the use of `eval()` is generally discouraged, we will have to wait and see if
MediaWiki and other libraries will decide to use it in order to emit deprecation
warnings for constants.

I have also started sketching out an idea for a tiny composer library that
would abstract the `eval()` usage away - developers would just call a function
along the lines of `define_deprecated( 'NAME', 'MyValue' );` and then in PHP 8.5
that would trigger `eval()` with the constant, and in PHP 8.4 it would just
delegate to the `define()` function. I might spend a few days developing that
library if I get the urge to write some code.

### In PHP stubs

Now that constants can be deprecated with attributes, the various constants that
PHP provides can be updated with more informative error messages by adding the
attribute to those internal constants. This would mirror the addition of the
`#[\Deprecated]` attribute to internal functions and class constants back when
the attribute was originally added, see [that PR][pr-14750]. For example, since
PHP 8.4 the code

```php
<?php

error_reporting(E_ALL | E_STRICT);
```

has emitted a warning as a result of a PHP 8.4 deprecation:

> Deprecated: Constant E_STRICT is deprecated in {file} on line {line}

If we used the new support for deprecating constants with messages, the warning
would become something like

> Deprecated: Constant E_STRICT is deprecated in since 8.4, E_STRICT errors are
> no longer emitted in {file} on line {line}

But, before that can be done, the build script that PHP uses, and the
[nikic/PHP-Parser][nikic/PHP-Parser] library that it depends on, need to be
updated to support attributes on constants. Only once a new version of the
parser is available that supports the new syntax will it be possible to populate
more helpful error messages for internal constants.

## Next steps

Now that it is possible to have the engine trigger deprecation notices for
global constants, I've started looking into the other places where
`#[\Deprecated]` support would be useful, either for MediaWiki or for libraries
generally. Some ideas include support for warnings for

* run-time constants (declared with `define()`)
* class aliases (declared with `class_alias()`)
* `use`-ing a trait
* extending a class
* implementing an interface
* overriding a method
* accessing a class property

MediaWiki provides utilities for deprecating the last two
* [`MWDebug::detectDeprecatedOverride()`][deprecated-override] emits warnings
if a method is overridden, but that helper method needs to be manually called
somewhere
* The [`DeprecationHelper` trait][DeprecationHelper] will trigger deprecation
warnings for public properties by making them private and adding magic `__get()`
and `__set()` handlers, but it is messy and has some limitations

but these seem like features that would be helpful to implement in the PHP
engine.

Thankfully, classes (including interfaces and traits), methods, and properties
all already support attributes, so for most of these the work would merely be
a question of emitting deprecation warnings, rather than needing to add an
entirely new place attributes get compiled. Only the first two would need
support for a new declaration type if done with attributes. It looks like I have
my work cut out for me.

[pr-16952]: https://github.com/php/php-src/pull/16952
[rfc]: https://wiki.php.net/rfc/attributes-on-constants
[php-attribs]: https://www.php.net/manual/en/language.attributes.overview.php
[php-include]: https://www.php.net/manual/en/function.include.php
[pass1]: https://github.com/php/php-src/blob/3f03f7ed3d988567b5a59ae542579fd91cdfde42/Zend/Optimizer/pass1.c
[mwcon]: https://www.mediawiki.org/wiki/Special:MyLanguage/MediaWiki_Users_and_Developers_Conference_Fall_2024
[sip]: https://www.mediawiki.org/wiki/Special:MyLanguage/Stable_interface_policy
[deprecated-attrib]: https://www.php.net/manual/en/class.deprecated.php
[DeprecationHelper]: https://gerrit.wikimedia.org/g/mediawiki/core/+/refs/tags/1.43.0/includes/debug/DeprecationHelper.php
[deprecated-override]: https://gerrit.wikimedia.org/g/mediawiki/core/+/refs/tags/1.43.0/includes/debug/MWDebug.php#262
[pr-14750]: https://github.com/php/php-src/pull/14750
[nikic/PHP-Parser]: https://packagist.org/packages/nikic/php-parser
[T319432]: https://phabricator.wikimedia.org/T319432
[eval]: https://www.php.net/manual/en/function.eval.php
