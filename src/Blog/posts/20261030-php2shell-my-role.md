---
extensions:
  footnotes: true
  toc: true
tags: ["php", "php-rm", "php-rm-85"]
title: "PHP2Shell: My Role"
---

# PHP2Shell: My Role

Last week, I wrote [a blog post][blog-timeline] with a timeline of key events
relating to the [PHP2Shell][php2shell] vulnerabilities. That post was based only
on public information, and even though I did some of the things listed in the
timeline, I tried to separate myself from the content.

Here, I want to go into a bit more detail regarding the steps for which I was
personally responsible. To be clear, I was not responsible for discovering the
vulnerabilities, triaging them, or mitigating them; I was only involved in the
release process because I am a release manager for PHP 8.5.

## Monday, 2026.10.19

Of the actions noted in my timeline [for Monday][blog-timeline-mon], I was the
one who

* created the tag for `php-8.5.12`.
* created the tarballs for PHP 8.5.12.

The process of preparing the release was almost identical to that of previous
security releases that I had done, most recently PHP 8.5.8 in July. The only
difference was that, instead of uploading the code to [php/php-src][gh-php-src]
and the tarballs to [php/web-php-distributions][gh-php-dist], the code and
tarballs were uploaded to separate, private GitHub repositories, so that the
code would not be public until the planned release on Thursday.

While doing the builds on Monday rather than Tuesday
[was unusual][blog-notes-1], the date change did not affect the build process.

## Tuesday, 2026.10.20

On Tuesday afternoon in Seattle (but once it was already Wednesday in UTC) I
started working on the updates to the [php/web-php][gh-web-php]
repository.[^script-utc] I made extra sure that I wouldn't accidentally push the
changes publicly by changing my Git remote URL to be `NOT_YET`.

Since it had been decided that I would be pushing the updates to
[php/web-php][gh-web-php], I ran through the process of updating the various
pages for each of the four new releases (PHP 8.2.35, 8.3.36, 8.4.27, and
8.5.12). This was my first time working on the announcement for a new release
from a security-only branch of PHP, so I had to adapt the release process
instructions slightly.[^php-cycle]

## Wednesday, 2026.10.21

On Wednesday (both in Seattle and in UTC), during a Zoom meeting with a number
of other release managers and members of the security team (among others), the
actual fixes were released. Of the actions noted in my timeline
[for Wednesday][blog-timeline-wed], I personally:

* updated the [php/web-php-distributions][gh-php-dist] repository with the
tarballs for PHP 8.2.35, 8.3.36, 8.4.27, and 8.5.12.
* updated the [php/web-php][gh-web-php] repository with the release
announcements for the four new versions, along with an
[overall security announcement][php-security-news] explaining the issue and how
to upgrade.
* updated the [php/php-src][gh-php-src] repository with:
	* the backport branches for PHP 7.4, 8.0, and 8.1.
	* the new `PHP-8.2.35` and `PHP-8.3.36` branches, and the updated
	`PHP-8.4.27` and `PHP-8.5.12` branches.
	* the new `php-8.2.35`, `php-8.3.36`, `php-8.4.27`, and `php-8.5.12` tags.

I noted in my timeline that there was no public evidence that the branches and
tags were pushed to the repository at the same time; as the release manager who
did that pushing, I can confirm that the branches and tags were pushed together
in a single atomic operation.

After the [php.net][site-php] site was synced to include the new announcements,
the final step for the release managers was to send out the email announcements
for the new versions. Normally, the release managers for each branch of PHP do
all of the release steps on their own schedules, and that includes sending out
the announcements.

However, since everything had been made public at the same time due to the
severity of the vulnerabilities, sending all of the emails at once could have
caused problems for the mail server. In total, there were four releases (one
per branch) and three different mailing lists to notify. As a result, we opted
to send out the notifications in branch order, starting with PHP 8.2, with a
break between the different announcements to let the mail server have some time
to process the messages.

## Afterwards

Once I sent out my announcement emails and confirmed that they showed up on the
relevant mailing lists, I could finally take off my release manager "hat" and
be a regular developer. I updated the various sites that I host to run on the
patched versions of PHP, and then dove in to try and understand what the actual
vulnerabilities were. As a release manager, I wasn't part of the discussion
regarding the actual bugs and how serious they were, just that it was a big
deal. It wasn't until last week that I finally started to understand what
exactly was going on, including how the vulnerabilities could be exploited.

[^script-utc]: I waited until it was Wednesday in UTC so that the various
release scripts would use that date for the announcements.

[^php-cycle]: PHP versions are supported for slightly more than two years with
bugfix releases, and for an additional two years after that new security fixes
are still released. E.g., PHP 8.5 was initially released in November of 2025,
will have active support until the end of 2027, and will have security support
until the end of 2029. See [PHP's supported versions][php-ver-sup] for further
information.

[blog-notes-1]: ./20260218-release-manager-notes
[blog-timeline]: ./20261022-php2shell-timeline
[blog-timeline-mon]: ./20261022-php2shell-timeline#content-monday-20261019
[blog-timeline-wed]: ./20261022-php2shell-timeline#content-wednesday-20261021
[gh-php-dist]: https://github.com/php/web-php-distributions
[gh-php-src]: https://github.com/php/php-src
[gh-web-php]: https://github.com/php/web-php
[php-security-news]: https://www.php.net/archive/2026.php#2026-10-21-5
[php-ver-sup]: https://www.php.net/supported-versions.php
[php2shell]: https://php2shell.com
[site-php]: https://php.net
