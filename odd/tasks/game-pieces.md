# game-pieces

Date: 2026-10-31
Law: buzon#30 ·6524440790 (the web is the only reality and holds all the data; the app is a local instance whose only purpose is to connect to the web: every piece here lives in the web, and the app gets no map and no data of its own), buzon#30 decree ·6523949872, point 2 («hora de lo jugable: tutoriales, combates y demás») and point 3 (method: the author declares the plan in the ODD before cooking; the Sovereign approves each piece with FIRMO; nothing is coded before its plan is declared). Brújula: the newest visual orders first, as in `odd/tasks/visual-orders-inventory.md`.

## Objective

Playable pieces on the single map (`/openworld/`, see `odd/tasks/main-map-single.md`): a tutorial, a combat, the joystick and the chat under the map on Android. Each piece is one PR, with its gates, and a contact sheet when it is visual.

## Problem and why

The tutorial, the wave army fixture and the walker exist as separate test pages; none is playable on the single map. Gameplay has no declared plan. This document is that plan. It only proposes.

## Scope

In scope, as a ladder of small pieces:

1. **G1 · Joystick and walker on the map** — the joystick and the ephemeral walker over the colony hexes (IC7-S10, D9). Status: built and waiting for merge (`haiku/ic7-terminal-anchor-20261031`). Newest order: ·6523047400.
2. **G2 · Terminal and colour anchor** — the terminal follows the node entered, with the anchor colours (IC7-S5, D8). Status: built, waiting for merge (same branch). Order: ·6522236505.
3. **G3 · Chat under the map on Android** (IC7-S11, D10). Status: measured at 412 px in the terminal piece; no CSS change needed.
4. **G4 · Tutorial as a walk** — the tutorial becomes a short route over the colony: pick a node, the terminal of that node, the first sentence of its colony (existing `face_tutorial.js` steps reused, no new copy). Gates: pure route cases; contact sheet of the first three steps.
5. **G5 · First combat, wave duel** — two bots meet on a shared hex; the wave duel of the army fixture (`face/army.html`, `AtlasWaveDuel` family) decides the outcome from its own seeded rules. NO_DATA for balance: no measured value exists. Gates: determinism twice; sabotage (a duel with no seed refused); contact sheet.
6. **G6 · Empty state** — no node alive: the account's house and fog of unvisited cells, labelled NO_DATA (IC7-S6, approved in the ODD of the live colony).

## Constraints

- Every visible change is a bubble frame under 1,024 bytes, with its own sentence and a declared sound (NO_DATA with cause when none).
- No random number, no clock, no network in the render path; seeded rules only.
- Reduced motion: no bobbing, the move arrives in one step.
- Accessibility: buttons at least 44 px; keyboard reaches everything; colour plus text.
- The door stays under 16 KiB; logic lives in `public/game/` modules.
- Single map: every piece is shown on `/openworld/`, not on a test page.

## Checklist (one piece = one PR; FIRMO per piece before code)

- [ ] G1 · joystick and walker (built, waiting for merge)
- [ ] G2 · terminal and colour anchor (built, waiting for merge)
- [ ] G3 · chat under the map on Android (measured; no change)
- [ ] G4 · tutorial as a walk (plan only)
- [ ] G5 · first combat, wave duel (plan only; balance NO_DATA)
- [ ] G6 · empty state, house and fog (plan only; IC7-S6)

## Verification evidence

Measured in the repository: the tutorial's steps and the node choice (`public/face/face_tutorial.js`); the wave army fixture (`public/face/army.html`, 7,317 B); the walker and the joystick (`public/game/colony_controls.js`, built in the terminal piece). NO_DATA: combat balance; the live map has no node with dated evidence (see the single-map plan).

## Standing signature

Required: FIRMO of this plan, then FIRMO per piece. Search done: `odd/tasks/` (live-colony-nodes, visual-orders-inventory), the tutorial and army code on main, decree ·6523949872.

## Methodology relief

None.

## Log

- 2026-10-31 · Plan proposed (propose-only). No code written for G4 to G6.

## Next step

The Sovereign's FIRMO of this plan. Then G1 and G2 are merged in order, and G4 is the first new piece.
