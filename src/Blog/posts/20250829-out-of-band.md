---
title: "Out-of-Band Signaling"
---

# Out-of-Band Signaling

Sometimes, code needs to be able to signal an error has occurred. Perhaps some
invariant was violated. Perhaps an invalid parameter was used. Regardless of the
reason, there are two ways to signal an issue: "in-band signaling", and
"out-of-band signaling".

Under "in-band signaling", the error message is indicated (signaled) using the
same mechanism as the normal return of the function or procedure. For example,
a function could be documented to return `false` or `null` on failure, or an
object holding the applicable errors. MediaWiki uses this pattern frequently
with its [`StatusValue`][mw-statusvalue] class. Each `StatusValue` holds a
value, information regarding whether the status is "good" or "okay", and
optionally warning or error messages. A function returns a `StatusValue`, and
that object holds either the successful result or details of the failure.

On the other hand, with "out-of-band signaling", error messages are reported
through an entirely different mechanism than the function return. This covers
logging a warning in addition to returning the value (where the issue is
not enough to entirely prevent the code in question from running) or throwing
an exception, in which case no value is returned from the function or procedure.

One danger with in-band signaling is that a value used to signal failure may
also be a valid value on success. While this isn't the case for MediaWiki's use
of an object to hold errors, this is the case with some built-in PHP functions.
For example, when calling [`ReflectionClass::getConstant()`][ref-get-constant],
the return value is either the value of the constant, or `false` for a missing
constant. But, `false` is also a valid constant value! Due to the use of
in-band signaling, it is unclear whether `false` means that the constant does
not exist, or exists and has the value `false` - further investigation (e.g.,
calling `ReflectionClass::hasConstant()`) is necessary to understand the result.
On the other hand, with out-of-band signaling, this confusion does not exist.

Among the many changes coming in PHP 8.5, I worked to add three out-of-band
signals through PHP's RFC process:

* `ReflectionClass::getConstant()` will now log a deprecation warning when the
constant does not exist; this is expected to become an exception in PHP 9.0.
([RFC][rfc-get-constant])
* [`ReflectionProperty::getDefaultValue()`][ref-get-default] will now log a
deprecation warning when the property has no default; this is expected to become
an exception in PHP 9.0. `ReflectionProperty::getDefaultValue()` returns the
default value of a property, or `null` if there is no default, but `null` is
also a valid default value. ([RFC][rfc-get-default])
* `FILTER_THROW_ON_FAILURE` is added to instruct the PHP filter extension to
throw an exception when filtering fails, rather than returning `false` (the
default) or `null` (when `FILTER_NULL_ON_FAILURE` is used). ([RFC][rfc-filter])

The hope is that, by using out-of-band signaling, the confusion that comes from
in-band signaling can be eliminated.

[mw-statusvalue]: https://doc.wikimedia.org/mediawiki-core/master/php/classStatusValue.html
[ref-get-constant]: https://www.php.net/manual/en/reflectionclass.getconstant.php
[ref-get-default]: https://www.php.net/manual/en/reflectionproperty.getdefaultvalue.php
[rfc-get-constant]: https://wiki.php.net/rfc/deprecations_php_8_5#deprecate_reflectionclassgetconstant_for_missing_constants
[rfc-get-default]: https://wiki.php.net/rfc/deprecations_php_8_5#deprecate_reflectionpropertygetdefaultvalue_for_properties_without_default_values
[rfc-filter]: https://wiki.php.net/rfc/filter_throw_on_failure
