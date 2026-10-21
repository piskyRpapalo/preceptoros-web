# Web audio census — 2026-10-21

Base `21ae1e831fb16ecc89540afb509c5c34891025c9`; Chrome headless on loopback; 44.1 kHz mono `OfflineAudioContext`; two fresh runner processes, each with a page reload. This measures browser synthesis, not physical listening; output state is SIMULATED unless NO_DATA is shown.

## Results

| Path | Channel B | Run 1 waveform SHA-256 | Run 2 waveform SHA-256 | Reload | Status |
|---|---:|---|---|---|---|
| `AtlasDescentSound/PRECEPTOR` | 947 | `37b8349b1e1f525721b5e91688d76c5dbcdf6b8819ceaa4f213f994fa0693ede` | `c2cc83f2951667eaf80244de797f179e58df814c227e9bd05fe565f05086883b` | RED: differs on reload in both runs | RED |
| `AtlasDescentSound/REFUGE` | 946 | `b6da392412fb384f999b78bba9a73320334080155433492b5a2cd0d885f87896` | `1c975d409bc5be34c32bf909fa067f020d4f28a43f169f76f6789a35e4e10507` | RED: differs on reload in both runs | RED |
| `AtlasDescentSound/SUMMON` | 801 | `fe0d4934b73ed8379387f5f2a3b387ff4374e1fb8814848267705ca0b7b2ebfa` | `9d7adbcfe00ef1ae4e01d29a99ea5dc82f03a5add31b55bbe69d9ee37b487c7a` | RED: differs on reload in both runs | RED |
| `AtlasDescentSound/ARMY` | 799 | `430b3d1110826a31f40b4b087bd7e372e502ccc09c0969c3c1a6d8da24dd1db0` | `430b3d1110826a31f40b4b087bd7e372e502ccc09c0969c3c1a6d8da24dd1db0` | RED: differs on reload in both runs | RED |
| `AtlasDescentSound/BATTLE` | 801 | `1a413c14b9a64ed94178ecd2ad5282ee67682504aaf0b001aa4e27146be89f0f` | `6a96f017cce3786836a7eeefa7c861a91748b40213c854d7e4ffca2ca4eb87a9` | RED: differs on reload in both runs | RED |
| `AtlasDescentSound/RIFT` | 787 | `e88167fa323aa38e28d42d2e66e742572dbdebe5984b960a79e2392193180fe6` | `bdeefa69b089696701d9cc7110c139fc1615b4169395182d79f94fa7b245d974` | RED: differs on reload in both runs | RED |
| `radio` | 100 | `6c71aa7b8860c38dd7aaa991707c1442cda0b0a57d33c12f9ae91a37fd35c232` | `6c71aa7b8860c38dd7aaa991707c1442cda0b0a57d33c12f9ae91a37fd35c232` | equal | SIMULATED |
| `AtlasTarjetaCantada` | 226 | NO_DATA | NO_DATA | equal NO_DATA on reload | NO_DATA: Web Audio no disponible o sin opt-in del visitante |
| `feedback` | 160 | `e2c904d692e4ad38a89f10057de61c940f0d34608510614e8ab0336e8f590b99` | `e2c904d692e4ad38a89f10057de61c940f0d34608510614e8ab0336e8f590b99` | equal | SIMULATED |

All serialized channels are 100–947 B (<1,024 B); each channel digest stayed equal across reloads and fresh processes. The raw rendered PCM (467,460–1,411,200 B per track) is discarded after hashing. The six Codex frame recipes are stable, but all six PCM hashes change across reload despite identical recipe SHA-256: waveform determinism is RED. The state-radio and feedback waveforms are SIMULATED, not device playback. The card melody is MEDIDO as a recipe (226 B), but `canta()` returns NO_DATA.

## Measured causes and limits

- Source sizes: `descent_sound.js` 5,118 B; `aiact-art50-state-radio.js` 5,991 B; `tarjeta_cantada.js` 2,817 B; `audio_feedback_manager.js` 5,568 B; `core.js` 4,639 B. All five are below 16,384 B.
- `descent_sound.js:34-57,88-110` makes stable voice recipes and starts native oscillators without a declared phase; the measured recipe hashes match while rendered sample hashes differ. The phase cause is a source-level hypothesis, not proven by this census.
- `aiact-art50-state-radio.js:4` has five pentatonic intervals and a declared 300 ms step at `:62`; no five-block, 1,024-byte wavetable exists in the measured source. NO_DATA for that requested structure.
- `tarjeta_cantada.js:43-45` calls `S.activa()` as a read; `core.js:44-52` sets `activo = !!si`, so a no-argument read turns audio off. Result: NO_DATA with the returned cause; no source fix included.
- Physical-speaker output and Doogee playback: NO_DATA; this harness renders offline and never opens a device speaker.
- Existing baseline: `atlas/descent_sound_casos.mjs:94-111` uses a fake context; `tests/tarjeta_cantada.test.mjs:51-55` expects browser audio to be unavailable in Node. Neither produced a waveform hash.

## Harness and safety

Harness files: `atlas/ojo/oido_web.mjs` 8295 B; `atlas/ojo/fixtures/oido.html` 6475 B. Every source file is below 16,384 B. External requests: 0 in both runs. Sabotage probes: unstable hash, 1,024 B channel, and undeclared clock all rejected (3/3); a one-off scrub found zero prohibited-word hits in the three changed files; all seven synthetic detections passed.

No served runtime file changed; no service-worker reseal. The web lexicon remains PROPOSAL.
