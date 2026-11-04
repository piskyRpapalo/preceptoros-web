# Graphics inventory · first bounded pass

Refreshed 2026-11-04 against GitHub heads: app `PreceptorOS@7e40181ecc7bb3737ae9ca4fb679c299ad8c0f4c` and web `preceptoros-web@5339b9c62624392c000dfe1041c94f85c60f9915`. The app scan contains 68 tracked `interface/face` and `colony` text assets; the web scan contains 134 tracked `public/game`, `public/face` and `public/assets` text assets. SHA-256 byte matches: 18/68, unchanged from the 2026-11-03 Beelink pass. A missing byte match is not proof of missing functionality. Parts 01–10 list app files; web-01–19 list each web file and one matching app path when present.

Rack drawings outside those tracked paths and historical branches: NO_DATA. In `/openworld/`, colony modules, buildings, bots and the visitor are framed as `preceptoros.acho/1` and compiled by Acho. The terrain floor is the exception: `map_painter.js` uses a signed 3.5D canvas renderer with generated bitmap caching (PR #563). The favicon and social-card metadata are not page-scene drawings. No external raster drawing is loaded into the OpenWorld scene. Doogee scene parity beyond the measured #625 layout remains NO_DATA. Compare semantics before each individual port; do not copy files based on hash mismatch.

Method: `git ls-tree -r --name-only <commit>` and `git show <commit>:<path>` for
the stated commits; include `.js`, `.json`, `.html` and `.css`; SHA-256 each
blob with Python `hashlib.sha256`. Row digests are abbreviated. HTTP retrieval
and source freshness beyond these exact commits remain NO_DATA until measured.
