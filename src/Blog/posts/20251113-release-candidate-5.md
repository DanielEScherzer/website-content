---
title: The Story of PHP 8.5.0 Release Candidate 5
extra-classes:
  - blog-page--sidebar-image
---

# The Story of PHP 8.5.0 Release Candidate 5

PHP 8.5.0 Release Candidate 4, [announced][rc4-announce] last week, was expected
to be the last release candidate (RC) of the PHP 8.5.0 development cycle, before
the general availability release next week. But, earlier today I
[announced the release of PHP 8.5.0RC5][rc5-announce]. So, why was an extra
release candidate needed?

![Extra RC5 confusion](/resources/extra-5-confusion.svg)

When PHP 8.5.0 RC4 was tagged and announced, it was expected to be the last
release candidate before the general availability (GA) release of 8.5.0 next
week. But, a few bugs surfaced that seemed to warrant having their fixes
included in the GA release.

Technically, the GA release could have bug fixes that were never included in
any of the testing releases. But, that would result in releasing code that was
only really tested with GitHub's continuous integration. Such a situation should
be avoided.

## Bugs
Our goal, as always, is to ship with no known bugs. But, at some point, we have
to draw a line and delay further fixes until the next patch release, PHP 8.5.1.
New bugfix releases of supported versions of PHP (currently PHP 8.3 and PHP 8.4,
soon to include PHP 8.5) are announced every four weeks as bugs are continuously
addressed. Neither PHP 8.5.0 RC5 nor the eventual GA release are expected to be
entirely free from bugs, but they should be free from issues that would prevent
upgrading from earlier versions of PHP.

The great thing about people testing the release candidates before the GA
release is packaged is that we can change things when issues are found. Which
is exactly what we are doing here, thanks to user reports.

Among the many changes coming in PHP 8.5, three specific changes led to
bugs that we thought warranted addressing before the GA release. These were

* the creation of the new ext/uri extension
* the addition of a new INI option, `max_memory_limit`
* the deprecation of returning non-strings from output handlers

Thanks to volunteers who tested out the release candidates, and continued
developer attention, we found and addressed the following issues

* [#20431][gh-20431]: `Uri\Rfc3986\Uri::setHost(null)` turns empty path into `/`
* No distinction between empty and missing query/fragment when using
`Uri\WhatWg\Url::getQuery()` and `Uri\WhatWg\Url::getFragment()`
* [#17951][gh-17951]: `memory_limit` is not always limited by `max_memory_limit`
* [#20384][gh-20384]: Confirm if `ob_gzhandler` is impacted by `ob_start`
handler changes

For the `ob_gzhandler` issue, the fix was actually to revert the underlying
changes to `ob_start`. As part of the [PHP 8.4 deprecations RFC][rfc-84-dep],
a proposal was accepted to emit deprecation warnings when an output handler
returned something other than a string. That deprecation wasn't implemented for
the 8.4 release, but I came across the unimplemented RFC and
[implemented it][gh-18932] back in July, in time for inclusion in the PHP 8.5
release. The issue filed here was asking for some clarification when the output
handler was the [`ob_gzhandler`][fn-ob_gzhandler] function from the zlib
extension. After some discussion on the issue, it looked like a bugfix was
going to be applied to improve the behavior of the deprecation warnings, but
eventually it was decided to just revert the deprecation entirely. I'm not sure
to what extent my reluctance to revert the deprecation was based on having been
the one to originally implement the deprecation, rather than wanting to avoid
changes to the release so close to it being finalized in my role as a release
manager.

Initially, these were addressed the same way bugfixes generally are - a patch
against the relevant version of PHP, in this case PHP 8.5. There are no special
restrictions on merging commits to the branches of supported PHP versions - any
developer with access can merge the changes.

## Cherry Picking
However, to be able to include the fixes in PHP 8.5.0, a release manager (in
this, me) needed to also apply the changes to the `PHP-8.5.0` branch.
Technically, all of the release managers, even for a different version of PHP,
have access to the patch-specific branches for PHP 8.5, but my understanding is
that these branches are essentially "owned" by the PHP 8.5 release manager. In
other words, if a PHP 8.4 release manager had sent one of these bug fixes, in
theory they *could* have also updated the `PHP-8.5.0` branch, but they probably
would not have.

In addition to adding the commits to the `PHP-8.5.0` branch, I also needed to
make sure that GitHub ran the standard suite of tests for the cherry-picked
changes. GitHub is configured to run tests when commits are pushed to the
`master` and version-specific branches (e.g. `PHP-8.5`), but not the
patch-specific branches like `PHP-8.5.0`. Thankfully, the workflow for tests
could also be triggered manually, specifying what branch to run against - I was
able to thus tell GitHub to run the tests for the `PHP-8.5.0` branch.
Thankfully, the tests all passed - had they failed, I'm not sure what I would
have done.

For a full comparison of the changes between RC4 and RC5, you can check the
[comparison between the two tags][gh-comp-tags] on GitHub.

## Process
Once it was decided to add another release candidate, and the relevant changes
were present in the `PHP-8.5.0` branch, the process to actually tag and announce
the new release was essentially the same as normal. For those interested, my
[blog entry explaining the reasons for PHP 8.5.0alpha4][blog-alpha4] includes
a description of the process. The main difference was that, since there was
already a patch-level branch created for the 8.5.0 GA release, the RC5 tag was
created from that branch, rather than the main `PHP 8.5` branch.

## Looking Ahead
Fingers crossed, RC5 should be the last release candidate needed, and we will
be able to announce the general availability of PHP 8.5 next week as scheduled.
If not, we would need to delay by another **four weeks** in order to align with
the release cycle of the maintenance branches.

I'm also giving [a presentation about PHP 8.5 changes][talk-mergephp] later
today through MergePHP. I need to make sure that my slides are updated to
account for the changes we just made - specifically, I was going to talk about
the output handler deprecation that is now no longer happening.

[rc4-announce]: https://www.php.net/archive/2025.php#2025-11-06-1
[rc5-announce]: https://www.php.net/archive/2025.php#2025-11-13-1
[gh-20431]: https://github.com/php/php-src/issues/20431
[gh-17951]: https://github.com/php/php-src/issues/17951
[gh-20384]: https://github.com/php/php-src/issues/20384
[rfc-84-dep]: https://wiki.php.net/rfc/deprecations_php_8_4
[gh-18932]: https://github.com/php/php-src/pull/18932
[fn-ob_gzhandler]: https://www.php.net/manual/en/function.ob-gzhandler.php
[gh-comp-tags]: https://github.com/php/php-src/compare/php-8.5.0RC4..php-8.5.0RC5
[blog-alpha4]: ./20250801-no-alpha-3
[talk-mergephp]: https://www.mergephp.com/meetups/2025/11/13/php-8-5-new-features-from-the-source.html
