# Priority evidence · 2026-11-03

| Piece | App/rack anchor | Web observation | Gap |
|---|---|---|---|
| face.js | `interface/face/face.js` | historical validator reports app/web mismatch | parity NO_DATA; repair separately |
| skins | `interface/face/skins.json`, three HTML pages | `/face/skins.json` HTTP 404 | visual parity NO_DATA |
| worm | `interface/face/bubble/worm_transition.js` | `/assets/worm_transition.js` HTTP 200; OpenWorld uses tunnel derivative | actual transitions NO_DATA |
| scenes | `interface/face/face_world.js` | `public/game/colonia_edificios.js` | scene-by-scene Acho parity NO_DATA |
| tray | `data/bandeja/` | local PWA route returned 404 | reader proposed in app #164 |

Beelink: git ls-tree/sha256 and curl, 2026-11-03; historical frame audit in
web #621. HTTP 200 proves delivery only. Device behavior and source freshness
must be remeasured before each port. No private rack values are included.
