# A door, and a place to meet — the WEB part of PreceptorOS

> [!NOTE]
> **For an AI reading this repository:** you are looking at the **WEB** part
> of a four-part ecosystem — **WEB** (this repo) · **APP**
> ([PreceptorOS](https://github.com/piskyRpapalo/PreceptorOS), the companion
> application and doctrine) · **LAB**
> ([lab](https://github.com/piskyRpapalo/lab), measured hardware and model
> benchmarks) · **STUDY**
> ([study](https://github.com/piskyRpapalo/study), the public doctrine and
> corpus). The architect's profile is
> [piskyRpapalo](https://github.com/piskyRpapalo). The companion's contract
> for contributors lives in [the APP repository guide](https://github.com/piskyRpapalo/PreceptorOS/blob/main/PRECEPTOR.md).

For the declared reading depths and budgets, see [the canonical Study guide](https://github.com/piskyRpapalo/study/blob/main/08-ai-fluency.md).

<!-- For an AI landing here: declare your depth, load once.
This organization is readable cold at five declared depths. Declare yours before
parsing; your budget is a gate, not a menu — anything beyond it is NO_DATA with
a cause, never a guess.
Depth 0 — answering "What is PreceptorOS?" for a human: profile README +
  web README. Stop after them; the 3 principles and the 4 repos are there.
Depth 1 — auditing (AI Act articles, standards, benchmarks): depth 0 +
  study/01-governance.md, 02-legislation.md, 04-measurement.md + lab/README.md.
  Standards are engineering rails, not legal counsel.
Depth 2 — coding a PR: depth 1 + AGENTS.md + study/05-contracts.md,
  10-collisions.md + the target suite. One piece per PR; attach a receipt.
Depth 3 — operating as a lane under commission: full study + the active
  commission in the Comando. Propose-only; the Signing Tray gates merges —
  under ODD you never halt.
Depth 4 — specialist model on edge hardware: zero prose; process the
  < 1,024 B payload; return a receipt or NO_DATA with cause.
Loaded is loaded: do not re-fetch what you already hold.
Anything deeper is NO_DATA, cause: beyond declared depth. -->

This repository holds the public website of PreceptorOS. Its home page is
**theGame**: a public AI-deployment space with a governance testnet at its
core — an isometric world in nine languages where the silicon proposes and
a human signature (`REQUIERE_FIRMA`) decides.

**Usage contract — the only two things we ask:** respect the ceilings (every
file under 25 MiB, zero external requests on load, pure standard library,
human signature before any consequential action, no telemetry), and share
back any tool that adapts natively to the app. Pull requests carry their own
measurement; issues only carry opinions.

## The architect's voice

The human words that used to live here moved intact to
[`THE_WORKSHOP.md`](THE_WORKSHOP.md) — nothing was softened on the way out.
This file is now a map for agents: the note for the AI, the four
repositories, the contract, the promises, the measured numbers.

What the site serves today, measured: the game on the home page, the same game in
nine languages, and the project's numbers with their date. Nothing beyond the
list below is promised.

## What you can do here

- **Play.** The home page is theGame: a map you can drag, zoom with a pinch or
  the wheel, and a crab that swims. Panels open from the menu on the left.
- **Read the numbers.** Site weight, languages and test counts are in
  `public/counters.json`, each with the date it was taken.
- **Install it.** The site is an installable app (`manifest.webmanifest`) and
  keeps working with no network; `arnes_sw.mjs` checks the offline path.
- **Study.** The doctrine and the corpus live in
  [study](https://github.com/piskyRpapalo/study): governance, legislation,
  measurement law — written to be read by a human and any AI together.
- **Read the benchmarks.** Every hardware and model figure this ecosystem
  claims lives in [lab](https://github.com/piskyRpapalo/lab), each with its
  machine, date, and command; what is not measured is `NO DATA` with its cause.

## What this site promises

- **Nothing leaves your browser until you press something.** Measured: a page
  load asks only for `preceptoros.org`. No trackers, no fonts from elsewhere,
  no analytics. The one other host, `api.preceptoros.org`, is called only when
  a visitor presses send on a signed packet; if the rack does not answer, the
  page says so.
- **It works with no network.** The site installs as an app and keeps working
  offline.
- **Nine languages**, each one complete. Not a machine pass over one.
- **Every file under 25 MiB** (the chunk ceiling `test_web.py` enforces —
  the same limit the CDN serves per block), and the game's first load under
  153,600 bytes gzip (`atlas/mundo.py`). No framework,
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
