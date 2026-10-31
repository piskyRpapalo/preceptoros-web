# tutorial-walk

Date: 2026-10-31
Law: the Sovereign's decree ·6523949872 point 2 (playable pieces, tutorial first); the game plan signed in #421 (G4 in the ladder G1-G6, one piece = one PR); ideas13oct sec. 17 (the core level is a log of what the time-interactor does; the tutorial feeds it only when played, and is always skippable); sec. 2 (the map is the node; every cell shows its rules before entering); decree ·6524440790 (the web is the only reality; the app has no map and no data of its own).

## Objective

The existing six-step tutorial becomes a short walk over the single map (`/openworld/`). Each step is a place: the player walks there with the joystick (G1) and does the step. The tutorial can be skipped at any step and it never blocks the map.

## Problem and why

The tutorial lives in `public/face/face_tutorial.js` as a list of six steps, with the buttons of the old terminal pages (`#tab-profile`, `#tab-map`, `#tab-battle`). It is not on the single map, and it speaks of tapping icons that the map does not have. The walk makes each step a place, reusing the step text and the same progress record.

## Mapping (step to place)

| step (`face_tutorial.js`) | place on the single map | what the player does | status |
|---|---|---|---|
| key | the cabin (tutorial hex, `cabin`) | presses Enter: the key is created (local, in the browser) | plan |
| beacon | the centre hex (Beelink, `beelink`) | walks onto the beacon, presses Enter, gets the copper reward | plan; needs `beelink` LIVE (currently NO_DATA) |
| egg | the first Doggee hex (`doggee-a`) | summons an egg from the local profile | plan; needs `doggee-a` LIVE (currently NO_DATA) |
| hatch | the same hex, a timer of cycles | the egg hatches after 20 cycles | plan |
| fight | the second Doggee hex (`doggee-b`) | duel of the crabs (G5), the first duel | plan; balance NO_DATA |
| node | any hex with a node | chooses the node: the terminal of that node (IC7-S5) | plan; uses G2 |

## Decisions (declared)

- **D19 · Skip is always there.** A skip control reaches every step; a skipped tutorial is recorded as skipped, not as done (ideas13oct sec. 17).
- **D20 · The walk feeds the level only when played.** Each completed step appends one entry to the local progress log (memory of the browser, not the node state). The level reads that log. Nothing is granted by time alone.
- **D21 · Places come from the state.** A step whose node is not LIVE shows NO_DATA on the map and waits; it never invents a place. Today `beelink`, `doggee-a` and `doggee-b` are NO_DATA, so only the cabin step can be walked. The walk says so.
- **D22 · Keyboard and joystick reach everything** (A11Y: 44 px targets, arrow keys, Enter). No step needs a pointer.

## Prerequisites (must be on main first)

- G1 and G2: the joystick and the terminal (`haiku/ic7-terminal-anchor-20261031`, `cdfeef3`).
- The producer of `estado.json` v2 (`haiku/mm2-productor-estado-v2-20261031`, `9815910`) so that the state can name the places.

## Checklist (IDs stable, one piece = one PR)

- [ ] G4-1 · the step table as data (`public/game/tutorial_walk.js`), pure: steps, places, skip, log. Tests twice; sabotage: a step with no place is refused; a skipped step counted as done is refused.
- [ ] G4-2 · the cabin step on the map (key), with the skip control. Contact sheet.
- [ ] G4-3 · the remaining steps, each behind its node's LIVE state (NO_DATA until then). Contact sheet per step.
- [ ] G4-4 · the progress log in the browser (try/catch, no network).
- [ ] G4-5 · VERSION bump and seal chain in the same PR; door size under 16 KiB.

## Verification evidence

Measured: the six steps and their targets in `public/face/face_tutorial.js` (main). Not measured here: how the duel behaves (G5 is not built).

## Standing signature

Required: FIRMO of this plan, then FIRMO per PR. Search done: `odd/tasks/game-pieces.md`, ideas13oct secs. 2 and 17, decree ·6524440790, the tutorial code on main.

## Methodology relief

None.

## Log

- 2026-10-31 · G4 route declared before cooking. No code written.

## Next step

G4-1 after the G1 and G2 merges and the producer merge.
