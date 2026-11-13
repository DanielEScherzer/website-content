---
title: MergePHP, November 2026
tags: ["conferences", "php"]
---

# MergePHP, November 2026

This week, I presented "PHP 8.6: The Inside Scoop" for a third time, this time
[through MergePHP][mergephp-talk], an online meetup combining multiple PHP user
groups. This was my second time presenting for MergePHP, following my
[talk last year][blog-mergephp-2025] about PHP 8.5.

I was lucky enough to be invited to give the talk in person for the
Portland PHP User Group, while streaming it online for those in other locations.
My thanks to the organizers of the Portland meetup for inviting me to join them;
having an in-person audience made it feel less like I was talking to myself.
Since my laptop screen was displaying my slides, I couldn't keep an eye on the
livestream chat, so it was also helpful to have people in the room who could
monitor it for questions.

The talk went more smoothly than my presentation last year, which was plagued by
technical difficulties. Other than a single misplaced comma on one of the
slides, I don't think anything else went wrong. As always, a copy of my slides
[is available on my site][slides].

As I have done in previous talks about new PHP features, I ended my presentation
by asking the audience if there were any features that they wanted to request
for inclusion in PHP 8.7. I couldn't promise that any of them would be
implemented, or that an RFC proposing them would be accepted, but I could at
least investigate. In fact, one of the new features in PHP 8.6, allowing the
`#[\Override]` attribute to be used on class constants
([RFC][rfc-override-constants]), was something that I implemented following a
request at last year's MergePHP talk.

The audience suggested a few features that I plan to look into, including

* Adding friendship support (I already have [an RFC][rfc-friends] and
implementation for this, I just need to revisit it once PHP 8.6 is out the door)
* Adding context to `Exception` objects
* Supporting integer types with a specified range

Sounds like I have some coding to do!

[blog-mergephp-2025]: ./20251118-mergephp-talk
[mergephp-talk]: https://www.mergephp.com/meetups/2026/11/12/php-8-6-the-inside-scoop.html
[rfc-friends]: https://wiki.php.net/rfc/friends
[rfc-override-constants]: https://wiki.php.net/rfc/override_constants
[slides]: ./../files/20261112%20MergePHP%20presentation.pdf
