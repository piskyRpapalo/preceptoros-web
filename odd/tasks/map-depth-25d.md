# The map in depth, second cut (after piece 1 of «the crab alive»)

The left stick and the anchored two-finger gesture turn the map and tilt it (`canvas.dataset.tilt`, `colony_page.js geometry()`). What remains, measured on the Doogee on 2026-11-08:

1. **Walls do not grow when the ground lies down.** A true camera pitch scales wall height by about `cos(pitch)` while the ground squash is `sin(pitch)`.
   - `map_painter.js` draws heights with `HSTEP` and sits at its byte cap (7157 of 7168 B gzip).
   - The surgical route: the painter reads `G.wall` (default 1), and `geometry()` sets it from the tilt. Make room first by moving a block to `map_chunks.js`.
2. **Tap-to-walk direction uses the flat squash** (`openworld_page.js:181`, `CP.SQUASH`). At strong tilts a diagonal tap may pick the neighbouring hex. Fix: read `SQUASH * tilt`. `openworld_page.js` is a no-grow ratchet, so trade bytes inside the same line.
3. **The crab drifts a few pixels** (344 → 325 css px) while the map turns around it. Check whether the turn's anchor (`youx`/`youy`) is read one frame late, then glided.
4. **Tilt has no keyboard-only path besides the stick's arrows**, and no spoken state. Add the tilt to `map_view_joystick.js state()`.

Done when: walls rise as the ground lies down, a tap at tilt 0.6 walks to the hex under the finger, the crab stays within 2 px while turning, and the tilt is spoken.
