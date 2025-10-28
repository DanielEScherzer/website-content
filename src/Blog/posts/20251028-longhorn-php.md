---
extensions:
  toc: true
title: Longhorn PHP 2025
---

# Longhorn PHP 2025

Last week, I attended the Longhorn PHP conference in Austin, Texas. I had the
opportunity to meet with a slew of open source contributors, listen to some
amazing talks, and even present my own.

The main conference was on Friday and Saturday, with an optional tutorial day
on Thursday. I opted to attend the tutorial day, and so spent a full three days
learning from industry experts about PHP and related concepts.

## Thursday

Thursday was a workshop day, and there were plenty of great options to choose
from. For the first session, I chose to attend
[Observing PHP for Fun and Profit][tutorial-rust] talking about building
a PHP extension in Rust to add profiling, and then using the data from the
profiling to analyze the compilation time for included files.

While the profiling part was interesting, the reason I attended was because of
the focus on building the extension in Rust. Most PHP extensions are written
in C, though I know of at least one (intl) that is written in C++. Having
recently started to teach myself Rust, I figured that this talk would be a nice
intersection of coding in Rust and interacting with the C-ABI for PHP, and it
was.

During the lunch break, in addition to eating I spent some time announcing PHP
8.5.0RC3, the latest release candidate (as of writing). The next version of
PHP that I tag and release is expected to be the official general availability
release of PHP 8.5.0.

After lunch, for the second round of workshops I attended
[How to Run an Accessibility WCAG Audit: Step-by-Step for Beginners][tutorial-wcag].
It was fascinating to see how the guidelines for accessibility are actually
presented, and to learn about common pitfalls for inaccessible websites. One of
the tools (contrast) for checking accessibility was a Chrome plugin, and I
decided to install the plugin and check the pages on my site. I found two pages
with accessibility issues

* the JavaScript demo from my undergrad thesis ([see here][thesis-interface])
* my blog post about the syntax highlighting plugin for CommonMark
([see here][blog-syntax-highlight])

Given that the thesis interface page is meant to represent the version of the
interface that I submitted as part of my thesis, I am not planning to change
the styles for that page at the moment. If I ever build on my thesis and reuse
the code that I wrote, I will be sure to adjust the styles.

On the other hand, for the blog page the solution was easy - just adjust some
sitewide styles. Which I did,
[choosing a slightly darker shade of red][commit-contrast].

I plan to investigate adding accessibility checks to my GitHub Actions CI to
ensure that I don't accidentally slip up.

Also during the tutorial day, I had a chance to meet Scott Keck-Warren, who
interviewed me a few weeks back for the PHP Architect's Community Corner
podcast; see that podcast episode [here][podcast-episode].

## Friday

Friday was the first day of the main conference, and it kicked off with a
keynote, [The Immutable Laws of Software and Life: Code Accordingly][talk-laws].
The various laws were fascinating, but I was slightly pulled out of the
experience by the discussion of [Cunningham's Law][wp-cunningham-law], which
suggests that posting something wrong is the easiest way to get the right answer
on the internet, because people love to correct others. Last year I had the
chance to hear Cunningham speak at [a MediaWiki conference][mwcon-spring-2024],
and heard first-hand from Cunningham that he disputes the attribution of the
law.

Just as the keynote was starting, I got an email that two of my talks had been
accepted for [ConFoo Montreal 2026][confoo]; more on that later.

After the keynote, I stuck around in the main ballroom to attend
[Defining an API Specification: A Step-by-Step Guide][talk-api-spec]. My primary
experience with API specifications has been interacting with MediaWiki's API
endpoints, and MediaWiki [exposes a REST API][mw-rest-api] as an alternative to
its [action API][mw-action-api]. I haven't written any REST endpoints, but now
I think I understand them a bit better. Who knows, I might add an API endpoint
for my website, and if I do I'll definitely keep this guide in mind.

For the last talk before lunch, I moved down the hall to attend
[Better Database Testing with PHPUnit][talk-db-testing]. The library that was
presented, [`cspray/database-testing`][lib-db-testing], looks fascinating.
Unfortunately, the database testing that I do is generally in the context of
MediaWiki, which has its own database testing infrastructure, but if I ever
write a non-MediaWiki tool that interacts with the database, I'll try to
remember to use this helpful library for testing.

After lunch, I attended [Love Your Monolith][talk-monolith]. Even before this
talk, I was a fan of monoliths, but now I better understand the potential risks
when using microservices - network calls can fail, increased indirection can
make things confusing, etc.

I then walked next door for [Local development made easy with DDEV][talk-ddev].
The talk was fascinating, but I am already very used to using docker for my
local development, and it is also what I use at work (and for my website) for
deployments. While it is probably possible to use DDEV for deployments, I am
comfortable with docker for the moment.

Before the next round of talks, there was a short "open spaces" period, where
various groups discussed topics that had been voted on earlier. When topics
where solicited during lunch, I had put forward an offer: as a PHP core
developer very familiar with attributes, and as the maintainer of the PHP
reflection extension, I was open to hearing about feature requests for things
to work on. That topic received enough interest that it was selected, and I
got to hear from some other developers (both in person and remotely via Discord)
regarding features they would like implemented in the reflection extension.
The list of requests is [on GitHub][issue-reflection-reqs], and should give me
some projects to work on when I get the itch to write code but don't have any
specific topics in mind. During the open spaces, I already started diving in to
work on one of the requests, adding a way for an attribute to get information
about the target it had been applied to.

Once the open spaces were over, I made my way over to
[Git as Game Logic: What Video Games Can Teach Us About Version Control][talk-git],
where I learned a few new tricks about using the git command line. The metaphor
of git as a video game was amusing, but as someone already familiar with using
git it wasn't necessary for me to understand the content. The most surprising
feature that I learned about was [git rerere][git-rerere], where git will
remember how you resolved a merge conflict and then automatically reapply the
resolution if the same conflict is encountered again. I'm sure this will come
in handy.

I then stuck around for [PHP Attributes: Let's get Meta][talk-attributes]. While
I am familiar with the current ways to use attributes and their implementation,
I did not know much about the history of how they were added to the language.
I also enjoyed the discussion of the
[Crell/AttributeUtils package][lib-attribs], and expect to look through that
userland library for ideas of things to have built-in to PHP.

## Saturday

Thursday kicked off with another keynote,
[Turtles all the way down][talk-turtles]. When I first saw the name of the talk,
I was reminded of [a Reddit post][reddit-turtles] about having excessive levels
of inheritance. But, it didn't seem like that was going to be the focus of the
talk until the third part, when the origin of the "Turtles all the way down"
saying was discussed. While the history was fascinating, and the talk was great
overall, I found the creating of an HTTP request handler directly in C to be
the most interesting part, and plan to try and experiment with something like
that myself.

Next up was a [discussion of decoupled tests][talk-decoupled], where I learned
a way to quantify the value of tests: the cost of the bugs found by the tests,
minus the cost of developing the tests, plus the benefits of a more adaptable
codebase. Tests that are too tightly coupled with the system under test are
less valuable, because the codebase is then not as adaptable, but of course
there needs to be some coupling, or otherwise the tests would be entirely
unrelated to the code!

Before lunch, I attended [a talk about PIE][talk-pie], the new installer for
PHP extensions. I haven't actually tested it out much, but I have read the
documentation (and even contributed a few typo fixes) and have been meaning to
add support for PIE to my [CustomCast extension][ext-customcast]. Perhaps
once PHP 8.5 is fully released I'll have a chance to resume work on CustomCast.

After lunch was a second keynote of the day,
[Work Smarter: Code Like a Musician][talk-musician]. It was fascinating to hear
how Cori applied lessons from a music career to writing code. Unfortunately,
I wasn't able to fully focus on this talk, because my own talk was going to be
right after it. I definitely plan to rewatch this talk when I have a chance to
look at the recordings.

I then presented my own talk, about new features in PHP 8.5, which I discuss
more later on.

After my talk, I attended [A Field Guide to PHProperties][talk-phpproperties],
which focused on making the most of the new PHP 8.4 features for properties,
including property hooks, interface properties, and asymmetric visibility.
The message makes sense, if you only code in PHP 8.4+. However, given how many
languages I commonly write code in, and the fact that the code I write for work
generally doesn't run on PHP 8.4, the majority of code that I write will not be
able to make use of the PHP 8.4 features that the talk focused on. The new
features are great, but using them would mean not supporting any previous
version of PHP.

Next up was another round of open spaces, and a final round of talks. I had
planned to attend [Creating Developer Friendly Projects][talk-friendly], but
unfortunately I was starting to feel burnt out. I opted to skip the last
round of talks, and will make sure I watch the recordings that were made. I
wanted to make sure I was able to pay attention at the final keynote, which I
expected to be the most engaging.

The final keynote, [Saving Open Source][talk-saving], was engaging throughout,
at different points funny, somber, optimistic, and relatable. I found the
discussion of lice fatigue especially entertaining - when it comes to posting
code in GitHub without bothering to include a license, I have done that myself
(e.g. for the repository with the code for my website). The discussion of the
[DBAD license][license-dbad] and the [ABRMS license][license-abrms] was
especially funny; the only other funny license I had previously come across was
the [WTFPL license][license-wtfpl]. I was also particularly struck by the
discussion of why people contribute to open source projects, and the idea of
people asking others for ideas of open source packages to build - which is
basically what I did yesterday when asking for feature requests for the
reflection extension. I came away from this keynote with a list of a few books
to read, and a number of ideas to ponder.

## My talk

My talk, presented on Saturday afternoon, covered what was new in PHP 8.5.
My talk started off fairly well - I knew the material, and began with a
discussion of the deprecations that are a part of PHP 8.5. However, I ended up
spending too long going over the details of the various deprecations, their
background, equivalent replacements or workarounds, and other migration
strategies for upgrading codebases to avoid the deprecation warnings. As a
result, I ended up running out of time - when I got to the actual discussion
of the new features, I was already running through the slides much faster than
I would have liked, and for the last few slides, when I was going to discuss the
biggest new features (expanded constant syntax, the new uri extension, clone()
with, and the pipe operator) I only had enough time for a few sentences on each
of those topics. You can see a copy of the slides for my talk [here][slides],
I had 52 slides to try and get through!

As I noted earlier, two of my talks were accepted for the ConFoo conference in
February; one of them was this talk about PHP 8.5. For ConFoo my understanding
is that I will have 45 minutes to present rather than 50, so I need to get
through the deprecations faster - really, 30 seconds per slide for the most
part, given that the details are fairly straightforward and can be automated
(migration or just analysis to find them) with the tools listed. I also might
want to cut out a few of the slides/discussions so that I can have more time
to spend on the features. I definitely need to change the order of the talk and
start with the features rather than ending with them, both because the features
are the bigger part of the new version (deprecations are not exceptions and can
be suppressed). Maybe I'll just reverse the order of the slides (except the
title slide and the thank you slide, those still need to go first/last
respectively).

One thing that works in my favor is that at ConFoo, PHP 8.5 will already have
been released to general availability. Thus, I won't need to spend time
encouraging people to test release candidates and report bugs before the
GA release, nor will I need to cover the details of changes made between the
different release candidates. That should help me save a few minutes.

After I got home from the conference, and while working on this blog post, I
was reminded that at the speakers' dinner I had tentatively agreed to present
this same PHP 8.5 talk for [MergePHP][mergephp], a monthly online PHP meetup.
I confirmed that I was available to give the talk at the next meetup on
November 13; I was told the talk should be between 45 and 60 minutes. Thus,
MergePHP will give me a chance to present my talk again, applying some of the
changes I need for ConFoo but hopefully without needing to cut down the material
too much. I'll post a retrospective about that experience in a few weeks.

## Final thoughts

I am definitely glad that I attended this conference, and am thankful to the
organizers for allowing me to speak. Austin was the site of my first
professional conference, [EMWCon Spring 2023][emwcon-2023], which I attended on
behalf of my employer. It seems oddly fitting that it was also the site of the
first professional conference I attended and spoke at that was unrelated to my
job. I look forward to hopefully returning for Longhorn 2026.

[tutorial-rust]: https://longhornphp.com/sessions#observing-php-for-fun-and-profit
[tutorial-wcag]: https://longhornphp.com/sessions#how-to-run-an-accessibility-wcag-audit-step-by-step-for-beginners
[thesis-interface]: ./../files/Thesis/Simulator.html
[blog-syntax-highlight]: ./20250718-pygments-highlighting
[commit-contrast]: https://github.com/DanielEScherzer/website-content/commit/343e4872a19516d874255a4e249d7b3fb0bf4426
[podcast-episode]: https://www.phparch.com/podcast/community-corner-php-8-5-release-manager-daniel-scherzer/
[talk-laws]: https://longhornphp.com/sessions#the-immutable-laws-of-software-and-life-code-accordingly
[wp-cunningham-law]: http://en.wikipedia.org/wiki/Cunningham's%20Law
[mwcon-spring-2024]: https://www.mediawiki.org/wiki/MediaWiki_Users_and_Developers_Conference_Spring_2024
[confoo]: https://confoo.ca/en/2026
[talk-api-spec]: https://longhornphp.com/sessions#defining-an-api-specification-a-step-by-step-guide
[mw-rest-api]: https://www.mediawiki.org/wiki/API:REST_API
[mw-action-api]: https://www.mediawiki.org/wiki/API:Action_API
[talk-db-testing]: https://longhornphp.com/sessions#better-database-testing-with-phpunit
[lib-db-testing]: https://github.com/cspray/database-testing
[talk-monolith]: https://longhornphp.com/sessions#love-your-monolith
[talk-ddev]: https://longhornphp.com/sessions#local-development-made-easy-with-ddev
[issue-reflection-reqs]: https://github.com/DanielEScherzer/website-content/issues/49
[talk-git]: https://longhornphp.com/sessions#git-as-game-logic-what-video-games-can-teach-us-about-version-control
[git-rerere]: https://git-scm.com/book/en/v2/Git-Tools-Rerere
[talk-attributes]: https://longhornphp.com/sessions#php-attributes-lets-get-meta
[lib-attribs]: https://packagist.org/packages/Crell/AttributeUtils
[talk-turtles]: https://longhornphp.com/sessions#turtles-all-the-way-down
[reddit-turtles]: https://www.reddit.com/r/ProgrammerHumor/comments/1bya392/whywouldtheyrewardthis/
[talk-decoupled]: https://longhornphp.com/sessions#asserttrueisdecoupledmy-tests
[talk-pie]: https://longhornphp.com/sessions#a-slice-of-pie-revolutionising-php-extension-installation
[ext-customcast]: https://github.com/DanielEScherzer/CustomCast
[talk-musician]: https://longhornphp.com/sessions#work-smarter-code-like-a-musician
[talk-phpproperties]: https://longhornphp.com/sessions#a-field-guide-to-phproperties
[talk-friendly]: https://longhornphp.com/sessions#creating-developer-friendly-projects
[talk-saving]: https://longhornphp.com/sessions#saving-open-source
[license-dbad]: https://dbad-license.org/
[license-abrms]: https://www.reddit.com/r/ProgrammerHumor/comments/8ebl4b/the_anyone_but_richard_m_stallman_license/
[license-wtfpl]: https://www.wtfpl.net/
[slides]: ./../files/20251025%20Longhorn%20PHP%20presentation.pdf
[mergephp]: https://www.mergephp.com/
[emwcon-2023]: https://www.mediawiki.org/wiki/EMWCon_Spring_2023
