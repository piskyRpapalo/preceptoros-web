# Commission · openworld controls retirement · RENDER

## Problem
Two controls clutter the showcase: the six-direction walk pad over the map and
the page-level arrow-walk. After the map-view joystick (eb) the pad is
redundant camera clutter, and the doc-level arrow keys walk to the crab
("cangrejo") instead of moving the view, which reads as a bug to the player.
Contract #667 already decreed: the six-direction pad and the arrow-walk go to
the corners the map-view joystick and the node places occupy.

## Outcome
The six-direction pad and the page-level arrow-walk are retired from the
openworld showcase. Walking is a tap on a hex, a node place in the Map panel,
or Enter on a focused place; the view joystick (map_view_joystick.js) owns the
arrows while focused. The Skip tutorial button, the free-walk checkbox, the
zoom plate (the Explore button lives inside it), the node list panel, the
zoom/rotation keys and tap-to-step all stay. Honest copy says "tap a hex to
walk" and no longer promises arrow-key walking. The arrow-walk retirement is
the Sovereign's decision, served by the Mesa; the visitor without a joystick
is served by tap-to-engage and the node places, and the future character
joystick remains gated behind the ephemeral account.

## Affects
`public/game/colony_controls.js`, `public/assets/openworld.css`,
`public/openworld/index.html`, `public/game/building_chat.js`,
`public/game/web_node_brain.js`, the SW seal cascade (sw.js, counters.json,
atlas-world.json, config/sw-huella.txt) and the browser gates
(walk_keys, openworld, eye_carbon, map_wide) with their node tests.

## Constraints
One map, no new renderer, no external network. Every operable target stays at
least 44 px. Keyboard and screen-reader use must not require drag or a removed
control; the noInvisibleTargets law keeps forbidding proxies over the canvas.
The keyboard node law (Enter walks on node places) is preserved and re-measured.
The page weight of index.html must not grow. One piece, one draft PR; exact-head
signature and independent review before merge.

## Open questions
- Does the real phone user prefer the panel node places or tap-to-engage as the
  primary walk path? Confirm on a physical device; browser emulation is not
  device evidence.
- The character joystick (walking with the stick) stays gated behind the
  ephemeral account's first signature, per the standing contract.

Sovereign's decree in the chat ("Hazlo todo"), claim buzon#53 ·6658822854,
contract #667 "the six-direction pad… go to the corners these two occupy".
HEAD confirmed live before deleting: main a3159102 deployed, faro 191/191.
