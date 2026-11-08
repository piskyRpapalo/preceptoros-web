# The last EMULADO marks (D1)

The duel canvas says SIMULATED since #758. Measured on 2026-11-08 with `git grep -n EMULADO public`:
- `public/game/nodes.js:8`, `public/game/sea.js:173` and `public/assets/radio_message_log.js:28` use EMULADO as a **data key** from the canon (MEDIDO / EMULADO / NO_DATA). The visitor never reads it: `radio_message_log.js` already maps it to «emulated».
- `public/game/nodes.js:31` returns a Spanish **sentence**, «EMULADO sin base o sin causa». If it reaches the screen, it breaks the English-only law.

Mission: trace whether that sentence is shown anywhere (inspector, panel, aria). If it is, give it an English sentence («simulated without a base or a cause») and keep the key. Leave the keys alone: they are the canon's vocabulary.

Done when: no Spanish sentence is visible, the keys are unchanged and the full gate is green.
