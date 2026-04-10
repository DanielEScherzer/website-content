---
extensions:
  pygments: true
title: Introducing define_deprecated() for PHP
---

# Introducing define_deprecated() for PHP

In PHP 8.5, I introduced support for [attributes on constants][blog-attribs],
which allows marking compile-time global constants as deprecated. However,
that functionality was not made easily available when defining constants at
*runtime*, or in code that supports older versions of PHP. My new library,
[danielescherzer/define-deprecated][lib-def-dep], provides that support.

## Overview

PHP 8.5's support for attributes on constants introduced new syntax that older
versions of PHP cannot parse. This creates a problem for libraries that want to
support multiple versions of PHP: even *declaring* a constant with attributes
will cause a parser error on older versions of PHP. The solution is to wrap the
constant declaration in [`eval()`][docs-eval], which ensures that the code is
parsed at runtime, making it possible to conditionally execute it on PHP 8.5+.

While `eval()` is often avoided, here it provides a controlled way to
conditionally use syntax that older versions of PHP are unable to understand.
Exhaustive tests, and the use of [`var_export()`][docs-var-export], confirm that
`eval()` does not present an opportunity for executing arbitrary code, even when
passing untrusted inputs to the library. That said, on PHP 8.4, as attributes
are unavailable, `eval()` is unnecessary; the declaration of constants can be
delegated to the existing function for creating new constants at runtime:
[`define()`][docs-define]. `eval()` is only required for, and used on, PHP 8.5+.

My new library exposes a new global function, `define_deprecated()`, in the
`\DanielEScherzer\DefineDeprecated` namespace with the following signature:

```php startinline=True
function define_deprecated(
	string $constant_name,
	mixed $value,
	?string $message,
	?string $since
): bool {
	// ...
}
```

The first two parameters, `$constant_name` and `$value`, correspond to the
parameters for the `define()` function, or to the constant name and value used
in compile-time declarations. The remaining two parameters, `$message` and
`$since`, correspond to the parameters of the
[`#[\Deprecated]`][docs-deprecated] attribute - the message explaining why the
constant is deprecated, and the version in which the constant was deprecated.

While the `#[\Deprecated]` attribute does allow the `$message` and `$since` to
be omitted (defaulting to `null`), this function requires them to be explicitly
passed (even if `null`) to encourage documenting deprecations.

## Example

To make use of the new library, install the package via composer, for example:

```bash
composer require danielescherzer/define-deprecated
```

After installing the package, you can define a deprecated constant like this:

```php
<?php

use function DanielEScherzer\DefineDeprecated\define_deprecated;

define_deprecated( 'MY_CONSTANT', true, 'Do not use this', '1.0' );

// This will output "bool(true)", and on PHP 8.5+ also emit deprecation warnings
var_dump( MY_CONSTANT );
```

## Notes

The library supports, and is tested against, PHP 8.1 and newer. Older versions
of PHP had different behavior for the `define()` function, and have been
end-of-life for long enough that they were not worth trying to support.

The library has been published with version 1.0.0 and should be fully ready to
use. No additional functional changes are expected, though obviously any bugs
that are reported will be addressed. You can see the source code
[on GitHub][src-repo].

Because much of the code is version specific (`eval()` is only needed for PHP
8.5+), a code coverage report for just PHP 8.4 or just PHP 8.5 would not be
very helpful. Combining the code coverage reports between the tests run on PHP
8.4 and the tests run on PHP 8.5 required some creativity; check out the
[`coverage/MergeCoverage.php`][src-MergeCoverage] script and the
[`coverage` CI job][src-CoverageJob] if you are interested.

If you need to maintain cross-version compatibility but want to take advantage
of modern PHP features, `define_deprecated()` provides a quick and practical
solution.

[blog-attribs]: ./20250429-attributes-on-constants
[docs-define]: https://www.php.net/manual/en/function.define.php
[docs-deprecated]: https://www.php.net/manual/en/class.deprecated.php
[docs-eval]: https://www.php.net/manual/en/function.eval.php
[docs-var-export]: https://www.php.net/manual/en/function.var-export.php
[lib-def-dep]: https://packagist.org/packages/danielescherzer/define-deprecated
[src-CoverageJob]: https://github.com/DanielEScherzer/define-deprecated/blob/v1.0.0/.github/workflows/ci.yml#L32
[src-MergeCoverage]: https://github.com/DanielEScherzer/define-deprecated/blob/v1.0.0/coverage/MergeCoverage.php
[src-repo]: https://github.com/DanielEScherzer/define-deprecated
