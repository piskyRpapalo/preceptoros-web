# past-bubble-drawings

Date: 2026-10-31
Law: the Sovereign, 2026-10-31 («tienes todos los objetivos del sistema. tú te encargas de que sea bonito en la web. trae todos los dibujos creados por Claude en el pasado que nos funcionen con bubble language»); the bubble frame law (`atlas/param_gate.mjs` `checkFrame`: under 1,024 bytes, named bands, a declared sound, a sentence per atom); ODD: the plan first, FIRMO per piece before any code.

## Objective

Every bubble-language drawing that Claude made in the past, and that passes the frame law, is on the web at preceptoros.org, presented well. Each one that does not pass is recorded with its cause.

## Inventory (measured on `origin/main`, 2026-10-31)

Git records most of these files under the house identity, with the trailer `Co-Authored-By: Claude`. The column "Claude" is that trailer. "Served" means the file is in `public/` and reachable.

| file | size | Claude trailer | served | status |
|---|---|---|---|---|
| `public/face/basic.html`, `atlantis.html`, `zombie.html` | 13–14 KB | yes | yes (test pages, `Test ·` titles) | served; the pages are tests, not the map |
| `public/face/face_world.js`, `face_world_terrain.js`, `face_hud.js`, `face_paint.js`, `face_battle.js`, `face_hero.js` | 1–12 KB | yes | yes (loaded by the pages above) | served; world frames and terrain |
| `public/game/bubble_language.js` | 16 KB | yes | yes | the language itself |
| `public/game/colonia_edificios.js`, `colonia_pagina.js`, `global_map.js`, `palette_cycle.js`, `state_frames.js` | 3–11 KB | yes | yes | served; colony, sky, frames (IC4 to IC7) |
| `public/assets/landing_doors.js` | 3 KB | yes | yes | served; the intro's doors |
| `atlas/puros/catalogo_iso.js` | 5 KB | yes | **no** | merged in main (IC3); pure core that builds sprite frames; not served |
| `atlas/puros/colonia_edificios.js`, `paleta_ciclo.js`, `state_frames.js` | 3–8 KB | yes | **no** (their served copies are in `public/game/`) | source copies, kept in parity |
| `tools/preceptor-coder/frames/cabin.json` | 410 B | yes | no | **fails the frame law**: `bands not an array`; `paper`, `ink` not declared. NO_DATA with cause until repaired |
| `atlas/ojo/fixtures/palabras.html` | 4 KB | yes | no | a test fixture, not a drawing; not published |
| `docs/rebuild/examples/*` (basic, atlantis, zombie, index, harnesses) | 13 KB each | yes/no | no (examples) | duplicates; the examples' changes are in `odd/tasks/examples-to-live-map.md` |

## Decisions (declared)

- **PB-D1 · served only if it passes.** A drawing is published only when `checkFrame` passes on its frames and its gate is green. Nothing is published by hand.
- **PB-D2 · the test pages stay tests.** `basic`, `atlantis`, `zombie` are labelled as tests (MM-1); their drawings are shown on the single map through the colony pieces, not as the map.
- **PB-D3 · repair before serve.** `cabin.json` is repaired (its bands declared as a list, the sentence kept) in its own piece, then it may be served. Its repair is not made here.
- **PB-D4 · `catalogo_iso.js` is served with its sheet.** Its sprites are shown in a contact sheet (IC8) before any publication, as the visual rule requires.
- **PB-D5 · presentation.** "Bonito" means: the served drawings sit on the single map, with their sentence, seal and sound visible, and with the house bands only. The layout follows `odd/tasks/map-visual-audio-mvp.md` (MV-D1, MV-D2).

## Checklist (one drawing or one repair = one PR, FIRMO per piece)

- [ ] PB-1 · repair `tools/preceptor-coder/frames/cabin.json` to the frame law; gate: `checkFrame` passes; NO_DATA kept until then.
- [ ] PB-2 · serve `catalogo_iso` sprites on the map with their sheet (IC8 contact sheet first).
- [ ] PB-3 · the served drawings on the single map, presented per MV-D1 and MV-D2; contact sheet and captures on doggee.
- [ ] PB-4 · record in `mente/aprendizaje/OPTIMIZACIONES.md` what was served and why, with its reversal.

## Verification evidence

Measured: the inventory above (`git grep` for the bubble format on `origin/main`, creator and trailer from `git log`); `cabin.json` through `checkFrame` (ok=false, 3 causes). Not measured: the visual result on doggee (NO_DATA until PB-3 captures).

## Standing signature

Required: FIRMO of this plan, then FIRMO per PB piece. Search done: the bubble format across `origin/main`, the frame law (`atlas/param_gate.mjs`), the plans `map-visual-audio-mvp.md` and `examples-to-live-map.md`.

## Methodology relief

None.

## Log

- 2026-10-31 · Inventory measured and the plan declared. No file changed.

## Next step

PB-1 after the Sovereign's FIRMO of this plan.
