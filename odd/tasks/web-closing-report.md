# web-closing-report

Date: 2026-10-31
Law: the Sovereign, 2026-10-31: "Perfecto cierra con tu informe en github y en local! con fotos, movimientos y rutas". Mesa, 2026-10-30: heads frozen before the PR; one piece one PR; no merges by Claude.

## Summary

- The accessibility piece (close button, Escape, focus, back link) works in a browser. Verified with photos and readings (below).
- The tutorial walk (G4-2) serves on its branch. In a browser the walker completes the first step ("key") when it enters the cabin. The second step is blocked: Beelink is not visible, so the walker cannot move there.
- A measured finding: with the four current nodes visible, the tutorial route is not walkable. From Beelink the walker reaches only Beelink and the cabin; the two Doggee nodes are unreachable (see Routes).
- A measured finding in the intro: on a browser that offers the app install, the Tools door installs instead of opening the list. This was already so before this session; the accessibility piece keeps it.
- Not done: the "skip tutorial" button (it needs G4-2 on main); the Beelink state (NO_DATA until the first heartbeat, a decision for the Sovereign); the combat (the plan is written, balance NO_DATA).

## Heads (frozen)

| branch | head | state |
|---|---|---|
| haiku/g4-2-tutorial-walk-serve-20261031 | fcc23ca | frozen for the Mesa's PR; based on aa75627, not rebased |
| haiku/a11y-back-close-20261031 | 4b2937b | frozen; rebased on main b607059; VERSION acd; seal 8df6a79a2b241530 |
| haiku/g5-wave-combat-plan-20261031 | 28c96f5 | plan only (propose-only), balance NO_DATA |
| haiku/m1-1-map-scene-core-20261031 | 6dd282c | core, pending PR |
| haiku/m1-2-map-scene-serve-20261031 | 65b6a54 | served; VERSION acc |
| haiku/bm1-seeded-mover-20261031 | d28a2be | core, pending PR |
| haiku/bm2-wave-duel-20261031 | 1df6e03 | core, pending PR |
| haiku/intro-tools-collapsed-20261031 | d321001 | superseded by the accessibility branch |

Main at the time of this report: b607059 (contains e6d9cf2, G4-1 core, merged as #430).

## Photos

Captured in a headless Chromium at 1000 x 800 px, from the branches above (the door of the accessibility branch for the intro; the door of the G4-2 branch for the walk). Raw step readings: `lecturas-recorrido.json`, `lecturas-intro.json`.

Harness note: for the intro shots the install offer event was disabled in the test page only, because a browser that offers install takes the Tools click for install (see finding 2). Clicks were synthetic (no user gesture).

- `web-closing-report/01-intro-puertas.png`: the intro with only the two doors.
- `web-closing-report/07-tools-abierto.png`: Tools open. Readings: hidden false, aria-expanded true, focus on the Tools heading.
- `web-closing-report/08-tools-cerrado.png`: Tools closed. Readings: hidden true, aria-expanded false, focus back on the Tools door.
- `web-closing-report/02-mapa-antes.png`: the map before any press.
- `web-closing-report/03-cabana-tutorial-key.png`: after "enter node" in the cabin: "terminal: basic (the node). tutorial: key played".
- `web-closing-report/04-este-beelink.png`: after "east": "NO_DATA: no colony node on that hex".
- `web-closing-report/05-beelink-enter.png`: after "enter node" in the cabin again: "tutorial: next step is at beelink".
- `web-closing-report/06-este-desde-beelink.png`: after "east" again: "NO_DATA: no colony node on that hex".

## Movements and routes

Coordinates (axial, from the state; seals from `public/openworld/estado.json` as on main):

| node | q, r | seal | visible on the map |
|---|---|---|---|
| cabin | -1, 0 | LIVE | yes |
| beelink | 0, 0 | NO_DATA | no |
| doggee-a | 2, 0 | NO_DATA | no |
| doggee-b | 2, -1 | NO_DATA | no |

The walker moves only onto a neighbour hex that holds a visible colony node. The tutorial route is: key (cabin) → beacon (beelink) → egg and hatch (doggee-a) → fight (doggee-b) → node (cabin).

Route measured in the browser (today's production layout):
1. Start on the cabin. The walker starts on the cabin.
2. Enter: "key played". The first step is complete.
3. East: refused, Beelink is not visible.
4. Enter again: the next step is at beelink; the walker does not move there.

Route measured with the real move function, if all four nodes were visible (no browser needed):
- From beelink, the reachable set is {beelink, cabin}. Doggee A and B are not reachable: no neighbour of beelink, and no chain of visible nodes, leads to them.
- Conclusion: the tutorial as designed needs either a visible node linking beelink to doggee (for example a node at q 1, r 0, or r -1, or a route that does not depend on adjacency), or a decision to let the walker step over empty hexes. This is a layout decision, not a code fix: it is proposed here and not made.

## Findings

1. **The route is not walkable** (above). Needs a decision on the layout or the walk rule. Owner: the Sovereign or the Mesa.
2. **Install takes the Tools click.** On a browser that offers install, pressing Tools calls the install prompt and the list does not open. Pre-existing (the original code also installed first). Proposed: keep install as the button's action when offered, and show the list anyway (for example a second control), so the list is always reachable. Cost S.
3. **The tutorial cannot be skipped yet.** The "skip tutorial" button needs `tutorial_walk.js` on main. It is the next piece after G4-2 is merged.
4. **Beelink is NO_DATA** until its first heartbeat (the credential and the worker belong to the Sovereign). Nothing in the code resolves it.

## What I did not do

- No merges, no pushes to main, no PR opened (the Mesa does that).
- No code for the skip button or for combat.
- No change to the layout of the nodes.

## Standing signature

None needed for this report (it is a document of measurement). The layout decision in finding 1 needs the Sovereign's FIRMO.

## Methodology relief

None.

## Log

- 2026-10-31 · Captures and readings taken in a headless Chromium; the install offer disabled in the test page only; the route check run with the real move function.

## Next step

The Sovereign decides the layout (finding 1) and the install behaviour (finding 2). Then the skip button, after G4-2 is merged.
