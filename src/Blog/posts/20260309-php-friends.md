---
extensions:
  footnotes: true
  pygments: true
title: Friends in PHP
---

# Friends in PHP

As I mentioned in [my last blog post][blog-confoo], while at ConFoo I and a few
other developers worked on some ideas for adding friendship support to PHP. To
be clear, this is just an idea at this point, but I figured it was worth
sharing.

## Inspiration

In C++, the `friend` declaration allows other classes or functions to access
the internal methods and properties of class. For example, consider the
following `User` and `UserFactory` classes:

```cpp
using namespace std;

class User {
	friend class UserFactory;
	
	public:
		string getName() const {
			return this->name;
		}

	private:
		string name;
		User (string name) : name(name) {};
};


class UserFactory {
	public:
		static User newUser(string name) {
			return User(name);
		}
};
```

Because the `User` constructor is marked as private, the class can only be
instantiated from methods within `User` (i.e. if a static method was added).
To allow a dedicated `UserFactory` to be able to construct `User`s, the
`UserFactory` is marked as a `friend` of the `User` class; otherwise, the
constructor would need to be made public in order to be called from the factory.

## PHP workarounds

PHP does not have such a system of friendship. Visibility restrictions can be
overcome by using the Reflection extension, but using Reflection to circumvent
visibility restrictions in production code is frowned upon. Instead, visibility
is simply relaxed, with methods and/or properties being marked as `public`,
and documentation is used to indicate that, though public, the relevant methods
and properties are only intended to be publicly used by specific classes (like
a factory) and are not part of the stable interface.

[Dave Liddament][Dave] and I met first the first time back at Longhorn PHP in
October, and had discussed his [`php-language-extensions`][gh-lang-exts]
library, which adds a few attributes (like `#[Friend]`[^1]) that are
processed by static analysis. Instead of being enforced at a language level, his
version of the friendship attribute is applied to *public* class members, and
the use of those class members is validated by
[a PHPStan extension][gh-phpstan-lang-exts], which verifies that public members
tagged with `#[Friend]` are only accessed from outside of the class by code that
is marked as a friend. At Longhorn, we had a brief discussion about potentially
adding support for that attribute on a language level - we fleshed out a
potential design while at ConFoo.

## Attribute approach

I am a big fan of PHP's attribute system, and wrote a few RFCs to expand
attributes in PHP 8.5. I also wrote code for a future RFC for attributes in 8.6.
Thus, my first thought was to add friendship as a built-in attribute, similar
to how Dave's library does it.

Of course, there would by necessity be some big differences between how PHP
implements the attribute and how it was done in userland. In userland, the
underlying methods and properties were made public so that they could be
accessed, and the `#[Friend]` attribute added some restrictions via static
analysis. If the methods or properties were not public, they would be
inaccessible!

On the other hand, if the attribute is built in, it can change the visibility
semantics and allow using protected or private class members. It does not make
much sense to use friendship for public members, since those can already be
accessed without restriction. Thus, a built-in attribute would likely be
restricted to use on protected or private class members.

## Attributes as optional

After we had mostly fleshed out a design, however, [Derick Rethans][Derick] walked
by, and we discussed our ideas. Derick made a great point - currently (as of
PHP 8.5), any code with attributes applied will run the same with those
attributes removed. Sure, some new warnings might be shown,[^2] and some old
warnings might no longer be triggered,[^3] but the actual functionality would be
essentially unchanged. With the proposed `#[\Friend]` attribute, however,
removing the attribute would lead to runtime errors when attempting to access
protected or private class members.

Derick's observation led me and Dave to also write up a basic design for
applying friendship at a class level without using attributes, and that would
work. However, trying to do the same for class methods, properties, and
constants did not result in a syntax that either of us liked. I would be fine
with only supporting class-level friendship (like C++), but Dave was pushing for
more fine-grained control.

## Next steps

I'm planning to discuss both options (attribute and class member) in an email to
the internals mailing list and gauge community response before working on an
RFC and implementation. Ideally, this would all be accepted, implemented, and
merged in time for PHP 8.6, but no promises.

[^1]: Dave's attribute is in the `\DaveLiddament\PhpLanguageExtensions`
namespace, and is written here as `#[Friend]` on the assumption that the
relevant `use` statement is present. If added directly to the PHP language, the
attribute would presumably be in the global namespace, indicated by the leading
backslash in `#[\Friend]`.

[^2]: e.g. the warnings about dynamic properties previously suppressed with
[`#[\AllowDynamicProperties]`][attrib-adp], or warnings about return type
compatibility that were suppressed by [`#[\ReturnTypeWillChange]`][attrib-rtwc].

[^3]: e.g. those previously caused by using functions, constants, or other
items marked as [`#[\Deprecated]`][attrib-dep], or the warnings from not using
the result of a function marked as by [`#[\NoDiscard]`][attrib-nd].

[Dave]: https://www.daveliddament.co.uk/
[Derick]: https://derickrethans.nl/
[attrib-adp]: https://www.php.net/manual/en/class.allowdynamicproperties.php
[attrib-dep]: https://www.php.net/manual/en/class.deprecated.php
[attrib-nd]: https://www.php.net/manual/en/class.nodiscard.php
[attrib-rtwc]: https://www.php.net/manual/en/class.returntypewillchange.php
[blog-confoo]: ./20260302-confoo
[gh-lang-exts]: https://github.com/DaveLiddament/php-language-extensions
[gh-phpstan-lang-exts]: https://github.com/DaveLiddament/phpstan-php-language-extensions
