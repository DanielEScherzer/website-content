---
extensions:
  footnotes: true
  toc: true
tags: ["php"]
title: "PHP2Shell: a Timeline"
---

# PHP2Shell: a Timeline

Much has been written about the [PHP2Shell][php2shell] vulnerabilities in recent
days, and much more will be published in the coming weeks. My goal in this
article is to provide a concrete timeline of key events, without passing
judgement. I have my own thoughts on how things played out, but will reserve
them for a future blog post.

PHP2Shell concerns two related vulnerabilities that could allow unauthenticated
remote code execution in affected PHP deployments. The vulnerabilities were
assigned [CVE-2026-109618][cve-618] and [CVE-2026-109619][cve-619], and fixes
were released in PHP 8.2.35, 8.3.36, 8.4.27, and 8.5.12.

As a release manager, I was privy to some internal discussions, and as one of
the release managers for PHP 8.5, I actually did some of the things discussed
below (including tagging and creating tarballs for PHP 8.5.12). I have only
included events and times that are verifiable with public information. This
timeline is not exhaustive, but should cover the main points of interest, up to
and including the public release of the fixes.

## Discovery

* 2024.06.25: ["security-audit-2024" tag][tag-security-audit] was created in the
[php/php-src][gh-php-src] GitHub repository. This tag identified a specific
commit during the PHP 8.4 development cycle that would be the basis of a
security audit being performed by [QuarksLab][quarkslab].[^audit]
* 2024 (exact date unknown): While working to address an issue identified during
that audit, a PHP developer "found the first signs of the [out of memory]
problem behind [CVE-2026-109618][cve-618]".[^phpf]
* 2026.05.18: The PHP Foundation announced the creation of an "Ecosystem
Security Team".[^eco]
* 2026.07.30: [Calif][calif] began an audit of the PHP project as part of the
[Patch the Planet][openai-ptp] project.[^phpf]
* 2026.08.01: Calif began the discovery of code paths that led to the remote
code execution vulnerabilities.[^calif]
* 2026.08.11: Calif reported an unconditional remote code execution
vulnerability with the same underlying cause as the out of memory issue found
in 2024, followed by additional reports from other organizations.[^phpf]

## Mitigation

* 2026.08.11: Addressing the out of memory vulnerability became "the top
priority for all of the PHP Foundation's team working on security."[^phpf]
* 2026 (August - October): Security patches to address the vulnerability were
created, tested, and prepared for release.

## Releasing

All times given are in UTC.

### Monday, 2026.10.19

* 07:30: tag for `php-8.2.35` was created.[^git-src]
* 07:38: tarballs for PHP 8.2.35 were created.[^git-dist]
* 14:00: tag for `php-8.3.36` was created.[^git-src]
* 14:13: tarballs for PHP 8.3.36 were created.[^git-dist]
* 14:44: tag for `php-8.4.27` was created.[^git-src]
* 14:53: tarballs for PHP 8.4.27 were created.[^git-dist]
* 17:04: tag for `php-8.5.12` was created.[^git-src]
* 17:19: tarballs for PHP 8.5.12 were created.[^git-dist]

The tags and tarballs created on Monday were not published to public GitHub
repositories until Wednesday, as discussed below. On Monday, the code for the
releases was settled, but the tags were not pushed to [php/php-src][gh-php-src],
nor were the tarballs uploaded to [php/web-php-distributions][gh-php-dist].

As I have [previously written][blog-notes-1], PHP releases are normally tagged
on Tuesdays; creating the tags on Monday was unusual. The decision not to make
the tags public at the time was also inconsistent with the existing
documentation for the release process; [a pull request][pr-24415] is open to
align the documentation with the new practice.

At the time these tags were created, the releases were still expected to be
made public on Thursday (in line with PHP's normal release schedule). The date
is evident from the dates in the NEWS files for each release. The coordinated
releases were originally scheduled for 14:00 UTC on Thursday, October 22.[^phpf]

### Tuesday, 2026.10.20

* ~15:00: online discussion of the two CVE IDs ([CVE-2026-109618][cve-618] and
[CVE-2026-109619][cve-619]) was noted, though with some incorrect details. In
response to the discussion, the release was rescheduled from 14:00 UTC on
Thursday, October 22, to Wednesday, October 21, at the same time.[^phpf]
* 19:25: the [php/web-php][gh-web-php] repository on GitHub
[is updated][commit-prerelease] to include a pre-release announcement for the
upcoming security releases. That repository controls the news items shown on
[php.net][site-php], and is periodically synced to the live website.[^git-web]
* 19:33: the PHP security team announces on the [php-announce][list-announce]
mailing list that a security release will be made public the following day.[^mail]
The announcement was also made in a few other places around the same time.
* ~20:00: Calif published a video with a proof of concept; the video was later
deleted, but not before being copied.[^phpf]
* 20:27: a copy of that video was published and remains online.[^tw-vid]

<!--
For the claim of "other places" in addition to php-announce:
* https://news-web.php.net/php.internals/132883 internals @ 1932
* https://news-web.php.net/php.general/328874 general @ 1934
-->

### Wednesday, 2026.10.21

* Morning (exact time unknown): [Chainguard][chainguard] published patched
versions of PHP 8.2, 8.3, 8.4, and 8.5. The PHP Foundation reports that
Chainguard unilaterally broke embargo at 07:41,[^phpf] while reports on Hacker
News suggest that the patched builds were available at least since
06:07.[^hn-chainguard]
* 13:31: the [php/web-php-distributions][gh-php-dist] repository was updated with
the tarballs for PHP 8.2.35, 8.3.36, 8.4.27, and 8.5.12.[^logs-php-dist]
* 13:33: the [php/web-php][gh-web-php] repository was updated with release
announcements for the four new versions, along with an [overall security
announcement][php-security-news] explaining the issue and how to upgrade,
including the fact that source-only backports have been created for PHP 7.4,
PHP 8.0, and PHP 8.1.[^logs-web-php] The php.net website was shortly thereafter
synced to include the announcements.
* 13:34: the GitHub advisories (["RCE via stale global state"][ghsa-6wmf] and
["RCE via OOM corruption"][ghsa-w8hw]) for the vulnerabilities were
published.[^ghsa]
* 13:35: the [php/php-src][gh-php-src] repository was updated with:[^logs-php-src]
	* A new `PHP-7.4-CVE-2026-109618-109619` branch that includes the fixes,
	backported for PHP 7.4
	* A new `PHP-8.0-CVE-2026-109618-109619` branch that includes the fixes,
	backported for PHP 8.0
	* A new `PHP-8.1-CVE-2026-109618-109619` branch that includes the fixes,
	backported for PHP 8.1
	* A new `PHP-8.2.35` branch that includes the fixes
	* A new `PHP-8.3.36` branch that includes the fixes
	* An updated `PHP-8.4.27` branch that includes the fixes
	* An updated `PHP-8.5.12` branch that includes the fixes

PHP 8.4 and 8.5 are actively maintained, while PHP 8.2 and 8.3 continue to
receive security fixes. PHP 8.1 and older branches are no longer supported,
although due to the severity of these issues, minimal backports were published.

GitHub does not appear to publicize when the git tags with the fixes were
pushed to GitHub. GitHub reports that the GPG signatures on those tags were all
verified at 13:35 the same day, so they must have been on GitHub by then. Git
does have the functionality to push both branches and tags to a repository (e.g.
from a local machine to GitHub) in an atomic operation, so it is possible that
the tags were pushed to GitHub at 13:35 in the same operation that pushed the
branches, but no public record establishes that this was the case.

## Deployment

Fixes to the vulnerabilities were confidentially shared with multiple
vendors under embargo before the public release yesterday, giving those
organizations the opportunity to deploy fixes to the sites under their control
before the vulnerabilities were made public.

Administrators of other websites that run on PHP should upgrade immediately if
they have not already done so. Upgrading is the **only** complete solution to
these vulnerabilities. See the [advisory on php.net][php-security-news] for more
information.


[^audit]: More details can be found in the audit report, available
[on the PHP Foundation site][audit-report].

[^calif]: ["php2shell by Calif Research,"][calif-php2shell] Calif, October 21, 2026.

[^eco]: Elizabeth Barron,
["Announcing the Ecosystem Security Team at the PHP Foundation,"][phpf-ecosystem]
PHP Foundation, May 18, 2026.

[^logs-php-dist]: Time identified based on the
[GitHub activity logs][logs-php-dist] of the
[php/web-php-distributions][gh-php-dist] repository.

[^logs-php-src]: Time identified based on the
[GitHub activity logs][logs-php-src] of the [php/php-src][gh-php-src] repository.

[^logs-web-php]: Time identified based on the
[GitHub activity logs][logs-web-php] of the [php/web-php][gh-web-php] repository.

[^ghsa]: Times identified based on the GitHub security advisory pages.

[^git-dist]: Time identified based on git history of the
[php/web-php-distributions][gh-php-dist] repository.

[^git-src]: Time identified based on git history of the
[php/php-src][gh-php-src] repository.

[^git-web]: Time identified based on git history of the
[php/web-php][gh-web-php] repository.

[^hn-chainguard]: ftfyyyyyy, [comment][hn-comment] on
["Security advisory: Critical remote code execution vulnerabilities, update now"][hn-thread],
Hacker News, October 21, 2026.

[^mail]: The PHP security team to php.announce,
["Upcoming Critical PHP Security Release,"][mail-announce] October 20, 2026.

[^phpf]: The PHP Foundation,
["Today’s PHP Security Release, and How We’re Strengthening PHP Security,"][phpf-writeup]
PHP Foundation, October 21, 2026.

[^tw-vid]: Kirill Firsov (@k_firsov), ["php2shell"][tw-vid], Twitter, October 20, 2026.

[audit-report]: https://thephp.foundation/assets/files/24-07-1730-REP-V1.4_temp.pdf
[blog-notes-1]: ./20260218-release-manager-notes
[calif]: https://calif.io/
[calif-php2shell]: https://calif.io/php2shell
[chainguard]: https://www.chainguard.dev/
[commit-prerelease]: https://github.com/php/web-php/commit/04b67f5e36f668e9bb57b4a6f28c8641bd92f347
[cve-618]: https://nvd.nist.gov/vuln/detail/cve-2026-109618
[cve-619]: https://nvd.nist.gov/vuln/detail/cve-2026-109619
[gh-php-dist]: https://github.com/php/web-php-distributions
[gh-php-src]: https://github.com/php/php-src
[gh-web-php]: https://github.com/php/web-php
[ghsa-6wmf]: https://github.com/php/php-src/security/advisories/GHSA-6wmf-4rv5-p3rp
[ghsa-w8hw]: https://github.com/php/php-src/security/advisories/GHSA-w8hw-w9fx-j79w
[hn-comment]: https://news.ycombinator.com/item?id=50176665
[hn-thread]: https://news.ycombinator.com/item?id=50172041
[list-announce]: https://news-web.php.net/php.announce
[logs-php-dist]: https://github.com/php/web-php-distributions/activity
[logs-php-src]: https://github.com/php/php-src/activity
[logs-web-php]: https://github.com/php/web-php/activity
[mail-announce]: https://news-web.php.net/php.announce/509
[openai-ptp]: https://openai.com/index/patch-the-planet/
[php-security-news]: https://www.php.net/archive/2026.php#2026-10-21-5
[php2shell]: https://php2shell.com
[phpf-ecosystem]: https://thephp.foundation/blog/2026/05/18/announcing-ecosystem-security-team/
[phpf-writeup]: https://thephp.foundation/blog/2026/10/21/todays-php-security-release-and-how-were-strengthening-php-security/
[pr-24415]: https://github.com/php/php-src/pull/24415
[quarkslab]: https://www.quarkslab.com/
[site-php]: https://php.net
[tag-security-audit]: https://github.com/php/php-src/releases/tag/security-audit-2024
[tw-vid]: https://x.com/k_firsov/status/2112641845926989944
