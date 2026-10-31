# colony-terminal-anchor

Date: 2026-10-31
Law: buzon#30 ·6523552961 («FIRMO TODO»), ·6523867430 (#418 signed; the rail: #418 first, contract after, then «sigue cocinando» without waiting for the rail; the order's own comment has no id here); decree ·6523148687 (ALL IN: newest first, every visual a bubble frame under 1,024 bytes with its sentence and sound); decree ·6523047400 (colour anchor, permanent joystick, Android chat under the map); decree ·6522236505 («the terminal is the user's; its colour changes with the node; the user can change it in their own app»); decree ·6522187525 (the aesthetics of the nodes, as the tutorial); D7 (IC7 reads only `estado.json`).

## Objective

On `/openworld/`, the user has a terminal (the look of the page). Entering a colony node adopts that node's colours (the anchor). A joystick is always present and moves the user's ephemeral character across the colony's hexes. The user may change their terminal look in their own browser. On a phone the chat sits below the map.

## Problem and why

The colony already draws the nodes (IC7-S3, S4) and their frases (·6523297468), but the page has no terminal: nothing changes colour when the user enters a node, there is no way to move through the colony, and the terminal preference does not exist. The decrees ask for all four.

## Scope

In scope, in this order:

1. The terminal look and its colours, from the node the user enters (V09, V04).
2. The user's own choice of terminal, kept in their browser only (V09).
3. The joystick, always present, moving the ephemeral walker over the colony's hexes (V05, D9).
4. The walker drawn as a bubble frame with its own sentence and a declared seal (NO_DATA: the walker is not node state).
5. The Android layout check: chat under the map below 900 px (V06, D10).

Out of scope: the apps (beelink 8740 and doggee) are not touched in this piece; the double capture on doggee after deploy (V02, the parity); any change to `estado.json`; any heartbeat producer (D7).

## Decisions (declared)

- **D13 · Terminal look** = the look of the node entered (`basic`, `atlantis`, `zombie`), or the user's own choice if one is saved. The user's choice is stored in their browser only (`localStorage`, guarded by try/catch), never sent anywhere.
- **D14 · Colours from house bands only.** The anchor maps each look to band names (`paper`, `ink`, `ocean`, `cyan`, `comic yellow.base`, `vermilion.base`). The hex values are resolved at run time from `comic_tokens.js` and `comic_accents.js`. No hex literal is written in new code.
- **D15 · Walker** is ephemeral: it lives in memory only, is not in the state, and moves only to a neighbour hex that is a colony node. Its frame sentence says it is the user's, and its seal is NO_DATA (not node state).
- **D16 · Joystick** has four direction buttons (44 px targets) and arrow keys; Enter enters the node under the walker. It is always visible in the map panel, also with no node alive (then it has no target and says so: NO_DATA).
- **D17 · Android** (D10): the layout already stacks the chat under the map below 900 px (`main` is a row grid, see `public/openworld/index.html` CSS). This piece verifies it with a 412 px capture; no CSS change is needed unless the capture disagrees.

## Checklist

- [x] TA-1 · pure module `atlas/puros/colony_controls.js`: neighbours, move, anchor colours, saved choice; tests.
- [x] TA-2 · served copy `public/game/colony_controls.js` identical to the source (parity test).
- [x] TA-3 · walker frame in `public/game/colonia_pagina.js` (own sentence, seal NO_DATA).
- [x] TA-4 · door: the joystick panel, keys, enter; the anchor on enter; the terminal choice.
- [x] TA-5 · gates: pure cases twice with sabotage (a move onto a non-node is refused; a hex literal in the anchor is refused; a saved choice that is not a look is ignored), visual gate, door dump (4 direction buttons present).
- [x] TA-6 · contact sheet: door with the fixture (desktop) and at 412 px (phone, chat under the map).
- [x] TA-7 · VERSION bump and seal chain in the same commit.

## Verification evidence

- TA-1 · `atlas/puros/colony_controls.js`; `atlas/puros/colony_controls_casos.mjs` 11/11 twice (walk only onto a node, unknown direction refused, saved choice wins, bands resolved, unresolved band throws, invalid look refused, throwing store reads as no choice, no hex literal, no random/clock/network).
- TA-2 · `public/game/colony_controls.js` identical to the source (`cmp`).
- TA-3 · `public/game/colonia_pagina.js` `youFrame`: seal NO_DATA, sentence says ephemeral walker; case in `colonia_pagina_casos.mjs`.
- TA-4 · door `public/openworld/index.html`: short block with `CC.attach`; controller in the module; joystick mounted (dump: six directions + enter node + four options); CSS: `#map .surface` min-height 240 px; `#map` overflow auto.
- TA-5 · gates: `colonia_pagina_gate` 11 passes (16 visible sentences, joystick in DOM); pure cases twice.
- TA-6 · contact sheets: `atlas/terminal-desktop.png` and `atlas/terminal-phone-412.png` (chat under the map at 412 px, D17 measured).
- TA-7 · VERSION abz, huella 0fc2fef75c432bc0 (see receipt). Door 16,220 B (ceiling 16,384 B).
- Not verified here: the double capture on beelink and doggee (V02, after deploy); the app surfaces.

## Standing signature

Not needed: no new node ids, no contract change, no change to the frame contract. The user's choice is local to the browser (no account, no network).

## Methodology relief

None.

## Log

- 2026-10-31 · Route declared before cooking (TA-1 to TA-7). D13 to D17 decided and recorded.

## Next step

TA-1: the pure module and its tests.
