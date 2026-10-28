# One map · history and live evidence (2026-10-28)

Measured from the live site and from git history of `main`. Evidence images are in `docs/one-map/`.

## 1. Three maps that exist today

| Map | Where a reader meets it | What it is | First commit (main) |
|---|---|---|---|
| **Old circular map** (theGame World map) | Game panel of `/play/`, region "World map, centered on your home. Hexelion is measured; another site sits in fog" (`docs/one-map/live-worldmap-circular-before.png`) | Round fog of war centred on Hexelion. Its strings include "No key yet: centered on Hexelion" (`public/atlas-arena-en.json`, key `mapa_sin_casa`) and "Silt Leviathans" (`npc_limo`). | `51319ff` 2026-10-05 "el mapa global se arrastra hasta chocar con la niebla" |
| **Old bubble pages** (`face/basic`, `face/atlantis`, `face/zombie`) | `/face/` Worlds hub, then the tutorial/world pages | Static bubble-language pages with their own scenes; the Atlantis and zombie pieces live here. | `394e992` 2026-10-25 "NORTE 5 — tutoriales…" |
| **Cabin door** (`/openworld/`) | "Open the map" on `/face/` (`docs/one-map/live-face-worlds-before.png`) | A cabin bubble on a plain sky; zero nodes by default. | `e4dd827` 2026-10-28 "ruta /openworld/ · mapa con cabana y chat, cero nodos por defecto" |
| **Isometric hex colony** (today's model) | Branch `haiku/global-map-20261028` (PR #388) | Pure map core (`public/game/global_map.js`), one state, many renders; isometric 2:1 cells; terrain field; nodes only when alive. | ODD doc `6585454` 2026-10-28; code only on the PR branch (`2891103`, `fe51495`, `1388efc`) |

## 2. How the circular map came to be (git history of the map code)

- `51319ff` 2026-10-05: the global map is dragged until it hits the fog (`fog_of_war.js`, `world_camera.js`).
- `63890b7` 2026-09-28: the Arena and multiplayer sea with NPC places (`mar.js`), which is where the NPC lines come from.
- `9e11465` 2026-10-12 "LEY DEL SUELO, paso 1: el rombo es la ley" (`isometric_floor_projection.js`): the 2:1 rhombus projection is already in theGame.
- `8064380` 2026-10-12: the map projects in a 2:1 rhombus (sea, fog, places, crabs), and the finger follows it.
- `8dcc36c` 2026-10-12 "EL MAPA: en la niebla solo queda Hexelion": only Hexelion remains inside the fog.
- `c94f4c4` 2026-10-23: renamed `mar*` → `sea*` (HITL R-D3a).

So the circular Hexelion map and the rhombus projection were already in theGame before today. The new model reuses the same 2:1 projection (`isometric_floor_projection.js`) and replaces the circular fog with a hex lattice.

## 3. What the live site serves today (measured)

- `/openworld/` and `/game/global_map.js` on the live site have the **same SHA-1 as branch head `fe51495`**, not as `main` (`abke`). The live site therefore serves the PR branch build. Its `sw.js` is `abkf`.
- The cabin graphic the Sovereign saw is that build with `estado.json` listing zero nodes (`docs/one-map/live-openworld-before.png`). The cabin is the only bubble, so the isometric layout did not read as isometric.
- The guided tutorial on `/play/` is not the circular map: "Start the guided tutorial" opens "Two doors" (phase F0), then "The Wave" (phase F1) with a practice beacon (`live-tutorial-after-click-before.png`, `live-fog-map-before.png`). "Check the rift" opens the sea scene with the crab (`live-rift-map-before.png`).
- The circular map is reached from the game panel (`live-worldmap-circular-before.png`).
- A device may still hold an older service-worker cache. Not measured: no device at hand (NO_DATA).

## 4. Target look and gap

Target (Sovereign's screenshot, decree 6470048349): colourful cartoon isometric hex world, varied terrain (water, grass, mountains), buildings, units, trees, rocks, bright palette, slightly tilted camera. Reference consulted: `github.com/Station-Sciences/bot-crossing` (MIT, Jarren Rocks), cloned shallow for reading only; its visual-check pages are the pattern for our before/after evidence. Nothing is copied.

Gap in this piece: the field uses only the house bands (paper, ink, cyan), so there is no bright palette, no buildings, units, trees or rocks, and the camera is the fixed 2:1 angle, not tilted.
