# Offline world-rules provenance

Status: proposal on WEB main `08a0be9311066bade3a1225834311597781dc536`.

## Current contract

`public/assets/atlas-piso.js` requests `atlas-mundo.json` separately from the
language content. A failed world request is converted to `null`; the pure
`AtlasMotor.leyes(null)` path sets `nd: true` and uses neutral values. A
successful response with missing or malformed measurement fields is different:
the current engine may use neutral defaults for individual values while
`nd` remains false. That distinction must not be described as a verified
world snapshot.

The service worker only handles JSON paths declared in `CONTENIDO_JSON`.
`atlas-mundo.json` is not in that list and passes through the JSON exclusion
in `public/sw.js`. The live-world fetch therefore has no service-worker
offline guarantee. IndexedDB game state and cached page assets are separate
inputs; neither proves that the current world measurements were loaded.

## Evidence and acceptance

The regression judge loads the actual pure engine and checks its returned
provenance bit for absent versus present world data. It also checks the fetch
fallback and the service-worker exclusion. A sabotaged neutral indicator or a
new implicit cache declaration must turn the judge red.

This contract does not claim browser HTTP-cache behavior, cold offline startup,
airplane-mode behavior, or replay parity with a previously saved game. Those
remain `NO_DATA` until measured in a browser with recorded cache state. Do not
add the measurement JSON to the service-worker cache as an incidental fix.
Any later snapshot design must define source identity, freshness, validation,
and replay semantics first.

## Measured sources

- `public/assets/atlas-piso.js`: language and world fetch; world failure maps
  to `null`.
- `public/assets/atlas-motor.js`: pure `leyes` projection and `nd` flag.
- `public/sw.js` and `public/sw-listas.js`: declared JSON interception rule.

## Verification

Run `node --test tests/offline_world_provenance.test.mjs`. This is a source and
pure-function contract test, not an offline-browser test. The full web gates,
including `python3 atlas/test_atlas.py`, remain required by CI.
