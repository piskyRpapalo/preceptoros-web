# Diagnostic · the frozen map (R-INVESTIGATION) · 2026-10-25

Status: **PROPOSAL · REQUIRES_FIRMA**. Diagnosis plus one rule. Nothing here was
deployed, merged or changed on Cloudflare. Every number below was measured on
2026-10-25 from `gh run list`, `git log` on a fresh `origin/main` (`91e4858`) and
`curl` against `www.preceptoros.org`; what could not be measured is `NO_DATA` with
its cause.

## Verdict

The Sovereign saw the same map for about two weeks because **main moved and the
light did not reach the origin**: there was no recorded deploy between the web
becoming game-only (2026-10-11) and 2026-10-23. Today the origin is fresh and the
edge revalidates every request. What remains is a **client layer**: the service
worker answers from its cache first and refreshes behind, so a change that keeps
the same `VERSION` reaches a returning visitor one visit late per route, mixed
with older modules. On main, 52 of the 177 `public/` commits since 2026-10-11
did exactly that. The rule below makes it impossible to merge.

## L1 · dark-window table

### Deploys

| When (UTC) | Source | Result |
|---|---|---|
| before 2026-10-23 | `NO_DATA` · cause: no deploy workflow existed and no deploy log is versioned; the Cloudflare dashboard is out of scope | — |
| 2026-10-23 12:41 | `manual-worker-deploy` run #1 (born that day) | failure |
| 2026-10-23 19:26 | manual Wrangler deploy from the rack (local Wrangler log: "Uploaded preceptoros-web") | uploaded; source tree `NO_DATA` (the log does not name a commit) |
| 2026-10-24 13:31–13:51 | `manual-worker-deploy` ×4 | failure ×4 (credential setup, see `DEPLOY.md`) |
| 2026-10-24 13:56 | `manual-worker-deploy` 40100263650 | **first green** |
| 2026-10-24 21:02 | `manual-worker-deploy` | success |
| 2026-10-25 07:00 → 16:45 | `manual-worker-deploy` ×9 (last: 40213169128) | success ×9 |

Totals: 16 workflow runs, 5 red, 11 green, all `workflow_dispatch` on `main`.

### Faro (served vs main, byte for byte)

Born 2026-10-19 22:37 from a measured drift of 16 routes. 141 runs, first green
**2026-10-24 23:18**.

| Day | red | green |
|---|---|---|
| 10-19 | 3 | 0 |
| 10-20 | 11 | 0 |
| 10-21 | 22 (+1 cancelled) | 0 |
| 10-22 | 20 | 0 |
| 10-23 | 28 | 0 |
| 10-24 | 34 | 2 |
| 10-25 | 7 | 13 |

Two readings of the red are measured, not guessed: (1) since 10-25 every push to
main that touches `public/` turns the faro red and the next manual deploy turns
it green — **red-on-push is structural while deploys stay manual**; (2) between
10-24 13:56 and 23:17 the faro stayed red after a green deploy; `DEPLOY.md`
records the cause class (a non-EU runner saw +367 B on HTML routes while a
residential reading was green).

### What sat on main without a recorded deploy

Window start = 2026-10-11 00:00 UTC (the web became game-only in `84621c2`,
merged as `5b82c31`, 02:29 UTC). Counts of commits on `origin/main` touching
`public/`:

| Window | all | non-merge | first-parent |
|---|---|---|---|
| 10-11 00:00 → 10-23 19:26 (rack deploy) | 277 | 252 | 166 |
| 10-11 00:00 → 10-24 13:56 (first green workflow) | 282 | 257 | 170 |

Tree difference under `public/` from main at 10-11 (`98ecece`) to main at the
first green deploy (`c48658a`): 556 files, +13,211 / −40,149 lines; 46 of those
paths carry map names (sea, map, fog, world, coral, node, crab, rift). The last
deploy before the window is `NO_DATA` (cause above), so "unserved" means
"not served by any recorded deploy".

## L2 · edge sweep

All routes over HTTP/2, 2026-10-25, against main `91e4858`.

| Route | Status | cf-cache-status | cache-control | etag | body = main |
|---|---|---|---|---|---|
| `/` | 200 | HIT | `public, max-age=0, must-revalidate` | — | equal |
| `/sw.js` | 200 | HIT | same | yes | equal (`VERSION abjd`) |
| `/sw-listas.js` | 200 | HIT | same | yes | equal |
| `/game/sea.js` | 200 | HIT | same | yes | equal |
| `/assets/thegame.js` | 200 | HIT | same | yes | equal |
| `/assets/atlas-mapa.css` | 200 | HIT | same | yes | — |
| `/atlas-en.json` | 200 | HIT | same | yes | equal |
| `/counters.json` | 200 | HIT | same | yes | equal |
| `/manifest.webmanifest` | 200 | HIT | same | yes | — |
| `/face/` | 200 | HIT | same | — | equal |
| `/face/basic.html` | **307** → `/face/basic` | — | — | — | — |
| `/game/thegame.js` | 404 | — | — | — | absent on main (the file is `/assets/thegame.js`) |

- No route sends `age` or `last-modified`; revalidation is by `etag`. A
  conditional `GET /sw.js` with `If-None-Match` returns **304**.
- `max-age=0, must-revalidate` on every class: the browser revalidates every
  request. **No long-TTL rule from the Pages era is visible from the edge.**
  Dashboard-only rules stay `NO_DATA` (dashboard out of scope).
- `/face/basic.html` redirects to the extensionless path (Workers asset HTML
  handling). The hub links the `.html` form, so each click costs one 307.
- The apex `https://preceptoros.org/` also answers 200; it does not redirect to
  `www`. Two origins serve the same site (this matters for CORS; see
  `docs/route-map-web-gateway.md`).

## The client layer (read from `public/sw.js` on main)

- **Navigations** (`navegacion`) answer from cache `shell-<VERSION>` and refresh
  that entry behind. **Every other same-origin GET** (`estatico`) answers from
  `obra-<VERSION>` and refreshes behind. `.json` outside `CONTENIDO_JSON` passes
  straight to the network; `RED_PRIMERO` (`/manifest.webmanifest`) is
  network-first.
- So without a `VERSION` change a returning visitor **does** converge, but one
  visit late **per route**, and a lazy module (Army, Arena) stays old until its
  own second load after the deploy. One page can run new HTML with old modules.
- A `VERSION` change renames both caches; `activate` deletes the old ones and
  `clients.claim()` takes over; the next request of every module goes to the
  network. **The bump is the atomic rebuild.** The abjc → abjd seal of web#319
  (deployed 16:45) is that rebuild for today's phones.
- Correction to the brief: web#320 kept `abjc` but changed only
  `atlas-mundo.json`, `counters.json`, `mcp-manifest.json` and `release.json`,
  all network passthrough. That PR froze nothing. The face work did: web#307,
  #310, #311, #314 and #315 changed cached modules under `abjc`.
- Finding, not fixed here: the install step precaches the whole `HUB` into
  `shell-<VERSION>`, but `estatico` only reads `obra-<VERSION>`, so precached
  subresources are never answered from the shell cache. Out of this piece's
  scope; noted for a separate review.
- Unmeasured: an installed app resumed from the background does not navigate,
  so it may not check for a new service worker until a reload. `NO_DATA` ·
  cause: the phone test (L3) is the Sovereign's hands.

## L3 · phone test (Sovereign)

Clear site data once, or open a private tab, then load the map. Pending; record
his result here when reported.

## L4 · the rule

**Every change that alters a file the service worker caches ships, in the same
PR, with a new `VERSION` in `public/sw.js`.**

Why the existing seal did not catch it: `test_web` checks that `VERSION` and the
huella agree **inside one tree**. Nothing compared `VERSION` with the base, and
the documented `sellar.py --sellar --version <the same>` lets a PR re-seal the
huella and keep the old `VERSION`.

The gate (`atlas/version_sw_gate.mjs`, wired into `.github/workflows/gate.yml`
before the full battery, `fetch-depth: 2`):

- Diffs `HEAD^1..HEAD`: on a PR merge ref that is exactly the PR's effect on
  main; on a push to main, the new commit. Locally:
  `node atlas/version_sw_gate.mjs --base origin/main`.
- "Cached" follows the same rule as `sw.js`, reading `CONTENIDO_JSON` and
  `RED_PRIMERO` from the served `sw-listas.js`, so the gate cannot drift from the
  worker. Measurement-only commits (passthrough JSON) need no bump, which keeps
  the rule honest instead of noisy.
- Failure message names each blocking path, the outage, the cure
  (`python3 bin/sellar.py --sellar`, then the seal chain) and the exception.
- Exception path: a line **added in the same diff** to
  `config/sw-version-waivers.txt`, `public/<exact path> | YYYY-MM-DD | reason`.
  A waiver already present at the base never counts, so it cannot leak into a
  later PR.
- Evidence: `atlas/version_sw_casos.mjs`, 10 cases from measured fixtures
  (web#311 red, web#320 green, waiver scope and expiry). Shown red first with
  `VERSION_SW_SABOTAGE=1`. Replayed through the CLI on the real merges: web#311
  RED (`public/face/face_tutorial.js`), web#320 GREEN. Over main's first-parent
  history since 10-11, 52 of 177 `public/` commits would have been red.

The stricter reading ("any `public/` path") would have flagged 58; the 6
extra are passthrough-only measurement commits that cannot freeze anything.
Switching to the strict reading is one line in `cached()`.
