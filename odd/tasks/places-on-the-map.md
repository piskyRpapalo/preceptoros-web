# The visit's places live on the map

The visit's six practice places (Reef, Kelp, Ruins, Silt, Abyss, Core; `visitor_battle.js places()`) are drawn by `visitor_conquest.js` in **screen** space: `width / 2 + coordinate × scale`. They do not follow the camera's pan, zoom, turn or tilt, so they float over the map. Since 2026-11-08 they no longer cover building pills (`dataset.pills`).

1. Give each place a hex on the map, chosen deterministically from its seed by the same law the fog uses. Draw its name with the map's projection (`V.turn`, `G.k`), like the building names.
2. **Walk the crab to the place before a duel.** «Fight at Reef» steps the crab along the hexes to Reef, then the duel stages there (`crab_stage.hold`). It is render-only: the walk is the walker's, and the result is the motor's.
3. Stage summons signed in a building (`invocation:signed`) the same way as the egg's reveal.

Done when: the place names turn and tilt with the map, a duel starts with the crab at its place, and the pure cases cover the place-to-hex law.
