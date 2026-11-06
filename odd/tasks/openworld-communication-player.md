# Commission · OpenWorld communication player · VOICE

## Problem
The OpenWorld map and fixed chat occupy competing screen regions; the existing
Radio, Chat and Echoes controls live in a separate collapsible element.

## Outcome
Opening communication reveals a lower-centre player over the single map,
between movement controls, with the existing channels, conversation and message
composer. One active leaf at a time; when closed the player does not obscure
the map. Phone and desktop retain usable layout and accessibility.

## Affects
OpenWorld terminal placement, radio/chat mount, panel selection and CSS. Existing
message handlers, voice attribution, ephemeral session and single map remain
shared with the existing code.

## Constraints
Reuse the existing radio and composer; no new renderer, fabricated account,
message, node or audio. Label unavailable services as NO_DATA; preserve explicit
send and keyboard focus. No external requests on load. Honor forced colors,
reduced motion and the user's chosen input mechanism. Coordinate with #663
palette and other SW seals. One piece/PR, propose-only, no deploy.

## Open questions
- Which channels are genuinely live after the player opens? Measure separately.
- How will the later view joystick and visitor joystick reserve their corners?
- Physical phone, screen-reader and rack audio behavior: NO_DATA until measured.

Sources: Sovereign showcase commission in chat; `public/game/terminal_panel.js`,
`public/assets/radio_message_log.js`, `public/game/map_chat.js`,
`public/openworld/index.html`, `public/assets/openworld.css`.
Claim buzon#53 ·6655321947.
