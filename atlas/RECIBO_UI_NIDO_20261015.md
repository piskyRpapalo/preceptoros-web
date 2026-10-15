# RECEIPT · Incubator panel and buttons · 2026-10-15

**Seal:** `preceptoros-2026-17-abhc` · fingerprint `ef5278e0318da062`.

The incubator now shows progress only from a valid measured game cycle. A
missing, throwing or invalid cycle displays `NO_DATA · game cycle unavailable`,
keeps the egg drawing still and disables summoning buttons. Invoking also checks
the cycle again after signature work and before the engine can charge resources.
The nest renderer lives in the existing `ui-invoca.js` satellite; `ui.js` calls
that single implementation.

| Gate | Pass 1 | Pass 2 |
|---|---:|---:|
| `test_web.py` | 76; 1 declared skip | 76; 1 declared skip |
| `atlas/test_atlas.py` | 176 | 176 |
| `arnes_sw.mjs` | 22/22; 136 routes | 22/22; 136 routes |

**Measured:** `ui.js` 12528 bytes; `ui-invoca.js` 4907 bytes; site 1255022
bytes; initial game gzip 90973 bytes. The vector fixture has 8 synthetic cases.

**NO_DATA:** browser rendering and public deployment were not confirmed. The
public origin returned HTTP 403 during the prior check; this repository has no
deployment workflow, only the static asset configuration in `wrangler.jsonc`.
