# Offline audio investigation · 2026-10-21

Base: `0b5da04`. Proposal; native mixed PCM remains NO_DATA: no browser in this environment.

| Source | Observation | Consequence |
|---|---|---|
| `public/game/descent_sound.js:27-29,78-84` | Frame hash seeds xorshift; buffer length uses context rate and floored duration | Same frame and declared rate give deterministic noise; changing rate changes the sample count |
| `public/game/descent_sound.js:90-100` | Noise duration was computed as stop minus start | At 44,100 Hz the test voice yields 83,790 samples at start 0, but 83,789 at start 1,000; cancellation loses a sample |
| `public/game/descent_sound.js:95-110` | Native oscillators, gain automation and absolute scheduling remain delegated to Web Audio | Native mixed waveform is not measured by the offline test |
| `public/game/aiact-art50-state-radio.js:6-8,39-43,57-63` | Note recipe is pure; playback uses 300 ms timers | Callback delay can shift playback; no hidden random seed was found |
| `public/game/aiact-art50-state-radio.js:66-74` | TTS selects a local English voice | Machine voice inventory is an explicit environmental dependency |
| `public/game/tarjeta_cantada.js:6-35,40-50` | ID hash and melody are pure; playback uses timers and calls activa without an argument | `core.js:44-45` disables audio on that call; this is a separate deterministic failure, not random PCM |
| `public/game/audio_feedback_manager.js:54-68,81-98` | Recipe depends on input and opt-in/context state | It delegates oscillator timing to the shared synthesis module |
| `public/game/core.js:44-49,67-100` | AudioContext has no explicit requested rate; synthesis starts at currentTime | Device rate and scheduling matter for live output; this alone does not explain the earlier offline reload failure |

The #209 fixture already fixes `OfflineAudioContext` to 44,100 Hz and passes start 0 (`atlas/ojo/fixtures/oido.html:29,54-55`). Therefore rate variation between machines and start-time cancellation are not established explanations for all six reload failures. Native rendering remains unmeasured here; oscillator phase and summation order are hypotheses only.

Minimal code change: derive noise duration directly from its envelope, independent of absolute start. No new rate, seed or oscillator implementation is invented. The test executes the production noise loop; its Web Audio stubs do not synthesize oscillators, mix or emulate audible output.

`node atlas/audio_offline_casos.mjs` was red before the change. Afterward, two separate Node processes produce identical output SHA-256 `526073982d655b348e6575de607a21796b9ac25b387c0f40561ab8264af38cbc`. Six channel recipes remain 787–947 B. Changing the seed or rate changes noise; an injected recipe digest change is rejected by pair comparison. Existing descent cases pass twice. Noise samples are serialized explicitly as little-endian float32 before hashing.

Open 1: rerun native PCM hashes in a browser before closing #209's waveform finding. Open 2: the Mesa assigns the served-release seal; this draft does not assign one.

## Follow-up measurement · 2026-10-22

Two Chrome headless loopback runs confirmed the six recipe hashes match while all six native mixed-PCM hashes changed on reload. A source-isolation run found seeded noise-only PCM equal; the `OscillatorNode` mix changed. This rules out the frame seed, sample count, and wall-clock scheduling as the cause in this fixed-rate, start-zero fixture.

`descent_sound.js:88-113` now synthesizes sine, triangle, and seeded noise samples into one ordered 44.1 kHz buffer before Web Audio schedules it. With the fix, both separate browser runs returned the same PCM hashes for all six frames; no external request was seen. `atlas/descent_pcm_cases.mjs` also compares the production buffer across two context rates and start times.

Other source findings: `core.js:43-51,70` leaves the live context rate to the device and schedules at `currentTime`; `aiact-art50-state-radio.js:59-63` and `tarjeta_cantada.js:47-49` use 300 ms timers for separate notes. Those are live timing dependencies, not the cause of this offline reload mismatch. `audio_feedback_manager.js:81-98` makes deterministic recipes and delegates timing to `core.js`. The card still reports `NO_DATA` because `tarjeta_cantada.js:43-45` calls the state-changing `activa()` without enabling it; that is a separate issue and remains unchanged.

Cross-browser and physical-device PCM equality: NO_DATA (measured here only in this Chrome build at 44.1 kHz). Open 1: should byte equality across browser engines and devices be required? No evidence currently supports that wider claim.
