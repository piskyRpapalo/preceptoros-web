# The night of 2026-11-08 · the short tanda and the doors it opens

The Sovereign in chat, 2026-11-08: «una tanda corta inmediata medible (los quick wins) y el resto como misiones en el mapa».
Decree: companion `hilo/tasks/decreto-8nov-noche-20261108.md` (rows Q-01 to Q-10). Rule: search against HEAD before a new
row; what exists is enriched, not re-created. Each line below names the mission it enriches.

## Built in this PR (P-web noche, seal gq, stacked on #778)

| Row | What the visitor sees | Measured by |
|---|---|---|
| Q-01 | A node building within 2 hexes of the crab wears its name 50 % larger (11 → 16.5 px); a tap on the name opens its card | `near_label_cases` (sabotaged red first) |
| Q-02 | Ghost guardians walk a loop inside their hexagon (a frame count, no chance, no clock; still under reduced motion); within 3 hexes a «?» opens their profile: difficulty in words, reward NO_DATA until C8, never the army | `guardian_patrol_cases` (sabotaged red first) |
| Q-03 | Town is now Node (button, sheet title, Conquest mount) | `building_sheet_browser`, `map_drag_browser` |
| Q-04 | The heart leaf is now Help, with a «?» icon (the internal key stays `Welcome`, so no reader breaks) | `openworld_browser` |
| Q-06 | No «Sign adoption» button: a ready egg hatches by itself straight into the army; the adoption is still signed by the visit key, so the chain verifies | `visitor_eggs_browser` and three more duel guards |
| Q-09 | The crab's bubble rests minimized (its name only, a 44 px toggle); its line stays for screen readers; a guardian profile opens it | `preceptor_talk_cases` (sabotaged red first) |
| P2 | The pad in Acho: inked icons, a ledge that sinks on press, domed sticks | `pad_lift_cases` |

## Missions it enriches (no new file where one exists)

- **H1 · Help is the hub.** Enriches `openworld-welcome-live.md`, `tutorial-walk.md` and `play-without-node.md`.
  - Three answers: Who are you? (an ephemeral crab that can walk, call waves, fight and conquer), What is this? (a live map not
    so deep in the cloud, where sovereign nodes, real hardware, share a small window of communication; visitors earn an
    ephemeral space by fighting for it), What is it made of? (the structures and interactives).
  - Every download in one place: PWA, the chunked orchestrator, the app (no version until base v1 passes). The tutorial with its
    missions. A map of only ephemeral users with no node opens Echoes: NO_DATA (cause: Echoes not built).
- **A1 · Army in three parts.** Enriches `wave-army-face.md`. The call (a native musical ritual decodes the wave's silhouette
  before the full-screen summon; the sting of the app, task #10, is its seed), the workbench (skill costs, delete, dust, the
  wave's math beside its moving image), the cells (one energy cell per wave, level and true image).
- **W1 · Wave life (signed).** −5 % of a wave's life per combat; it heals per minute, full recovery in one hour, parameterized;
  the clock is the visit clock, declared, in page memory (decree Q-06). It extends the C8 garrison rule (−10 % per raid).
- **E1 · The online chat. GATED by Q-L1** (the privacy law of the first third-party data, la Mesa writes it, FIRMO makes it law).
  Enriches `chat-del-aula.md`, `openworld-aula-chat.md`, `chunked-chat-router.md`. Nothing is built before the law.
- **R1 · Radio on top.** Daughter of web #198: mute, voice commands (a blind-ready list, temporary NO_DATA), radio, help (a small
  semi-deterministic model for airplane mode). The audio leaves the pad buttons.
- **S1 · Settings that serve.** Enriches `settings-wheel.md`: switches with their costs, a background mode (a small persistent
  window; the phone answers its own way). L0 menu until FIRMO.
- **N1 · The Node refresh.** Enriches `live-colony-nodes.md`: a signed refresh when the crab crosses into another node.
- **RS1 · Rust is the new architecture (FIRMO, 2026-11-08: «Firmo todo lo que pueda ser en rust desde ahora»).** One workspace
  of crates with three outputs (WASM for the web, native for the app, a crate for A2A). First: the engine numbers, the C8 ledger,
  the fail-closed verifiers, the seal tooling. The rack's Python services are ported when they are touched.

Agent: claude-code · Model: claude-opus-5-5
