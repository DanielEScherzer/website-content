---
title: MergePHP, November 2025
---

# MergePHP, November 2025

Last week, I presented "PHP 8.5: New Features from the Source" for a second
time, this time [through MergePHP][mergephp-talk], an online meetup combining
multiple PHP user groups. The talk generally went better than it did the
previous time I presented on that topic, at Longhorn PHP.

I ran into a few technical issues, but they were not problems that I could have
easily foreseen, and I'm happy with how I handled them. The content was based
on the slides for Longhorn, but I addressed the topics in a much better order
than [last time][blog-longhorn-talk], where I focused on the deprecations and
didn't have enough time to discuss the new features in depth.

## Longhorn Updates
I started working on the slides for my presentation the week before the talk.
Given that I gave a presentation on the same topic at LongHorn PHP, I began with
a copy of the slides from that presentation, before incorporating the lessons
I learned giving the talk the first time:

* Instead of starting with deprecations, and ending with new features, I put
the new features at the start. Previously, the best/most impactful features
were the last few slides (saving the best for last), but for MergePHP I reversed
both the order of the features discussed and the relative order of the features
and the deprecations, starting the talk with the features that are the most
impactful. I also went through and adjusted the order to better match how they
would be discussed.
* I removed some of the deprecation slides that would likely impact the fewest
people, while requiring the most detail to explain what changed. Specifically,
the slides from LongHorn discussing the deprecation of building the LDAP
extension with Oracle support, the removal of ODBC support for direct driver
integration and old versions of ODBC.

I also made sure to update the one example snippet that used the string
"LonghornPHP" to instead use "MergePHP".

The day before the talk, I also went through a final time and checked if any
of the tooling commits marked as "PENDING" (merged but not yet included in any
release) had been released since I last checked. I'm glad I did a last minute
round of checks, since I was able to incorporate references to
[PHPStan version 2.1.32][phpstan-32], which was released 2 days before my talk.

## The Talk
I think the talk went fairly well from a presentation side, but I did have some
technical difficulties. At first, my microphone refused to connect at all,
and I had to reboot my laptop right before the talk started - thankfully, the
organizers were able to chat a bit to fill the air. Within a few minutes, I was
able to connect and be heard.

During the talk, however, the microphone cut out a few times. Once the
microphone was working again, I would go back and repeat myself, but because
I wasn't staring at the live chat, I didn't realize the microphone had cut
out right away, and probably missed some stuff when I went back, or repeated
some of the content that I had already covered when my microphone resumed
working. I'm not sure what else I could have done - its not like I was in a
moving car on a mobile hotspot, I was just sitting at home!

The talk lasted around an hour, which is what I had expected. But, for the
next time I am scheduled to give this talk, [at ConFoo][talk-confoo], the
alloted time is 45 minutes, including 10 minutes for questions. I'll need to
cut down a *lot* of the material.

## Preparing for ConFoo
That trimming starts now - I started my slides for ConFoo with a copy of the
MergePHP ones, and removed the following slides:

* "Deprecated: function aliases"
* "Deprecated: no-op $exclude_disabled"
* "Deprecated: SplObjectStorage aliases"
* "Deprecated: unregistering all autoloaders"
* "Deprecated: finfo_buffer() $context"
* "Deprecated: openssl_pkey_derive() $key_length"
* "Deprecated: driver-specific PDO parts"

These all covered relatively straightforward deprecations, like replacing an
alias with the underlying function or method. There were also a *lot* of slides
about these deprecations, and so not talking about an entire category of
deprecations should allow me to cut a significant amount of time.

I next removed a few slides about deprecations that were unlikely to impact most
developers or otherwise would take up an inordinate amount of time to cover:

* "Deprecated: existing warnings elevated" - some behavior that triggered
warnings is officially deprecated, but the warning messages are still logged as
`E_WARNING`, which is considered stronger than a deprecation. The change was
primarily to update the warning messages to indicate that the behavior would
result in an error in PHP 9. The circumstances triggering the warning were
unchanged.
* "Deprecated: PDO Pgsql transaction constants" - given that the pdo/pgsql
extension never exposed transaction state, it is unlikely that anyone was
trying to use the transaction-related constants. I tried to find any uses of
these constants on GitHub, but after filtering for unarchived non-fork repos
with code in PHP, all uses that I found were either false positives or related
to testing.
* "Deprecated: __sleep() and __wakeup()" - while a hard deprecation here
would definitely impact a significant group of PHP developers, a
[late-landing RFC][rfc-soft-deprecate] converted the hard deprecation (emitting
deprecation warnings) to a soft deprecation (updating documentation to indicate
deprecation, but no warnings). If and when the hard deprecation returns, it
would warrant discussion, but as things stand for PHP 8.5 the time it would take
to explain how to update to a different serialization system could be better
spent on other 8.5 changes.
* "Deprecated: PDO 'uri:' scheme" - most developers are probably not fetching
the information about what database to connect to from somewhere else on the
internet, and I don't want to give people any ideas.
* "Deprecated: output handler problems" - since the deprecation of the return
value from an output handler not being a string was reverted as part of
[PHP 8.5.0 RC5][blog-rc5], the only thing left is the deprecation of trying to
emit output within an output handler function. Doing so will trigger a clear
error message, and the mitigation procedure is simple - remove the attempt to
produce output.

This first round of cuts brought me from 50 slides to 38 - I'll still need to
cut some of what I have planned, but I've made significant progress in trimming
down the talk.

If you are curious about the content of the removed slides, or any of the
others, a copy of my MergePHP presentation is [here on my site][slides]. After
I give this talk at ConFoo the slides I use for that will also be available.

## Looking Ahead

I'll continue to work on the talk between now and ConFoo. PHP 8.5 comes with a
lot of new features - that is a good problem to have. As a release manager, and
as the author of five of the RFCs implemented in PHP 8.5, I'm very familiar with
a lot of the changes, which can lead to me going into more detail than needed
when discussing the features. For ConFoo, I'll plan to bring speaker notes with
which slides deserve more background discussion, and which slides I should avoid
delving too deep on.

[mergephp-talk]: https://www.mergephp.com/meetups/2025/11/13/php-8-5-new-features-from-the-source.html
[blog-longhorn-talk]: ./20251029-longhorn-php#content-my-talk
[phpstan-32]: https://github.com/phpstan/phpstan/discussions/13787
[talk-confoo]: https://confoo.ca/en/2026/session/php-8-5-new-features-from-the-source
[rfc-soft-deprecate]: https://wiki.php.net/rfc/soft-deprecate-sleep-wakeup
[blog-rc5]: ./20251113-release-candidate-5
[slides]: ./../files/20251117%20MergePHP%20presentation.pdf
