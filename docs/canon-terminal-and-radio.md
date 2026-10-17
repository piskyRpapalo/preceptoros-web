# Canon: terminal, cable and Radio chat

Migrated from D1 subject 10 at `codex/d1-asunto-9` (`44eef002`). Source line numbers refer to that parent tree. Section labels and working notes were not migrated.

## Terminal cable

- The visitor submits a bounded call through the page's existing `Enviar.paquete` door. The payload follows `atlas.nexo/1` and contains the declared action, text context, game coordinate, expected-state hash and game cycle. Its private key remains in the browser. Sources: `public/game/cable_llamar.js:1-16,19-44`.
- A missing game cycle, coordinate, vector or send channel produces a no-reading result. A response is displayed as a receipt; a rejection is rendered with its cause. A queued response does not establish publication. Sources: `public/game/cable_llamar.js:36-62`.
- The terminal reports age in game cycles. Public metrics are displayed only when the supplied map data contains them; absent metrics remain unavailable. A stale value is not presented as fresh. Sources: `public/game/cable_terminal.js:1-12,22-48`.
- The chat uses the existing accessible status surface and its live region. The cable adds a large, keyboard-focusable action. Sources: `public/game/cable_terminal.js:1-12,51-52`.

## Written Radio

- The written chat complements the procedural Radio; it does not replace it. Every message carries a speaker, semantic seal, source, game cycle and text. The data attributes expose that same structure to readers that inspect the document tree. Source: `public/assets/radio_message_log.js:1-14,37-45`.
- `LIVE` describes a current local game state; `STALE` marks a live message whose age exceeds the configured cycle limit; `NO_DATA` marks an unavailable measure; `SIMULATED` marks narration rather than a measurement. Cycle age uses the game state, never a wall clock. Sources: `public/assets/radio_message_log.js:1-10,21-43`.
- The chat records existing status messages rather than inventing them. It identifies the containing accessible panel as the source, ignores a repeated adjacent message from the same source, and retains a bounded history. Sources: `public/assets/radio_message_log.js:55-89`.
- The chat starts folded so it does not consume the game view. Its channels without a measured feed retain an explicit unavailable state. Sources: `public/assets/radio_message_log.js:1-14,90-120`.
