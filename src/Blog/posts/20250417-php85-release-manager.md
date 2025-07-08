---
title: PHP 8.5 Release Manager
---

# PHP 8.5 Release Manager

I'm honored to share that the PHP internals development community has elected
me as one of the two "rookie" release managers for the PHP 8.5 release cycle.
Working alongside my fellow release managers, I hope to help ensure a smooth and
successful release process.

[![Mastodon post from @php announcing release managers](/resources/2025.04.17-@php@fosstodon.org-114354104670541431.jpg)][toot]

Like all contributions to PHP, the release process is managed by the PHP
developer community. The selection of release managers is done through a public
vote; for PHP 8.5, you can see the results [on the PHP Wiki][todo85]. I'll be
working with two other release managers: [Pierrick Charron][adoy.net] (the
"veteran" release manager) and [Volker Dusch][@edorian] (the other "rookie"
release manager).

A new major or minor version of PHP is released every year in November. Each
release represents the culmination of a year's worth of new features,
improvements, simplifications, refactorings, deprecations, and other changes
that fall outside of bug fixes or security patches. The current process for the
initial release of a new version (i.e., 8.5.0) is
[outlined in the php/policies repository][release-process.rst] and spans 20
weeks. The work begins in July and includes 3 alpha releases, 3 beta releases,
4 release candidates, and finally, the general availability release in November.
Until then, new features can be tested, but PHP 8.5 will still be under
development and should not be used in production systems.

However, my work won't end in November with the release of PHP 8.5.0. Serving as
a release manager is roughly a 4.5-year commitment, as each PHP release is
supported for four years—two years for bug fixes and security patches, followed
by two additional years for security-only updates. For example, PHP 8.1 is
currently in its final year of security support, with version 8.1.32 released on
March 13th.

Although the official release process doesn't start until July, there are a
number of preliminary steps I need to complete as a "rookie" release
manager—things like setting up a GPG key and gaining access to the servers used
for managing releases. In other words, time for me to get to work.

[toot]: https://fosstodon.org/@php/114354104670541431
[release-process.rst]: https://github.com/php/policies/blob/b1262aad5ba2ab8e83c43170ad698662460f12f0/release-process.rst
[todo85]: https://wiki.php.net/todo/php85
[adoy.net]: https://www.adoy.net/
[@edorian]: https://phpc.social/@edorian
