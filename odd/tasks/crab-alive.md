# crab-alive

Date: 2026-11-08
Law: Sovereign commission «the crab alive, the map in depth and the fight on the map» (RENDER, propose-only, depth 3), signed in chat 2026-11-08 («firmo adelante», «continua firmo todo»). One piece per PR.

## Pieces and order
1. **PR 1 · piece 2 + greeting and heartbeat (this PR):** the crab glides and walks with its legs, greets, and beats only with a signal.
2. **PR 2 · pieces 4 + 5:** every panel gets a 44 px X; accepting an action closes the panel and zooms onto the crab (`crab_stage.focus`).
3. **PR 3 · piece 3:** the preceptor's box becomes a comic speech bubble pointing at the crab (DOM, so it stays accessible).
4. **PR 4 · piece 6:** the duel paints its waves on the map canvas around the crab; the motor stays untouched.
5. **Piece 1 (left stick = map angle) waits:** it changes the role fixed by the decree of 2026-11-07 and by the Sovereign's chat of the morning of 2026-11-08 (inverted pan, live since #763). It needs an explicit new decree; it is not applied in silence.

## PR 1 as built
- `public/game/crab_body.js` (`AtlasCrabBody`): the crab's body leaves `map_chunks.js`, which now has room for the stage.
  - `ease` is cubic ease-in-out.
  - `pose(steps, p, gp)` drives a tripod gait: L0, L2 and R1 lift together, then the other three, once per hex.
  - The greeting (claws up, opening twice in 640 ms) plays at birth and on reaching a building's hex.
  - `beat(f, t)`: the floor ring beats only with a signal freshness. A visitor without a node has none, so it stays still.
  - All of these are pure.
- `map_chunks.js` `youLayer` interpolates the projection between the previous cell and the new one over 240 ms. The walk (colony_controls.js) does not change; only the picture glides.
  - A short frame loop runs only while the body moves (the map has no idle loop).
- Reduced motion: it arrives at once, the legs rest, and it does not greet.
- No random numbers in the body; the clock only times the picture.

## Gates
- `atlas/puros/crab_body_cases.mjs`: the easing lands; the gait alternates the two tripods; standing means every leg rests; the same pose comes from the same step; the greeting; the beat (none without a signal); no randomness in the file.
- Doogee, a real step east: the crab's x went 344 → 345 → 348 → 353 → 361 → 372 → 388 → 401 → 410 → 415 → 419 → 420 → 421 over 14 frames (before: one jump).

## NO_DATA
- Signal freshness for the visitor crab: there is no node, so there is no signal. `ow.signal` is the hook for a future signed source.
- «The same trace on two devices» is proven for the pose, which is pure. A real two-device recording is still pending.

## PR 2 as built (pieces 4 + 5)
- `public/game/panel_x.js` (`AtlasPanelX`, loaded by `gamepad.js`):
  - the voices panel gets a 44 px round ✕ («Close panel») in its top-right corner; it closes the open category, as Escape does;
  - the Town and Settings sheets keep their «Close» button, which now shows a ✕ too (`talk.css`).
- Accepting an action the crab carries out closes its panel. The pure `verdict(id)` decides which:
  - summon, beacon, build → close the panel and `crab_stage.look()`: a zoom onto the crab that stays until the visitor pans or zooms;
  - fight, hatch → close the panel only, because their scene zooms by itself (#765).
- The zoom is render only: no state changes, and reduced motion makes it a still cut.
- Gates: `atlas/puros/panel_x_cases.mjs`; 13 browser guards green; 146 precached routes.
- Doogee, real taps:
  - the ✕ (44 × 44) closed Welcome;
  - «Visit the beacon» closed the House and the camera zoomed to 2.2 on the crab.

## PR 3 as built (piece 3)
- `preceptor_talk.js`: the preceptor's box leaves the space above the gamepad and becomes a comic speech bubble on the map (`#stage`).
  - Its tail points at the crab. `place()` puts it above the crab, or below it near the top edge, and follows the crab as it walks and zooms; the gap grows with the zoom.
  - The map gets back the box's height. The gamepad guard goes back to three pieces: status line, map with the bubble, gamepad.
- `news(text, who)`: the duel's result comes out of the bubble («Duel · Patrol wins · 7 rounds · balance NO_DATA…»). It quotes the motor's own sentence and invents nothing. While a scene is on stage the bubble steps aside, and after the scene it keeps the result.
- Accessible as before: `aria-live` on the line, 44 px answers, real DOM rather than paint.
- Doogee:
  - the bubble's tail followed the crab (148 → 209 px);
  - the duel's result came out of the bubble after the fight;
  - at zoom 2.2 the tail points at the crab without covering it.

## PR 4 as built (piece 6)
- The duel no longer opens a window. `crab_stage.hold` marks a duel and `talk.css` makes it a transparent layer over the whole map.
  - The scene's canvas is already transparent (`clearRect` in `wave_duel_scene.js`), so its waves are drawn over the zoomed hexes around the crab. They live, move and clash there.
  - The «COMBAT · SIMULATED» seal stays in view.
  - The controls (Pause, ×1, ×2, ×4, Return to the map) are a small Acho bar at the foot of the map.
  - The result comes out of the crab's bubble (PR 3), quoting the motor.
  - The two sentences stay in the DOM for the screen reader, but are hidden from view.
- The motor (`atlas-motor.js`) and `wave_duel_scene.js` are untouched: no new imports and no clock. Same fight, same result.
- Family-friendly as before: the reaction is detuning and clashing, never graphic harm.
- Gates: the battle, conquest, replay and eggs guards, plus eye_carbon and gamepad, are green.
- Doogee: a Reef duel's waves (green squares, violet triangles) moved and clashed over the zoomed map, beside the crab, with the bar at the foot.

### NO_DATA
- Done after the first cut: `wave_duel_scene.js` takes `origen: [fx, fy]`. On the map the visitor's troops are born at the crab (the centre: the camera centres it) and spring to their column. It is one line, with no clock and no chance, and the replay without `origen` is unchanged. On the Doogee the waves stood by the crab half a second in. The birth instant itself was too fast for a screen capture: NO_DATA for the first frames.
- The scene is a layer exactly over the map canvas, not paint inside `#surface`. On screen it is the same place; for the code it is a separate canvas.
