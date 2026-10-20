---
title: Longhorn PHP 2026
tags: ["conferences", "php"]
---

# Longhorn PHP 2026

Last week, I attended the Longhorn PHP conference in Austin, Texas, for the
[second year in a row][blog-longhorn]. Alongside catching up with familiar
faces, I also had the chance to interact with and learn from developers that I
hadn't met before.

The two-day conference featured workshops on Thursday, and then talks on Friday.
I led a workshop on Thursday afternoon and then gave a talk on Friday following
lunch.

## Thursday

For Thursday's workshops, attendees could choose either two half-day workshops
or one full-day workshop. Since I was slated to lead a workshop in the
afternoon, I couldn't attend the full-day workshop. For the morning session I
chose to attend [Alena Holligan][site-Alena]'s
["One Source of Truth for Requirements, Code, Documentation, and Tests"][openapi],
where I learned all about advanced ways to use OpenAPI specs and integrate them
with other tools.

### My workshop

In the afternoon, I led my workshop, ["Creating new PHP extensions in Rust"][my-workshop].
I think overall it went fairly well, though there were a few small hiccups.

The first issue that came up actually arose Thursday morning at breakfast, when
another workshop organizer suggested that it was not safe to assume that all
workshop participants had access to [Docker][docker] on their machines.
Thankfully, everyone who attended my workshop had access to Docker, but in the
future I'll be sure to make it clear to attendees in advance that they need to
be able to use Docker.

The second issue was out of my control: Rust 1.99.1 [was released][rust-1.99.1]
right before the workshop started. To ensure that everyone was using the same
version of Rust, I had to rebuild my own Docker image, which took some time.

The biggest issue was a logic error on my part: in the example extension we
were building throughout the workshop, I neglected to handle `readonly` class
properties correctly. Despite working on the extension for months, I failed to
notice that the constructor implementations were wrong. Something to improve for
next time.

I'm not yet sure if I want to release the workshop code publicly, but over the
coming weeks I'm planning to write some blog posts about [RSPHP][rsphp], a set
of Rust crates that make it easier to create PHP extensions in Rust. The
workshop code was built using RSPHP, rather than an alternative such as
[ext-php-rs][ext-php-rs], because I didn't want to abstract away too much of the
detail of the Zend ABI.

## Friday

Friday was the day of talks. Given that there was only one day of talks at the
conference this year, I opted not to spend any time in the "hallway track" and
attended a session in each block. Those were:

1. Opening Keynote: ["PHP is People: The Foundation, the Community, and You"][talk-phpf]
from [Elizabeth Barron][site-Elizabeth]
2. ["Parallel Futures: Unlocking Multithreading in PHP"][talk-parallel] from
[Florian Engelhardt][site-Florian]
3. ["Onboard like a PHP Staff Engineer"][talk-onboard] from
[Lincoln Russell][site-Lincoln]
4. My own talk, discussed below
5. ["How Tetris Made Me a Better Programmer"][talk-tetris] from
[Len Woodward][site-Len]
6. ["Code Review: For Me & You"][talk-code] from [Steve Grunwell][site-Steve]
7. Closing keynote: ["The Commit You Can't Take Back: Conscience in a Career That Builds the Future"][talk-future]
from [Eric Mann][site-Eric]

Aside from my own talk (obviously), I had a hard time choosing between sessions,
because they all sounded so interesting. I'm glad they were recorded, and
hopefully I'll have the chance to watch the talks I couldn't see in person.

### My talk

At Longhorn, I presented an updated version of my talk,
"PHP 8.6: The Inside Scoop," which I had most recently presented at PHP Tek in
May. An updated version of the slides can be found [here on my site][slides].

Aside from spotting a single-character typo towards the end of the talk,
everything went smoothly. I may have ended the talk a few minutes early, but
early is better than late, and last year I ran significantly over my
allotted time.

## Looking ahead

Next month, I'll be presenting my talk about PHP 8.6 at [MergePHP][mergephp].
See the details [on the MergePHP site][mergephp-me]. Hopefully I don't run into
the internet issues that I encountered [last year][blog-mergephp].

[blog-longhorn]: ./20251029-longhorn-php
[blog-mergephp]: ./20251118-mergephp-talk
[docker]: https://www.docker.com/
[ext-php-rs]: https://ext-php.rs/
[mergephp]: https://www.mergephp.com/
[mergephp-me]: https://www.mergephp.com/meetups/2026/11/12/php-8-6-the-inside-scoop.html
[my-workshop]: https://longhornphp.com/sessions#creating-new-php-extensions
[openapi]: https://longhornphp.com/sessions#one-source-of-truth-for-requirements-code-documentation-and-tests
[rsphp]: https://github.com/DanielEScherzer/rsphp
[rust-1.99.1]: https://blog.rust-lang.org/2026/10/15/Rust-1.99.1/
[site-Alena]: https://devparent.com/
[site-Elizabeth]: https://www.eb-tc.com/
[site-Eric]: https://eamann.com/
[site-Florian]: https://dotbox.org/
[site-Len]: https://lenwoodward.com/
[site-Lincoln]: https://lincolnwebs.com/
[site-Steve]: https://stevegrunwell.com/
[slides]: ./../files/20261016%20Longhorn%20PHP%20presentation.pdf
[talk-code]: https://longhornphp.com/sessions#code-review-for-me-you
[talk-future]: https://longhornphp.com/sessions#the-commit-you-cant-take-back-conscience-in-a-career-that-builds-the-future
[talk-onboard]: https://longhornphp.com/sessions#onboard-like-a-php-staff-engineer
[talk-parallel]: https://longhornphp.com/sessions#parallel-futures-unlocking-multithreading-in-php
[talk-phpf]: https://longhornphp.com/sessions#php-is-people-the-foundation-the-community-and-you
[talk-tetris]: https://longhornphp.com/sessions#how-tetris-made-me-a-better-programmer
