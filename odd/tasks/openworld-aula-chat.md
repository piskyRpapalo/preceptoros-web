# Commission · OpenWorld Aula chat · VOICE

## Problem
The OpenWorld composer reaches its device-local guide, while the existing
`classroom_chat.js` and Aduana `/api/v1/chat` implement a separate Hexelion
conversation. A visitor cannot explicitly select that remote conversation from
the map terminal. The visitor's existing account is owned by `visitor_play.js`.

## Outcome
A visitor can explicitly select Hexelion in the map terminal, send a turn
through the existing Aula protocol with their active ephemeral account, and
see an attributed answer or caused NO_DATA. The local guide remains selectable.
No request is made until the visitor sends a message.

## Affects
The OpenWorld terminal, its existing visitor account and the existing Aula chat
protocol; tests, precache seal and this declaration. No server or credentials.

## Constraints
One map and composer; no duplicate visit key, no hidden automatic sign-in,
no private endpoint or secret in browser; no silent retries except the existing
protocol's stale handling; safe text rendering, keyboard accessible controls,
explicit remote disclosure, frame and UTF-8 bounds. Live rack availability is
not implied by test fixtures. One PR; exact-head review and FIRMA before merge.

## Open questions
- Does the production Aula currently accept an authorized turn? NO_DATA until
  a deliberately initiated end-to-end test, without disclosing private content.
- What node-specific chat publication contract will the apps use? This piece
  connects the existing single Hexelion door only; node publication is separate.

Sources: `odd/tasks/ephemeral-visitor-charter.md`, `odd/tasks/chat-del-aula.md`,
`public/game/visitor_play.js`, `public/game/classroom_chat.js`,
`public/game/map_chat.js`; live heartbeat read 2026-11-05 via `/api/world-state`
returned one LIVE and two STALE nodes plus one building. CLAIM buzon#53
comment 6651798910.
