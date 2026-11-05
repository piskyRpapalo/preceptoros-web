# Priority evidence · refreshed 2026-11-04

| Slice | GitHub evidence | Measured web source | Result / remaining gap |
|---|---|---|---|
| Mobile entry layout | [web #625](https://github.com/piskyRpapalo/preceptoros-web/pull/625), merged at `c52d553b7d6913937b66a703e7bc0ad5ebd9aacf` | `openworld/index.html`, `game/openworld_page.js` | Doogee CSS viewport 360×716; title at y=12, Welcome fits through y=702, log starts y=718, buttons ≥44px. Live post-deploy capture: NO_DATA. |
| Acho colony | web main `5339b9c6` | `game/colony_buildings.js`, `game/colony_page.js`, `game/acho_language.js` | Modules, buildings, bots and walker use `preceptoros.acho/1` frames; frames are compiled by Acho. Current building silhouette is ID-selected; a measured height value is not present in the OpenWorld state schema. |
| Hexagon height | [web #52](https://github.com/piskyRpapalo/preceptoros-web/pull/52); [web #564](https://github.com/piskyRpapalo/preceptoros-web/pull/564) | `game/map_painter.js`; `public/openworld/state.json` | #52 records coral height from measured values. #564 proposes `h = 6·√(generation tok/s)` but is closed as NO_DATA after a merge conflict. OpenWorld buildings do not carry model throughput, so applying that formula to them would invent data. |
| Acho math drift | [movement canon](../../docs/canon-claude-movement.md) §7 | `game/map_painter.js` | The floor uses `LIGHT=[-0.45,-0.6,0.66]`. It is part of the separately signed 3.5D motor (#563); removal or replacement is outside this inventory slice. |
| Non-native scene drawings | web main `5339b9c6` | `openworld/index.html`, `game/colony_page.js`, `game/map_painter.js` | No external raster image is loaded into the scene. The terrain is drawn by the signed 3.5D canvas path and cached as generated ImageBitmaps. The SVG favicon and social-card metadata are outside the scene. There is no unprotected image drawing to delete here. |
| App skins | graphics inventory source commit `7e40181` | `/face/skins.json` | The earlier HTTP 404 is a delivery fact only; current visual parity remains NO_DATA. Build an Acho adapter per skin after same-scene device capture. |
| Worm transition | `interface/face/bubble/worm_transition.js`; web `assets/worm_transition.js` | `game/live_invocation.js` | Web loads a tunnel derivative. Same-action app/web frame, sound and reduced-motion parity: NO_DATA. |
| Historical scenes | `interface/face/face_world.js` | `game/colony_buildings.js` | File hashes differ; per-scene frame equivalence remains NO_DATA. |
| App tray | `data/bandeja/` | local PWA route | Delivery/reader parity NO_DATA; excluded from `/openworld/` scene work. |

The web #625 device figures above are from its PR receipt. A post-merge production
capture is still required. GitHub byte matches establish identical file bytes,
not behavior. The 3.5D floor stays intact under its own FIRMO until the Sovereign
issues a new scoped signature.
