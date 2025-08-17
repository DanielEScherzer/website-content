---
title: "#[\\DelayedTargetValidation] Attribute Explained"
extensions:
  pygments: true
extra-classes:
  - blog-page--sidebar-image
---

# #[\DelayedTargetValidation] Attribute Explained

PHP 8.5 will come with a new attribute, `#[\DelayedTargetValidation]`, that
is intended to help libraries that support running on multiple versions of PHP.
The attribute can be a bit confusing, so as the author I figured I should write
up a (hopefully helpful) guide.

As with all significant changes to PHP, the addition of this new attribute
[went through the RFC process][rfc]. The RFC page does provide details, but
because of the nature of the attribute, they are necessarily a bit convoluted.
Since that RFC, however, a separate RFC to
[support deprecating traits][traits-rfc] has been approved, and while I have not
yet merged the implementation, it will be a part of PHP 8.5. That makes examples
a lot simpler.

## Context

By default, PHP attributes can be applied to any of

* classes (including interfaces, traits, enums, etc.)
* class properties
* class methods
* class constants
* global functions
* function parameters
* global compile-time constants (since PHP 8.5)

Attributes can restrict what targets they support by passing a parameter to the
`#[\Attribute]` attribute. For example, the
[`#[\AllowDynamicProperties]` attribute][adp-attrib] is declared with

```php
<?php

#[Attribute(Attribute::TARGET_CLASS)]
final class AllowDynamicProperties
{
    public function __construct() {}
}
```

Thus, `#[\AllowDynamicProperties]` can be used on classes, but if used on
parameters, methods, or other targets, PHP will emit a compile-time error.

Internal (non-userland) attributes can also define a custom validator to apply
further restrictions on where they can be used. For example,
`#[\AllowDynamicProperties]` does not support being used on interfaces. Errors
from custom validators are also emitted as compile-time errors.

For attributes that are not provided by PHP, but rather defined in userland
code, misusing an attribute does not trigger a compie-time error, but rather
a runtime error when the attribute is instantiated with
[`ReflectionAttribute::newInstance()`][refattrib-new].

## Delayed Validation

To understand how `#[\DelayedTargetValidation]` would be useful, assume for a
moment that instead of arriving in PHP 8.5, it was part of PHP **8.4**. PHP 8.4
also came with the `#[\Deprecated]` attribute, which did not support being used
on traits (or other class-like structures). But, PHP 8.5 *will* support
deprecating traits.

What do you do (pre-8.5) if you want to deprecate a trait? MediaWiki, for
example, relies on `@deprecated` comments and release notes to signal
deprecation of traits, e.g. [the GhostFieldAccessTrait trait][gfa-trait].
The Symfony framework uses the `trigger_deprecation()` function to emit a
warning, either when the file with the trait is loaded
([LazyGhostTrait and LazyProxyTrait][symfony-lazy-deps]) or when the trait's
method is called ([VersionAwareTest trait][symfony-version-dep]). But, the
warning only gets emitted once, when a trait is compiled, or if emitted when a
method is executed, might never be reached! Ideally, the warning would be shown
each time the trait gets used, even if none of the methods from the trait are
executed.

On the other hand, for PHP 8.5+ code, the solution is to just add
`#[\Deprecated]` directly to the trait, which will

* emit warnings rather than just being documentation
* warn *every* time the trait is used, rather than just when the file gets
compiled or a method is executed

Sounds great, right? But, what about code that wants to support **both** PHP
8.4 and PHP 8.5? If you tried to use `#[\Deprecated]` on a trait, the code
would fail to compile on PHP 8.4, and if you don't use the attribute, then you
lose out on the ability to emit warnings when the trait is used in PHP 8.5.

You could always make a breaking change to remove PHP 8.4 support, but at that
point you could just remove the trait entirely. It seems you are stuck waiting
until the *minimum* version of PHP that the code supports is at least PHP 8.5.
For functions or classes that are built in to PHP, you can use a runtime check
to determine if they are available or not, but at compile time it is not
possible to conditionally add the attribute depending on the version of PHP.

Enter the `#[\DelayedTargetValidation]` attribute. Pretending that it was
introduced in PHP 8.4 for the sake of discussion, you could then write:

```php
<?php

#[\DelayedTargetValidation]
#[\Deprecated]
trait MyDeprecatedTrait { /* ... */ }
```

The `#[\DelayedTargetValidation]` would then *delay* the PHP 8.4 error about
not being allowed to use `#[\Deprecated]` on traits from compile time to
runtime, where it could be caught and ignored (if it was even raised in the
first place, generally core attributes would not be instantiated by userland
code).

On PHP 8.4, the trait would compile fine, but using it would not emit any
warning, because the functionality wasn't available in PHP 8.4. On the other
hand, in PHP 8.5, the `#[\Deprecated]` validation passes, and the
`#[\DelayedTargetValidation]` attribute would do nothing.

This gives the best of both worlds: traits can emit warnings when used by PHP
8.5+ code, and still compile on PHP 8.4.

Of course, this scenario is predicated on the fiction that
`#[\DelayedTargetValidation]` was available since PHP 8.4.

## Looking Ahead

PHP 8.5 is the first PHP release that expands the places where existing internal
attributes can be used. Specifically:

* `#[\Deprecated]` will support being used on traits
* `#[\Override]` will support being used on class properties
([details][override-props])

Unfortunately, by now it is too late for `#[\DelayedTargetValidation]` to be
added to PHP 8.4 (or 8.3 for `#[\Override]`). Fundamentally, the new attribute
is designed so that any *futher* expansions of the targets of internal
attributes can be used without compile-time errors in PHP 8.5. As a result,
the attribute isn't going to be too useful until PHP 8.6 (or 9.0, whatever
comes next). But it will only be useful later precisely because it was made
available in PHP 8.5.

[rfc]: https://wiki.php.net/rfc/delayedtargetvalidation_attribute
[traits-rfc]: https://wiki.php.net/rfc/deprecated_traits
[adp-attrib]: https://www.php.net/manual/en/class.allowdynamicproperties.php
[refattrib-new]: https://www.php.net/manual/en/reflectionattribute.newinstance.php
[gfa-trait]: https://github.com/wikimedia/mediawiki/commit/5bcef835e021fd12a98c37224960a4cd29dff658
[symfony-lazy-deps]: https://github.com/symfony/var-exporter/commit/ad30a0b430fbc8e791f727cc6847f8a1e7f39509
[symfony-version-dep]: https://github.com/symfony/form/commit/7b9c1292dbcd0f47e741fc4bb7c6e95a930458d5
[override-props]: https://wiki.php.net/rfc/override_properties
