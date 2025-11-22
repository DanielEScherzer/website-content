---
title: Unplanned Downtime, November 2025
extensions:
  footnotes: true
---

# Unplanned Downtime, November 2025

Last week, I had some unexpected downtime for my website. The original cause was
a power issue at the physical server, and out of my control, but an oversight of
mine made the situation worse.

## The Outage

In the evening (Mountain Time[^1]) of Monday, November 17th, my hosting provider,
Brownrice, suffered a temporary outage due to power supplies failures for the
server that contains my VPS. Brownrice reports that the outage was between 17:30
and 18:00, but I suspect that was the outage for any of their customers. Based
on my server logs, my server was back up at 17:47.

Once the server was online, the tool I use for managing web requests,
[Traefik][traefik], restarted automatically based on the
[configuration for the docker containers][traefik-restart]. The client websites
that I host, which run on WordPress, also restarted automatically thanks to the
[same configuration][wordpress-restart]. However, I forgot to apply that
configuration to my own website!

From 17:51, when the first request was made to my website and failed, until
18:21 when I manually restarted the web containers for my staging and production
sites, the downtime was entirely avoidable.

## Mitigation

I got lucky that I noticed the downtime when I did, since I have no automated
monitoring set up. The first thing I did was to manually restart the docker
containers for my website. At 18:21, the downtime was over.

Later that same day, I [merged a change][patch-56] to ensure that moving
forward, the docker containers would restart if they stopped unexpectedly. If
the entire server goes down and restarts, that change should bring my website
back up as soon as possible.

## Next Steps

I've started looking into monitoring options, to be able to learn about outages
earlier. While I would generally prefer to self-host the tool used, if I put the
monitoring on the same server as the website then the server being down would
also bring the monitoring down. Self-hosting isn't an option.

There are a variety of companies that offer monitoring services, but I don't
need a whole bunch of fancy features, and would rather not need to pay for the
monitoring - most offers I saw cost more than what I pay to rent the server!

I'll try to find a free tool for monitoring my website status, but if that
doesn't work I guess I can just leave it unmonitored. This is a personal site,
not a client site, and uptime is best-effort.

[^1]: The server is hosted in Nevada. All times in this blog post are in
Mountain Time.

[traefik]: https://traefik.io/
[traefik-restart]: https://github.com/DanielEScherzer/website-traefik/blob/ea50b0520edc6d0aa8ab33442945ab8e2d88b408/docker-compose.yml#L4
[wordpress-restart]: https://github.com/DanielEScherzer/wordpress-site/blob/e27bdb23be09e06bd78de5ba87fc3834ab6ab8df/docker-compose.yml#L28
[patch-56]: https://github.com/DanielEScherzer/website-content/commit/bdc2324414ab47d2b6b1c0f6510c12d00fac8de5