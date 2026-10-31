# One map repair · the two new map links (2026-10-30)

Incidence, ordered by the Sovereign: two additions introduced onto the global
map page (`/openworld/`) on 2026-10-30 must be removed.

## Measured before

- `public/openworld/index.html` (main `97bf5d44`) carried, at the foot of the
  map section: `Army fixture · Benchmark data · Tutorial · no key`.
  The `Benchmark data` and `Tutorial · no key` links were added on
  2026-10-30 (PR #440, "one-map pointers"). The `Army fixture` link
  pre-dates them and stays.
- `Tutorial · no key` led to `/face/basic.html`, the pre-decere tutorial
  world page (merged 2026-10-25, PR #307): its own isometric world drawn from
  its own in-page state packet, with a six-step guided tutorial. The one map
  already has its own tutorial: the walk over the map (`tutorial_walk.js`
  with the colony controls), played in production the same day.
- `public/openworld/hexelion-benchmark.json` declared
  `"no_identity_tutorial_entry": "/face/basic.html"`.

## Repair (this piece)

- Both links added on 2026-10-30 are removed from the one map page. The foot
  of the map keeps only the pre-existing `Army fixture` link.
- `hexelion-benchmark.json` now declares
  `"no_identity_tutorial_entry": "/openworld/"` (the tutorial walk on the
  one map). The benchmark record itself stays published at its URL and in
  `docs/one-map-inventory.md`.
- `docs/canon-node-evidence-and-account.md` and `docs/one-map-inventory.md`
  name the one-map walk as the no-account tutorial entry; `/face/basic.html`
  is marked as a preserved pre-decree world page (deep links, app#115), not
  the tutorial entry of the one map.
- Nothing is deleted: the preserved world pages stay on disk (app#115,
  enforced by `test_web.py`) until the measured redirect rule and the Worlds
  door exist.

## Handed to the panels commission (not this piece)

The `Army fixture` target (`/face/army.html`) shows a synthetic army with its
own joystick drawn over its own map, with no user profile sha and no
ephemeral crab. The Sovereign's decree: panels are interface for the carbon,
they belong to the nodes and their apps as web presentation, all exposed on
the one shared map. Fixing that binding is the panels commission's scope.

## Verification

- `python3 test_web.py` — green (75 tests).
- `python3 atlas/test_atlas.py` — one pre-existing failure in this sandbox
  (`test_node_signature_verify`, needs OpenSSH tooling), not touched by this
  piece; the remaining 44 tests green.
- `node arnes_sw.mjs` — 24/24.
- Service worker re-stamped in the same commit (`bin/sellar.py --sellar`).

Agent: preceptor-orquestador-github · Model: GLM-5.3
