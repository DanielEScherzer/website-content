---
extensions:
  footnotes: true
  pygments: true
title: Rewriting Reflection with Rust
---

# Rewriting Reflection with Rust

Over the last few weeks, I have been working on rewriting the PHP Reflection
extension in Rust as an exercise in building extensions in Rust. In addition
to understanding how to implement extensions in Rust, the process also
highlighted a number of ways that the Reflection extension could be improved.

Discovering these improvements was a byproduct of my process. Since
[it was introduced in 2003][commit-ref-intro], the Reflection extension has
amassed over 1,200 commits[^1] by roughly 100 different contributors.[^2] After
20+ years, there were typos, missed optimizations, and occasional bugs that
accumulated. By reviewing the existing code with an eye towards translating it
to Rust, I found a few places where the existing code was misdocumented,
unoptimized, or buggy. This blog post is not about the Rust code that I wrote,
but rather the improvements to the C code that I discovered in the process.

I should note that I was intentionally *not* using the [ext-php-rs][ext-php-rs]
library to abstract away the interactions with the Zend API. While I may opt to
use that library in the future, I wanted to ensure a solid understanding of how
writing an extension in Rust differs from one written in C.

## Dynamic Property Shadowing

To be clear, I am *not* suggesting that the extension was previously believed
to be bug-free. There are a number of existing issues reported on GitHub.
However, in the process of rewriting the implementation of
[`ReflectionClass::getProperty()`][docs-get-prop], I noticed an unreported bug
just from reading the existing C code.

When I filed the bug report ([php/php-src#22441][gh-22441]) the implementation
appeared [as follows][ref-pre-bug] (with the inapplicable handling of
fully-qualified property names elided for readability):

```c
/* {{{ Returns the class' property specified by its name */
ZEND_METHOD(ReflectionClass, getProperty)
{
	reflection_object *intern;
	zend_class_entry *ce, *ce2;
	zend_property_info *property_info;
	zend_string *name, *classname;
	char *tmp, *str_name;
	size_t classname_len, str_name_len;

	if (zend_parse_parameters(ZEND_NUM_ARGS(), "S", &name) == FAILURE) {
		RETURN_THROWS();
	}

	GET_REFLECTION_OBJECT_PTR(ce);
	if ((property_info = zend_hash_find_ptr(&ce->properties_info, name)) != NULL) {
		if (!(property_info->flags & ZEND_ACC_PRIVATE) || property_info->ce == ce) {
			reflection_property_factory(ce, name, property_info, return_value);
			return;
		}
	} else if (Z_TYPE(intern->obj) != IS_UNDEF) {
		/* Check for dynamic properties */
		if (zend_hash_exists(Z_OBJ_HT(intern->obj)->get_properties(Z_OBJ(intern->obj)), name)) {
			reflection_property_factory(ce, name, NULL, return_value);
			return;
		}
	}
	str_name = ZSTR_VAL(name);
	if ((tmp = strstr(ZSTR_VAL(name), "::")) != NULL) {
		// Handle fully qualified property names, elided for readability
	}
	zend_throw_exception_ex(reflection_exception_ptr, 0, "Property %s::$%s does not exist", ZSTR_VAL(ce->name), str_name);
}
```

The logic is basically:

1. retrieve the reflection object (basically the equivalent of `$this`)
2. parse the function parameters to identify the property name
3. check the class' property table; if property is found there, and is not a
private property in a parent class, return it
4. if the property is not found in the property table, and an object is
available, check the object's dynamic properties
5. if the property still has not been found, check for a fully qualified property
name
6. if nothing works, throw an exception

The subtle bug arises from the transition from step 3 to step 4. If you don't
spot the issue, don't worry, apparently no one else has since it was introduced
in PHP 5.2.7. Before PHP 5.2.7, dynamic properties were never checked. That
behavior was reported in [bug #46064][bug-46064], and fixed in
[commit b9c03aa][commit-b9c03aa][^3]. [Since PHP 5.2.7][3v4l-527], dynamic
properties have generally been handled correctly. The operative word here is
"generally".

When classes inherit private properties that are *not* overridden in the child
class, the *parent* property is stored in the child class property table. This
is why step 3 above checks the details of a property found in the property
table; inherited private properties should be ignored by
`ReflectionClass::getProperty()`. *However*, when a private parent property was
found and ignored, the code neglected to check for a dynamic property of the
same name! This was the bug that I reported.

Given that using dynamic properties is generally discouraged (and since PHP 8.2
has been deprecated unless the `#[\AllowDynamicProperties]` attribute is
applied) such an edge case was extremely unlikely to be encountered, which is
why it went undiscovered for almost 18 years.

## Type checking

I also came across something that appears to be a bug, but where "fixing" it
would be a backwards-incompatible change.[^4] Specifically, the
[`ReflectionProperty` class][docs-ref-prop], which represents a specific
property on a class, does not always validate the arguments provided to its
methods! Consider the following code:

```php startinline=True
class Foo {
    public $prop;
}
class Bar {
    public $prop;
}

$b = new Bar();
$ref = new ReflectionProperty(Foo::class, 'prop');
$ref->setValue($b, true);
var_dump($b);
```

The `ReflectionProperty` object conceptually represents the `$prop` property
that is a part of the `Foo` class. However, the `ReflectionProperty::setValue()`
call is given an instance of the `Bar` class, which is entirely unrelated to
`Foo`. Rather than complaining (e.g. by throwing an exception), the
`ReflectionProperty` happily writes to the `$prop` property
*on the `Bar` instance*.

I had actually stumbled across a bug report about this a year earlier
([php/php-src#17730][gh-17730]) but did not look into it at the time. Now, in
the process of rewriting the Reflection extension in Rust, when I got to the
point of implementing `ReflectionProperty::setValue()` I realized that I didn't
need to implement validation logic, and independently rediscovered the bug.
Before filing a report, I checked the existing bugs reported for the extension,
and found the open GitHub issue.

"Fixing" this mistake is not as simple as adding the missing validation, because
doing so would break existing code that has been working. While code should not
rely on the *presence* of exceptions, it almost always relies on the *absence*
of exceptions, i.e. that the function calls succeed. Accordingly, adding
validation needs to go through PHP's RFC process. I added entries to the mass
["Deprecations for PHP 8.6" RFC][rfc-86-depr] related to this missing
validation, we'll see in a few weeks if the community agrees that providing
unrelated objects to `ReflectionProperty` methods should be deprecated and
eventually trigger exceptions.

## Typos and Cleanup

My process for the extension rewrite was to proceed one method at a time. I
would *remove* the implementation from my copy of
`ext/reflection/php_reflection.c`, paste it into the relevant Rust file, and
then convert the C code to Rust in-place. In the process, I read through every
line of the original C code multiple times, and inevitably spotted some typos
or documentation mistakes.

Rust does not allow treating non-boolean values as booleans, e.g. in conditions
or arguments. Thus, when I encountered integers being used as booleans, the
rewrite in Rust occasionally forced me to change the type of a variable from
some flavor of integer to an actual boolean. Similarly, when the C code used
`0` and `1` in place of `false` and `true`, Rust's type checking complained, and
I updated function parameters. As I went, I collected a list of things to fix
in the C implementation.

Separate from the places that Rust complained about (from a type checking
perspective), or where the documentation was wrong, by reading each line so many
times I came across a number of places where the C implementation could be
simplified or optimized, e.g. by removing unneeded lookups or reusing existing
helpers. The Rust version that I am building is intended as an exercise; to
improve the extension for others I needed to submit those improvements back to
the C version.

The initial result was [php/php-src#22564][gh-22564], a collection of 32 cleanup
commits (33 after adjusting in response to reviewer feedback) that made those
improvements in small, self-contained commits. Since I maintain the Reflection
extension, there isn't really anyone else responsible for reviewing changes to
that code. While I could always merge things without review, my preference is
always to get at least one additional set of eyes on my changes, and by
performing the cleanup in small commits it was easier for someone unfamiliar
with the extension to review my tweaks.

## Looking Ahead

I have no plans to try and push a Rust reimplementation of the Reflection
extension. The point of this rewrite was to use logic that I was already
familiar with (the Reflection extension) for my initial work on writing an
extension in Rust. In the same way that
[I started with Project Euler problems][blog-rust-euler] when learning Rust, so
I could focus on the language rather than the logic, here I started with
Reflection so I could focus on the Rust-C integration.

I have a few other thoughts from this process that I will write up in later
blog posts, and of course I haven't fully reimplemented the Reflection extension
yet, but I can now say that I understand how to build PHP extensions in Rust.

[^1]: `git rev-list --count HEAD -- ext/reflection/php_reflection.c` reports
1,215 commits as of my most recent changes in [commit 2e2b03e][commit-2e2b03e].

[^2]: Based on `git log --format="%aE" ext/reflection/php_reflection.c`, there
have been contributions to the main implementation file from 105 different
emails, and with the `"%aN"` format there have been contributions from 95 names.
Combining them to report the unique name-email pairs of contributors and
manually filtering out contributors with multiple names or emails leaves 89
contributors by my count. For the entire `ext/reflection/` directory, there
have been contributions from 135 emails, 125 names, and 118 unique contributors.

[^3]: There appear to be two different commits with this fix.
[Commit b9c03aa][commit-b9c03aa] is what shows up in the history of the
reflection extension, but GitHub does not report that it was part of the
`php-5.2.7` tag (or indeed, any tag until PHP 5.3). On the other hand,
[commit a04ec69][commit-a04ec69] has seven fewer lines in a test file but the
same actual fix, and *was* a part of the `php-5.2.7` tag. Not sure what is
going on there.

[^4]: Strictly speaking, *not* throwing an exception in
`ReflectionClass::getProperty()` could break code that assumes an exception
will be thrown. However, as I explained in my talk about semantic versioning at
PHPTek, the presence of exceptions, especially where they are caused by a logic
error in the implementation, should not be relied on.

[3v4l-527]: https://3v4l.org/Gf30Fg
[blog-rust-euler]: ./20250919-rust-euler
[bug-46064]: https://bugs.php.net/bug.php?id=46064
[commit-2e2b03e]: https://github.com/php/php-src/blob/2e2b03e1ceeef4cf8ba2a5e863ccc2622311dac6/ext/reflection/php_reflection.c
[commit-a04ec69]: https://github.com/php/php-src/commit/a04ec69406aed8d695dc8fb1edac38d7bc8a30c7
[commit-b9c03aa]: https://github.com/php/php-src/commit/b9c03aa4a58820ac0c917ae247553d58e90672d9
[commit-ref-intro]: https://github.com/php/php-src/commit/aa96d170228ac1088c9008e78137d31e93c57f55
[docs-get-prop]: https://www.php.net/manual/en/reflectionclass.getproperty.php
[docs-ref-prop]: https://www.php.net/manual/en/class.reflectionproperty.php
[ext-php-rs]: https://ext-php.rs/
[gh-17730]: https://github.com/php/php-src/issues/17730
[gh-22441]: https://github.com/php/php-src/issues/22441
[gh-22564]: https://github.com/php/php-src/pull/22564
[ref-pre-bug]: https://github.com/php/php-src/blob/eeb02a0f14033ace9ac766028b14c29cda5e1cca/ext/reflection/php_reflection.c#L4619-L4678
[rfc-86-depr]: https://wiki.php.net/rfc/deprecations_php_8_6
