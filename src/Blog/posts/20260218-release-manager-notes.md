---
title: Notes for PHP Release Managers
---

# Notes for PHP Release Managers

Each release of PHP has a team of release managers responsible for managing
the release process. Next month, the other PHP 8.5 release managers and I will
begin the process of selecting the release managers for PHP 8.6. I figured it
might be helpful to document my experiences so far, to give potential volunteers
some extra context.

So far, my experience as a release manager has been dominated by the work that
precedes general availability (GA), i.e. getting PHP 8.5 from development to the
initial release of PHP 8.5.0. As a result, I focus mostly on the pre-GA work.
If you are considering volunteering to be a release manager, I hope you find
my write-up useful.

## Time commitment

Being a release manager represents a commitment to the PHP community that you
have the time to do the needed work. As part of each release, you will need to
build two versions of PHP (one with thread-safe support and one without), run
an extensive test suite, and, if everything looks good, tag the release and
build the tarball.

At least in my setup (I use a Windows machine and do development in a docker
container) running the tests generally takes at least an hour. Most of that
time is spent on waiting for the build and test commands to finish executing,
so I don't necessarily need to be actively doing anything, but packaging a
release is not something that can be done in just a few minutes. I'm told that
for others the process is significantly faster, so this may be a quirk of my
setup - after you go through the process the first time you should have a sense
of how long it will take. Of course, if things go wrong, or tests fail and you
need to debug them, the packaging process can take longer than usual. I
generally set aside three hours for packaging a release. This work is generally
done on Tuesdays, and a new release (or release candidate) is built every two
weeks. 

Packaging is done on Tuesdays, but announcements are delayed until Thursday.
The announcement process does not take as long, but the announcement emails
need to wait until after the PHP website is updated, and updates to the website
are not instantaneous. The current documentation suggests that it can take up
to an hour for the website to update - I generally set aside two hours on days
that I am announcing a release.

The "every two weeks" cadence applies from the start of the release cycle with
the first alpha release, until the end of bugfix support roughly two-and-a-half
years later. Afterwards, security releases are done as needed. Security releases
also don't use release candidates, so the time commitment is typically lower. (I
haven't done this yet, ask me again in two years to confirm.)

## Review commitment

After the first beta release for a PHP version is tagged, there is a "soft"
freeze on new features being added to PHP. At the point of the beta release
being tagged, the new version (e.g. PHP 8.6) is still being built from the
`master` branch of the PHP source code. There is not yet a separate branch for
the version after that (e.g. PHP 8.7). Any new changes merged into PHP would be
included in the new release, and thus care is required in deciding what changes
should be merged.

From the start of the "soft" feature freeze, new features (including those that
were accepted in an RFC) can only be merged with the agreement of the release
managers for that release. It is unclear whether this means that only one of
the release managers needs to approve the changes, or that they all do; the
release managers for a specific version can decide that amongst themselves.
Either way, release managers are expected to be available to review requests
for inclusion in the new version and either accept them for inclusion or defer
them until the next version. There were a number of patches that the PHP 8.5
release managers decided not to include after the feature freeze, and were
delayed until after PHP 8.5 was branched.

To be clear, release managers are *not* required to be reviewing the changes
from a technical perspective, but should be able to understand the changes well
enough to assess risk. Release managers decide if changes would break existing
PHP code, create confusion among developers, or lock in an API that is
problematic. I would frequently mark patches as approved with the comment along
the lines of "RM approval, technical review not performed" to make the
distinction clear.

## Permissions

Release managers are given commit access to the [php/php-src][php-src-repo],
which is needed for committing changes, creating branches and tags, and other
core parts of the release workflow. They are also able to bypass some rules
that govern that repository; most people with merge access don't have the
ability to create new branches or tags.

I had commit access before becoming a release manager, and so was already used
to being extra careful about what repository I was pushing to. For new release
managers who may not be used to having direct commit access, it is extra
important to make sure that you are only pushing the branches and tags that you
mean to, and are pushing to the correct repository. If you accidentally push
a commit to the wrong remote, you won't be able to force-push away your mistake;
the GitHub rule that blocks force pushing is one of the rules that release
managers *cannot* bypass.

To prevent potential mistakes, I do all of my release manager work in an
entirely different local copy of php than I do my development, and to push
changes I need to specify the upstream `php-src-for-pushing`, to avoid
accidentally publishing the wrong thing.

## Unplanned work

Occasionally, release managers have more work than expected, and need to create
an extra release. Before PHP 8.5 was released, I already experienced this twice,
first when PHP 8.5.0alpha3 was skipped and I had to build a new release for
8.5.0alpha4 ([details][blog-alpha4]), and then later when a fifth release
candidate was needed for PHP 8.5.0 ([details][blog-rc5]). In the first case,
I only needed to redo the work from Tuesday (building the release), but in the
second case I needed to both build and announce an extra release.

While I have not experienced an unplanned release for PHP 8.5 since general
availability, in my capacity as a normal PHP developer I was involved in some
patches for PHP 8.4 that resulted in a second release candidate for PHP 8.4.7.
In other words, unplanned extra releases can be needed even after general
availability.

## Documentation and resources

Over the years, the release process for PHP has changed, as have the various
parts of the php.net infrastructure that are referenced in the documentation.
As a result, the [documentation][rm-docs] can sometimes be unclear or
unreliable. I bring this up not to criticize the previous release managers who
wrote the documentation, but instead to highlight the fact that new release
managers cannot assume the documentation is fully up to date. If something does
not seem right, send a pull request to change it! If you are unsure, the release
managers for each release generally include a "veteran" who released a previous
version of PHP and can be consulted for clarification.


## Conclusion

Despite the hours needed to be a release manager, the unplanned work, and the
extra worry that comes with using my GitHub access correctly, I've still enjoyed
the experience. As a release manager, I get the opportunity to give back to the
PHP language that I use every day. For developers who may not be as comfortable
contributing to the development of PHP, serving as a release manager is a
concrete and meaningful way to contribute.

[blog-alpha4]: ./20250801-no-alpha-3
[blog-rc5]: ./20251113-release-candidate-5
[php-src-repo]: https://github.com/php/php-src
[rm-docs]: https://github.com/php/php-src/blob/master/docs/release-process.md
