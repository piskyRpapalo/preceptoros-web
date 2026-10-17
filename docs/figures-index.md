# Figures index · one home for every public number

Rule of the house: when a historical receipt and this index disagree, this
index wins until the figure is re-measured. Receipts are records of their day
and are never edited. Every row says what the number counts, how it is
measured, when, and where the reading lives. A number that cannot name its row
is not a published figure.

| Figure | What it counts | Measured by | Date | Where the reading lives |
|---|---|---|---|---|
| 78 web tests | doctrine suite of the WEB, total | python3 test_web.py | 2026-10-16 | PR #139; public/atlas-mundo.json (pruebas_web) |
| 77 passing, 1 skipped | outcome of that suite on the current tree | python3 test_web.py | 2026-10-16 | PR #139; llms.txt cites this index |
| 130 passing, 5 skipped | Node suite of the guardian files (tests/) | node --test tests/ (yardstick; the receipt names the suite, not the command) | 2026-10-16 | PR #139 |
| 24/24 | directed sabotage vectors of the signature verifier (piece 2) | directed vector run, both yardstick passes | 2026-10-16 | PR #139 |
| 181/181 | atlas suite | python3 atlas/test_atlas.py | 2026-10-16 | PR #139 |
| 22/22 | service-worker harness | node arnes_sw.mjs | 2026-10-16 | public/atlas-mundo.json (arnes_sw) |
| 0 external requests on load | resource entries of the served home page | instrumented load of the served page; guarded by test_web.py | 2026-10-16 | the served page; llms.txt |
| 91,528 B | game weight gzipped, against the 153,600 B door | atlas/mundo.py on the current tree | 2026-10-16T21:37Z | public/atlas-mundo.json (gzip_juego_b); daily vigia |
| 9 languages | served translations, discovered from disk | test_web.py and sitemap.py discovery | 2026-10-16 | public/ language folders; public/atlas-mundo.json (lenguas) |
| 43 | HEXELION Star entries (A1-D45) | line count of the Star annex | 2026-10-16 | llms.txt; guarded by tests/citations.test.mjs |
| 25 MiB per block | size ceiling of a synthetic block (the byte-per-file ceiling was revoked) | signed exception in EXCEPCIONES.md only | 2026-10-11 | test_web.py; public/atlas-mundo.json (techo_bloque_b) |

The Node suite (tests/) is not wired into CI as a whole; it runs in the
yardstick. This PR wires its citations guardian into gate, phase and the daily
vigia. Wiring the full suite is a decision that belongs to the architect.

## Figures that live in other houses

- Site weight: 1,265,842 B — rack session on the current tree, 2026-10-16.
  Home: the LAB counters, which still carry 1,173,937 B (sealed at abgf,
  2026-10-13). Republishing belongs to the LAB.
- Downloads payload: 5,741 B — same rack session, 2026-10-16. Home: the LAB
  counters, same row as site weight.
- App suite: 926 — measured on the rack by the architect, 2026-10-16. Home:
  the APP state card, which still reads NO_DATA. Republishing belongs to the
  APP.
- The LAB and APP state cards still publish their 2026-10-12 readings (web
  tests 75, site weight 1,096,576 B). Stale counters are retired where they
  live, never refreshed from here.

## Legend

Two suites showing the same count are different suites; the command column is
the only legend that separates them. A count of receipts is a count of written
records, not a test run. A figure with a date is true of that date and lives
until re-measured.
