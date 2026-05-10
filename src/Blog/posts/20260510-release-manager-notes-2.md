---
title: Notes for PHP Release Managers, Part 2
---

# Notes for PHP Release Managers, Part 2

A few months ago, I wrote up [a blog post][blog-rm-notes-1] about my experience
being a PHP release manager and the kind of commitment that the role requires.
Now, I want to document some of the decision-making and process related to the
latest release that I oversaw, PHP 8.5.6.

I already wrote up [a post][blog-php856-rc-3] about the reason there were three
release candidates, but I want to discuss both the process of actually building
the extra release candidates, and then how security fixes were included in
PHP 8.5.6 that were not included in the release candidates.

## Unannounced releases

PHP 8.5.6 RC2, [like PHP 8.5.0 alpha3][blog-alpha3], was a release that I tagged
and built, but never announced. In both cases, I was faced with the question of
how to update the `NEWS` file for the new release. Specifically, should an
unannounced version be mentioned at all?

For PHP 8.5.0 alpha4, I decided to skip mentioning the alpha3 release; the
changes that had been included in alpha3, and the changes that had landed
afterwards and were new in alpha4, were presented in a single section under
the heading of PHP 8.5.0 alpha4. [See that `NEWS` file][news-alpha4].

In hindsight, however, I think that that was a mistake. While PHP 8.5.0 alpha3
was never announced, it was properly tagged and exists in the history of the
repository. New versions should document the changes since prior versions, even
if those prior versions are not expected to be used.

With that in mind, when it came to PHP 8.5.6 RC3, I included separate sections
for the different release candidates. Even though RC2 was not announced, it was
still listed with its expected announcement date, making it clear what bug fix
was included in RC3 but not RC2. [See that `NEWS` file][news-rc3].

## Patch-level branch handling

Having decided how the `NEWS` file should appear in the release candidates, I
then needed to figure out how it would look in the PHP-8.5.6 branch. For the
initial release of PHP 8.5.0, this wasn't really an issue - the expectation was
that the development branch would have separate sections for each release
candidate, and then before the final release
[the sections were combined][commit-cc1e300]. This matches
[the documented process][docs-xy0] for preparing for the initial stable version,
where separate pre-release `NEWS` sections are consolidated.

For PHP 8.5.6, on the other hand, each release candidate was expected to be the
last one. Thus, rather than starting off with separate sections and combining
them, I started off with a single section, and only created the separate
sections in the actual release candidates.

For the uriparser library update,

* on the `PHP-8.5.6` branch, the `NEWS` entry was
[added to the main 8.5.6 section][commit-5b6d153]
* when tagging RC2, the `NEWS` entry was
[moved to a dedicated RC2 section][commit-93f8ba6]

Similarly, when tagging RC3, I [updated the `NEWS` file][commit-0b26f53] to
include both an RC2 section with the uriparser change, and an RC3 section with
the dom extension build fix.

You may be wondering why the `PHP-8.5.6` branch `NEWS` file was not updated
for the dom extension build fix, but the uriparser library update was. This
inconsistency is intentional - the uriparser update was a change from the
previously released version (PHP 8.5.5), but the dom extension build fix was
to correct a regression that had not yet been released. This matches the
[instructions for updating the `NEWS` file][contributing-news] when it comes to
the `NEWS` file in the `master` branch, and the process of
[removing entries as part of the initial release][docs-xy0]. If a bug was never
released, or was already fixed in the previous version, it doesn't need to be
mentioned.

## Security fixes

PHP 8.5.6 was also the first security release that I oversaw, so I wasn't done
yet. The good news was that the process of building a security release turned
out to be a lot simpler than I had expected.

Normally, when it is time to build the stable release, I just follow the
[steps in the documentation][docs-stable-package]. Check out the patch-level
branch (in this case, `PHP-8.5.6`), skip the step about CVE commits since there
aren't any, run `./scripts/dev/credits`, create the release branch, and so on.
This time, however, that CVE commit step could not be skipped.

However, the documentation of handling the security fixes is outdated. Rather
than waiting for the fixes to be incorporated into the main branches and then
cherry-picking them, I was instead sent a patch to apply directly to the
patch-level branch. Since that patch was completely up to date with the
`PHP-8.5.6` branch, I didn't need to rebase it, address merge conflicts, or
deal with any other complications - I could just fast-forward the `PHP-8.5.6`
branch to include the ten extra commits. In fact, they could even maintain their
GPG signatures for added security. See the
[history of the `PHP-8.5.6` branch][history-856] for the specifics.

## Conclusion

For PHP 8.5.6 RC2, RC3, and the eventual PHP 8.5.6 release, I needed to make
some decisions or apply some process that wasn't fully documented. I used my
judgement to apply the spirit of the existing documentation to the situations
at hand, but ideally, the documentation would address these kinds of things.
As I mentioned in my post about
[serving as the PHP 8.6 veteran release manager][blog-rm-86], one of the things
I want to work on is improving the documentation around the release process.
While I had originally planned to focus on documenting the role of the "veteran"
release manager, part of that role is sharing institutional knowledge. That also
means documenting the things I've learned serving as a "rookie" release manager
for PHP 8.5.

[blog-rm-86]: ./20260416-php86-release-manager
[blog-alpha3]: ./20250801-no-alpha-3
[blog-rm-notes-1]: ./20260218-release-manager-notes
[blog-php856-rc-3]: ./20260430-php856-rc-3
[commit-cc1e300]: https://github.com/php/php-src/commit/cc1e300d4dbaaf8c6823af24aab5d1ce36468548
[commit-5b6d153]: https://github.com/php/php-src/commit/5b6d1530c4500b076285dcf76ab58ac7e77448b1
[commit-93f8ba6]: https://github.com/php/php-src/commit/93f8ba6f7c148a4a1f65884bcc946fee4d64d5b6
[commit-0b26f53]: https://github.com/php/php-src/commit/0b26f53de58f50bc893a15dbd77ea41d8ce33e9d
[contributing-news]: https://github.com/php/php-src/blob/eedda2a03c681f12e7aaef87fc747191bd047a67/CONTRIBUTING.md#news
[docs-stable-package]: https://github.com/php/php-src/blob/eedda2a03c681f12e7aaef87fc747191bd047a67/docs/release-process.md#packaging-a-stable-release
[docs-xy0]: https://github.com/php/php-src/blob/eedda2a03c681f12e7aaef87fc747191bd047a67/docs/release-process.md#preparing-for-the-initial-stable-version-php-xy0
[history-856]: https://github.com/php/php-src/commits/PHP-8.5.6/
[news-alpha4]: https://github.com/php/php-src/blob/php-8.5.0alpha4/NEWS
[news-rc3]: https://github.com/php/php-src/blob/php-8.5.6RC3/NEWS
