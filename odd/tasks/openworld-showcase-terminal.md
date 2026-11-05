# Commission · OpenWorld showcase and communication · RENDER

## Problem
The current page presents seven category panels and a fixed chat; on a phone
requesting a desktop viewport it can display two narrow columns. The Sovereign's
new commission replaces that arrangement with a map showcase, one leaf at a
time and a communication player between the lower map controls. Existing
place, radio, account, model and movement behavior needs to be sought and
connected rather than re-authored.

## Outcome
A readable teal showcase on phone and desktop; one map; adaptive leaves; a
communication player opened by its button; explicit visitor account and honest
node/user counts. A map-view joystick works with touch and mouse. A visitor
joystick waits for a movable account unit. Tools hosts downloads and models.
The click-to-engage camera, worm transition and context swap use existing
engines and building anchors when measured.

## Affects
OpenWorld terminal layout, controls, existing map/chat modules and landing
Tools. This commission is delivered as separately claimed pieces; this first
piece covers responsive showcase layout and palette only. Historic places
web#661 and audio web#662 are independent and not duplicated.

## Constraints
Keep one map, the user-selected building context, keyboard and screen reader
access, 44px interactive targets, reduced motion and forced-colors support.
No invented online visitor count, building assignment or model result. On
mobile, leaf content remains readable without compressing nameplates. Preserve
current working functions while migrating; no second renderer or unannounced
loss of keyboard access. Zero external requests on load.

## Open questions
- The signed flow contains an ephemeral visit key and movement controls; whether
  the key is bound to a countable movable unit must be measured end-to-end.
- Framing a visitor and building requires verified positions and the Descent's
  anchors; unavailable inputs report NO_DATA.
- Live ephemeral-account count has no measured source: NO_DATA.
- Radio speech and on-device screen-reader behavior require device evidence.

Reference: Sovereign's showcase commission in this chat; prototype
`scratch/openworld-prototype/panel.html` (layout and palette only);
`public/assets/openworld.css`, `terminal_panel.js`, `world_feed.js`;
claim buzon#53 ·6652436532, amended by showcase commission.
