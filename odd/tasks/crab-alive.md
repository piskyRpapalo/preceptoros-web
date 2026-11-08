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
