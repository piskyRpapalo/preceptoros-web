# A door, and a place to meet

This repository holds a small public website. It has one job: to lower the
wall between a person and their own AI.

Most people who want to run AI on their own machine stop at the same place.
Not at the idea — at the setup. A page of commands, three words they have
never seen, and a download that may or may not be the right one. The wall is
not intelligence. It is vocabulary.

So this site is a guide first and a showcase second. You arrive, you talk to
it, and it walks you through the steps for the machine you actually have.
When the steps are done, you no longer need this site.

The second job is slower: to gather the people who made it through. A tool
you run alone teaches you one thing. A hundred people running it teach each
other.

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

![Asking about installation](docs/img/chat.webp)

## What you can do here

- **Ask.** A chat panel answers with a model served from a home rack. Choose
  who you talk to: each helper is tuned for one job.
- **Install.** A page that gives you the steps, the download, and the list of
  models — including the smallest one that fits an 8 GB phone.
- **Read the numbers.** Speed, file sizes and test counts are published as
  measurements, with the date they were taken.

![Choosing a language](docs/img/puerta.webp)

## What this site promises

- **Nothing leaves your browser until you press something.** Zero external
  requests on load. No trackers, no fonts pulled from elsewhere, no analytics.
- **It works with no network.** The site installs as an app and keeps working
  offline.
- **Eight languages**, each one complete. Not a machine pass over one.
- **Every file under 16 KB.** No build step, no framework, no bundle. What is
  in this repository is what your browser receives.
- **A gap is named a gap.** Where a number is missing, the page says so and
  says why, instead of showing a stale one.

![Install](docs/img/install.webp)

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

![On a phone](docs/img/phone.webp)

## Licence

See `LICENSE`.
