# single-map-isometric-3d

Date: 2026-10-31
Law: the Sovereign, 2026-10-31 («están en la web, pero no en el mapa único. Los dibujos deben hacer el mapa único isométrico en sensación 3D»); decree ·6524386655 and addendo ·6524440790 (one map, the web is the only reality); ideas13oct sec. 2 (the map is the node; isometric rhombus 2:1 with painter's order by depth; each cell with visible rules); the frame law (`atlas/param_gate.mjs`); the fence of `odd/tasks/isometric-colony.md` (no 3D engine, no imported models, no free camera, no external CDN).

## Objective

The drawings that Claude made in the past (see `odd/tasks/past-bubble-drawings.md`) and the colony already on the map become ONE isometric map at `/openworld/`, with a 3D sensation: depth, height and light, drawn only in bubble language. Nothing is loaded from outside, and no 3D engine is used.

## Problem and why

- Each drawing lives on its own page or module: the terrain on the test pages (`face_world_terrain.js`), the sprites in `atlas/puros/catalogo_iso.js` (not served), the colony on `/openworld/` (IC4 to IC7). The public sees fragments, not one map.
- The colony is isometric (2:1, fixed cell) but the cells read as flat hexes: no heights, no shadow, no light. The bubble language has the parts for volume (`style: volume` with shadow, halftone, rim and highlight), but the colony frames do not use them yet.

## What "3D sensation" means here (declared)

Not a 3D engine. Four things that the eye reads as depth, all drawn with bubble primitives:

1. **Painter's order by depth**: each element is drawn after the ones behind it (the colony already sorts buildings by `y`; extend it to terrain, sprites and bots).
2. **Height**: a building stands on its hex as a prism (`wall` + top `ribbon`), with a height from the declared data. Where no height is declared, the frame says `NO_DATA: height` and draws the base only.
3. **Light**: one light vector for the whole map, from the bubble light (`light` field, default `[-0.35, -0.94]`). The faces toward the light are `paper`, the faces away are `ink` or the shade of the same band (`sombra`).
4. **Shadow and rim**: the `volume` style gives the shadow and the rim. It is measured on the contact sheet, not assumed.

## Scope

In scope, in this order:

1. **M1 · one map composition** — terrain (isles and sea from `face_world_terrain`), the colony hexes, buildings, bots, the walker and the cabin, in one scene, drawn by depth.
2. **M2 · heights and light** — prisms for the buildings and the terrain with the light vector; the same frame law; NO_DATA for any height not declared.
3. **M3 · sprites** — the `catalogo_iso` sprites (IC3) placed on the map, each with its lexicon key.
4. **M4 · the look of the map** — palette by tick (IC5, already on main), house bands only, the rule of sealed data (LIVE, STALE, STATIC, SIMULATED, NO_DATA, ERROR) shown on each element.
5. **M5 · verification** — a visual check page in two identical runs, a contact sheet at several ticks, captures on doggee against production.

Out of scope: a 3D engine (three.js or similar), imported 3D models, a free camera, any external asset or CDN, any new world.

## Constraints

- Each element is one bubble frame under 1,024 UTF-8 bytes, with its sentence, its seal and a declared sound (NO_DATA with cause when none).
- The door stays under 16 KiB; the composition lives in a module under `public/game/`.
- No random number, no clock, no network in the render path.
- Accessibility: the sentences of the frames are listed under the map (frase list, IC7-S3 to S5); buttons at least 44 px.
- `gate.yml` is not edited here (the Mesa orders its lines).

## Decisions (declared, open for the Sovereign)

- **M-D1 · the scene is fixed**: one isometric view, no free camera. The walker moves over the hexes, not the camera.
- **M-D2 · heights are data**: a height comes from the declared state or from a measured value only; the hashed shapes stay as shapes, not as heights.
- **M-D3 · the sky and the light**: the palette by tick (IC5) sets the sky; the light vector is fixed by M-D1.

## Checklist (one piece = one PR, FIRMO per piece)

- [ ] M1-1 · the scene composition module (pure), depth order, tests twice, sabotage: an element drawn behind one it should cover is refused.
- [ ] M2-1 · prisms and light (pure), tests, sabotage: a height with no declared source is refused as NO_DATA.
- [ ] M3-1 · sprites from `catalogo_iso` on the map, with their keys; contact sheet first.
- [ ] M4-1 · seals and sentences on every element; gate: n=2 identical runs.
- [ ] M5-1 · contact sheet at ticks 0, 60, 120, 180 and captures on doggee before and after deploy.

## Verification evidence

Measured in main (`772d95a`): the colony (IC4 to IC7) and its painter's order by `y`; the terrain frames (`face_world_terrain.js`: `islesFrame`, `seaFrame`, `standFrame`); the palette by tick (IC5); the sprites (`catalogo_iso.js`, IC3, not served). Not measured here: the 3D sensation itself (NO_DATA until the contact sheet is seen by the Sovereign).

## Standing signature

Required: FIRMO of this plan (the Sovereign's «están en la web, pero no en el mapa único», 2026-10-31), then FIRMO per piece. The visual result is judged by the Sovereign on the contact sheet before any FIRMO of a visual piece.

## Methodology relief

None.

## Log

- 2026-10-31 · Plan declared. The fence (no 3D engine) is kept as the first rule.

## Next step

M1-1 after the Sovereign's FIRMO of this plan.
