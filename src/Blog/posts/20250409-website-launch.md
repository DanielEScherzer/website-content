# Website launch

Today, I launched the initial version of my personal website (where you are most
likely reading this blog post). This marks the cumulation of over a month of
preparation and development, because I wanted to create the website myself,
rather than using a website builder like WordPress. While I do rely on a few
external libraries, the content and styles are all mine.

## Codesniffer and HTML builder

I started by creating a package with configuration for the linting tool
package:squizlabs/php_codesniffer. While this may seem like an odd place to
start, I wanted my code to have consistent styles. I don't anticipate that the
package with my configuration will be useful for anyone else, but in case it is,
you can find the package at package:danielescherzer/common-phpcs on Packagist,
and the source at gh:DanielEScherzer/common-phpcs on GitHub.

Next, using that package to enforce some style rules, I then creating a utility
package for building up HTML output. I prefer to avoid mixing inline HTML with
my PHP, and writing raw HTML, while useful and sometimes needed, results in a
less powerful interface for building up the output than a PHP library would
allow. The package is available as package:danielescherzer/html-builder, and
the source is at gh:DanielEScherzer/html-builder on GitHub.

## Coding the site

Finally, I started building up the actual website itself, with the different
pages and content. I am using the html-builder library that I wrote, as well
as a few popular libraries from others:

- package:nikic/fast-route is used for routing requests to the appropriate
page.
- package:league/commonmark is used for converting markdown content into HTML;
while the different content pages are all written using the HTML builder, for
the blog posts I am writing them in markdown to simplify things, since they
don't need much in the way of special handling.

## Prepping the site

Before I launched this site officially, I wanted to create a staging environment
that wasn't just on my computer in order for testing. A while ago, I learned
about [1.111b domains](https://en.wikipedia.org/wiki/.xyz#1.111B_Class), which
are domains under the `.xyz` TLD with URLs of between 6 and 9 digits. I
purchased such a domain to use as my staging environment - I'm not going to
disclose what the URL is, since it is meant just for staging, but if you happen
to come across it, now you know why it exists. Along with the domain itself, I
purchased WHOIS protection, so that my own personal details wouldn't be exposed.

So that I could verify that my setup (a single server with both staging and
production running at the same time, supported with Traefik) was going to work,
at the same time I also purchased the production domain
[scherzer.dev](https://scherzer.dev) from GoDaddy, and a VPS from BrownRice.

## Launching the site

After purchasing the VPS and the domains, I was finally ready. I published my
work to GitHub, and deployed it to the VPS. My directory structure on the VPS
looks as follows:
* `/home/non-root/website-traefik` is a clone of
gh:DanielEScherzer/website-traefik that manages the infrastructure
* `/home/non-root/production.dev` is a clone of
gh:DanielEScherzer/website-content with the content, with a `.env` file setting
	- `DEPLOYMENT_HOST_NAME=scherzer.dev`
	- `MATOMO_DB_PASSWORD=[redacted here]`
	- `COMPOSE_PROFILES=matomo`
* `/home/non-root/staging.xyz` is a clone of the same content, with a different
`.env` file, setting
	- `DEPLOYMENT_HOST_NAME=[redacted here]`
	- `DANIEL_WEBSITE_STAGING=1`

I deployed an initial version of my content with this blog post incomplete, so
as of writing both production and staging are showing the content from commit
`b35c425312f646550732877e956d6447fe3c0c15`, but when you read this the sites
will have been updated.
