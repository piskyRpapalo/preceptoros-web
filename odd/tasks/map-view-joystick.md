# Commission · map-view joystick · RENDER

## Problem
The map supports drag to pan and pinch or right-button drag to change the view,
but a phone user cannot use a mouse to perform the same two-finger gesture and
the current six-direction pad is a visitor control, not a camera joystick.

## Outcome
One camera joystick at the lower left of the existing showcase works with
mouse, touch and keyboard. Its mode makes pan and view rotation/zoom reachable,
reusing the existing camera engines. The position and zoom are announced as
text. It does not create a visitor or alter the visitor's account.

## Affects
`map_drag.js`, `openworld_page.js`, a small same-origin joystick module, the
service-worker route list and existing browser gates. The other corner and
existing visitor controls remain until the separate visitor-unit piece lands.

## Constraints
One map, no new renderer, no external network. Preserve tap-to-engage,
existing camera limits and view state, zoom anchoring, reduced motion, pointer
cancel, capture and focus. Every operable target is at least 44 px. Keyboard
and screen-reader use must not require drag. Do not assign a SW seal; the Mesa
coordinates simultaneous web pieces. One piece, one draft PR; exact-head
signature and independent review before merge.

## Open questions
- Which zoom/rotation presentation does the real phone user prefer? Confirm on
  a physical device; browser emulation is not device evidence.
- How will the future visitor joystick coexist with the player strip at narrow
  widths? Defer that collision to the player/visitor pieces.

Sovereign's showcase commission in the chat; existing sources
`public/game/map_drag.js`, `public/game/map_zoom.js` and
`odd/tasks/la-mano-la-voz.md`. Claim buzon#53 ·6655298626.

## Local evidence · 2026-11-05

`CHROME_BINARY=/usr/bin/chromium node atlas/map_drag_browser.mjs` on Linux
x86_64: GREEN. Touch moved the camera by 30 pixels; keyboard moved it by 24;
mouse in turn/zoom mode produced 60 degrees and 1.25×. The visitor's walker
state stayed unchanged in each case. Existing one-finger drag, pinch, view
bounds, home and keyboard remained green. These are browser simulations, not
physical phone, FPS or screen-reader measurements.

`node --test atlas/map_zoom_colony_cases.mjs atlas/map_orbit_cases.mjs
atlas/f0_functions_cases.mjs`: 15/15. `node sw_harness.mjs`: 24/24.
`python3 bin/count_routes.py --check-doc DEPLOY.md`: 124 entries, 123 unique.
`NODE_OPTIONS='--test-reporter=tap' python3 -m unittest test_web atlas.test_atlas`:
124 passed, 1 skipped, 1 failure caused by the deliberately unsealed SW hash.
`bin/seal.py` dry-run proposes a version already contested by other drafts; the
Mesa must assign a distinct seal before this piece can be ready.

Follow-up: focused mode-switch arrows now control only the view as well; they
cannot bubble to the visitor walker. The browser gate exercises that path,
then resets and verifies the mouse gesture separately. The new dry-run hash is
`1754983e8c4fd8c3`; it is not a seal or an assignment.

Review follow-up: mode changes stop propagation before the map's chat-context
listener; the browser gate confirms selecting camera mode cannot impersonate a
new building context. The module remains unsealed pending the serial order.

## Cure by the Mesa · 2026-11-05

Codex ran out of tokens with the piece sealed `eb` over the old base (dz), so the
branch went dirty when #664 merged (main moved to ea). The Mesa rebased the
piece over main 43c4c563 as a new branch (no force-push to codex's branch) and
re-ran the seal cascade over the merged tree: `sw.js` VERSION ea→eb,
`counters.py`, `atlas/world.py`, `bin/seal.py --version
preceptoros-2026-25-eb --sellar` → measured huella `8e166ef1615c2128`. Local
evidence: routes 124/123 OK, SW harness 24/24, pure cases 15/15, python battery
125 pass / 6 skipped (browser gates need chromium) / 1 environmental failure
(`node_signature_verify` needs an OpenSSH binary absent from the Mesa sandbox;
green in CI). The claim ·6655298626 stays codex's; this cure only carries it
over the new base. Piece files are byte-identical to codex's head 4e0f2600.
