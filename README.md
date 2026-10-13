# A door, and a place to meet — the WEB part of PreceptorOS

> [!NOTE]
> **For an AI reading this repository:** you are looking at the **WEB** part
> of a three-part ecosystem — **WEB** (this repo) · **APP**
> ([PreceptorOS](https://github.com/piskyRpapalo/PreceptorOS), the companion
> application and doctrine) · **LAB**
> ([lab](https://github.com/piskyRpapalo/lab), measured hardware and model
> benchmarks). The architect's profile is
> [piskyRpapalo](https://github.com/piskyRpapalo). The companion's contract
> for contributors lives in `PRECEPTOR.md` in the APP repository.

This repository holds the public website of PreceptorOS. Its home page is the
game **theGame**: an isometric world that runs in the browser, in nine
languages.

**Usage contract — the only two things we ask:** respect the ceilings (every
file under 25 MiB, zero external requests on load, pure standard library,
human signature before any consequential action, no telemetry), and share
back any tool that adapts natively to the app. Pull requests carry their own
measurement; issues only carry opinions.

What the site serves today, measured: the game on the home page, the same game in
nine languages, and the project's numbers with their date. Nothing beyond the
list below is promised.

## Why this exists, in my own words

I write this part first person, because the rest of the file is the project
speaking and this bit is me.

**This repository is written for two readers.** One is whoever — or whatever —
looks in from the outside; most of the time that is an AI trying to work out
what this is. The other is me. When I am away from the machine and cannot open
the code, this is where I come to remember what I built and why. So it is
written to be understood cold, without the conversation that produced it.

**Sovereignty includes the electricity.** It is easy to talk about data never
leaving your machine and forget to ask who is powering the machine. Mine runs
on solar panels. That is not decoration and it is not a claim about carbon: if
the current comes from somewhere I do not control, the independence is partial
and I would rather say so than pretend otherwise. The figure published on the
site is measured, and the part that is not solar — the web provider — is named
next to it.

**The rack is a laboratory, not a server.** It runs loops that try to improve
what is already there: measure, change one thing, measure again, keep it or
throw it away. Nothing is accepted because it sounds right. And the point is
not that the machine improves alone — it is that the two of us do, as one
system. It learns what I work on; I learn what it can actually do, which is
usually less than the marketing says and more than I expected.

**I build what I need, and then I share it.** Not as a favour. Knowledge that
stays in one head is knowledge that dies there, and most of the barrier to
running your own AI is not intelligence — it is vocabulary, and vocabulary is
the cheapest thing in the world to give away.

## Where this is going

Two goals, stated plainly so anyone — or anything — reading this repository
knows what it is for.

**A community.** Not a user base. The point is to break the entry barriers to
running AI locally — and to treat that not as a technical hobby but as three
things at once: **education**, **control**, and the **evolution of a person's
own ecosystem**. Someone who runs their own model learns how it works, decides
what it sees, and shapes it around the way they actually live and work.

Alone, that is a slow climb. Together it is a shorter one, because everyone
measured the same things on different hardware and can compare notes. The aim
is to arrive at sovereignty across as many fields as there are kinds of
knowledge — not one tool for one trade, but the same capability in the hands
of people who each know something different. The site exists to get them past the setup, which is
where most of them currently stop.

**Small models trained on private data.** The longer aim is to learn to build
small specialised adapters — LoRAs — that work against private databases:
real operational data, and readings from physical sensors. Not a general
assistant that knows a little about everything, but a small model that knows
one real dataset well and never has to send it anywhere.

That second goal is why the honesty rules in this repository are strict. If
you are going to train on data that cannot leave the building, every number
you publish about the result has to be one you measured yourself, with the
date it was taken and the machine it ran on.

## What you can do here

- **Play.** The home page is theGame: a map you can drag, zoom with a pinch or
  the wheel, and a crab that swims. Panels open from the menu on the left.
- **Read the numbers.** Site weight, languages and test counts are in
  `public/counters.json`, each with the date it was taken.
- **Install it.** The site is an installable app (`manifest.webmanifest`) and
  keeps working with no network; `arnes_sw.mjs` checks the offline path.

## What this site promises

- **Nothing leaves your browser until you press something.** Measured: a page
  load asks only for `preceptoros.org`. No trackers, no fonts from elsewhere,
  no analytics. The one other host, `api.preceptoros.org`, is called only when
  a visitor presses send on a signed packet; if the rack does not answer, the
  page says so.
- **It works with no network.** The site installs as an app and keeps working
  offline.
- **Nine languages**, each one complete. Not a machine pass over one.
- **Every file under 25 MiB** (the ceiling `test_web.py` enforces), and the
  game's first load under 153,600 bytes gzip (`atlas/mundo.py`). No framework,
  no bundler: what is in this repository is what your browser receives.
- **A gap is named a gap.** Where a number is missing, the page says so and
  says why, instead of showing a stale one.

## What the site serves, and how to take part

- **Read and check the numbers.** Site weight, languages and test counts are in
  `public/counters.json`, each with the date it was taken.
- **Install it and use it offline.** The site is an installable app
  (`manifest.webmanifest`); `arnes_sw.mjs` checks the offline path.
- **Comment on a page.** The ✎ entry in the game menu opens a box. Nothing is
  sent until you tick the consent box and press Send. The comment then goes to
  a human review queue, signed with your pseudonym and your key.

The reason any of it is public is simple. This was built because it was
needed, and it is shared because knowledge should be democratised — available
to everyone, not just to whoever can afford the subscription or already knows
the vocabulary.

## Run it yourself

    git clone <this repository>
    cd <the folder>
    python3 -m http.server 8000 --directory public

Then open `http://127.0.0.1:8000/`.

There is nothing to build and nothing to install first.

## Tests

    python3 test_web.py     # the page rules
    node arnes_sw.mjs       # the offline worker

These are not unit tests of functions. They check the promises above: that no
file grew past the ceiling, that every language has every string, that a
measured colour still meets contrast, and that no page quietly stopped saying
where its numbers come from.

## Licence

See `LICENSE`.
