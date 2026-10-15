# RECEIPT · Crab skills panel and audio control · 2026-10-15

**Seal:** `preceptoros-2026-17-abhe` · fingerprint `757b818bd0d7be99`.

The English Skills panel now includes a user-controlled audio feedback button
with an announced status. It is off until clicked, uses the existing local
Radio synthesis, and gives a cause when audio is unavailable. Swim and Reach
totals stay accurate for the tab even after the 400-row event detail buffer
rolls older entries off. No event is saved or sent over the network. The audio
manager is loaded on demand with the arena and included in the service-worker
precache.

| Gate | Pass 1 | Pass 2 |
|---|---:|---:|
| `test_web.py` | 76; 1 declared skip | 76; 1 declared skip |
| `atlas/test_atlas.py` | 176 | 176 |
| `arnes_sw.mjs` | 22/22; 137 routes | 22/22; 137 routes |
| Audio manager cases | 6/6 | 6/6 |

**Measured:** manager 3,869 bytes; free-move panel 9,049 bytes; radio 6,560
bytes; `thegame.js` 12,677 bytes; precache list 7,193 bytes. Site weight is
1,261,713 bytes and initial game gzip is 90,989 bytes. The SW seal is
`preceptoros-2026-17-abhe`.

**NO_DATA:** production rendering and public deployment are not confirmed. The
last observed public-origin response was HTTP 403, and this repository has no
deployment workflow or configured Wrangler executable.
