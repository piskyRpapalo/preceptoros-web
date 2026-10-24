# Rebuild foundation inventory · 2026-10-26

Proposal input for Claude's one-shot. Bases: WEB `c48658a406f84d5fcf451992af21d91aed175486`; APP `7885afe88ad8a456d6af91aa08a62998818b5c9c`. This inventory does not authorize a rebuild. E8-final LIVE receipt: buzon#19/6376680966; Lane F closure: buzon#19/6377089352; prompt package WEB#294; paint WEB#295. Receipts support only their recorded scope.

## Pieces measured

| Component | Class | Keep/rebuild boundary; evidence |
|---|---|---|
| Bubble contract | MATH/TELEMETRY | Keep `preceptoros.bubble/1`, frame validation, deterministic inputs: `docs/bubble-language.md:1-27`, `public/game/bubble_language.js:1-80`, `public/game/creation_package.js:3,53`. Rebuild renderer/presentation separately. WEB#294 package contract; LF-1/LF-2 receipt 6376804981. |
| Bubble compiler and editor | HYBRID | Keep geometry/math (`bubble_language.js`, `gacha.js`, `valores.js`); rebuild SVG/canvas, controls, CSS, transitions (`bubble_paint.js`, `bubble_editor.js`). WEB#295 measured six games and four-channel simulated parity with letterboxing; physical touch is not evidenced here. |
| Semantic palette | MATH/TELEMETRY | Keep semantic roles/tokens in `public/game/comic_tokens.js:5-16`, `comic_accents.js:50-75`, `tabla_semantica.js`; replace skin without changing role. |
| Wave figures | MATH/TELEMETRY | Keep deterministic harmonics and points (`public/game/gacha.js`, `bubble_language.js:65-80`); renderer may change. Measure exact dependencies before extraction. |
| FM synthesis | HYBRID | Keep recipe math in `public/game/core.js:7-25,38-82` (carrier/modulator/index/envelope/LFO); Web Audio graph and mix are heard presentation. `audio_feedback_manager.js` maps cues to playback. LF-2 receipt 6376804981 says visual/audio fields are not interchangeable. |
| Web shell/game | CARBON-SEES/HEARS | Rebuild page hierarchy, panels, CSS, focus, SVG/canvas, transitions, labels and mix: `public/index.html`, `public/assets/thegame.js`, `public/game/`. Retain reviewed contracts/math, not wholesale UI. |
| Creation | HYBRID | Keep schema, signature and hashes in `docs/creation-package.md`, `public/game/creation_package.js`; rebuild creation surface in `public/creation.html`, `creation_flow.js`, editor. E8 LIVE receipt 6376680966 verifies one package path only. |
| Counters and seal | MATH/TELEMETRY | Keep `atlas/mundo.py`, `contadores.py`, `bin/sellar.py`, `config/sw-huella.txt`, `public/counters.json`; presentation of measurements is replaceable. |
| Offline routes | MATH/TELEMETRY | Keep `public/sw-listas.js`, `public/sw.js`, `bin/contar_rutas.py`, `arnes_sw.mjs`. LF-3 receipt 6377089352. Rebuild offline UX only with cache-contract coverage. |
| Deploy/faro | MATH/TELEMETRY | Keep `wrangler.jsonc`, `.github/workflows/deploy.yml`, `faro.yml`, `atlas/faro.py`; operator instructions/UI can change. No deployment was performed for this card. |
| App server/dispatcher | HYBRID | Keep validation, API schemas and measured state in `bin/preceptoros-pwa`, `orquestador.py`; rebuild `interface/app.html` and client shell. APP 7885afe8 includes local creation voice route, PreceptorOS#100 / receipt 6377404930. Resident-service behavior is NOT VERIFIED here. |
| App telemetry | MATH/TELEMETRY | Keep `metricas.py:2-17,39-47` (11 named measures and NO_DATA semantics); `consola.py:2-30,45-55` is a read-only `preceptoros.consola/1` view over local state. Rebuild how values are presented. |
| App channels/actions | MATH/TELEMETRY | Keep `canales.py:2-30,52-60` (append-only events/four threads) and `orquestador.py:15-24,40-60` (bounded intent/state checks). Terminal/chat UI is replaceable. |
| App local voice | HYBRID | Keep local generation/profile contract in `voz.py:2-10,70-91`, `voz_creacion.py:14-24,32-72`; generated waveform/player is heard presentation. `interface/creation_voice.js:34-48` requests local generation and presents audio/download. |
| App speech input | HYBRID | `oido.py:2-10,25-57` is local recognition/model path with explicit unavailable handling; waveform/transcript/status are presentation. Device/model availability NOT VERIFIED by source inspection. |
| MCP server | MATH/TELEMETRY | Keep JSON-RPC schemas, policy and bounds in `mcp_thegame_server.py:4-20,78-100`; client shell/terminal transcript is presentation. LF-5/6 receipt 6377089352 does not establish browser transport or resident service. |
| Haiku-era drawings | NO_DATA | Exact files, prompts and per-image provenance are not identified by this inventory. Candidate comparison seeds only after Claude verifies paths: `public/assets/codex_scene.js`, `bubble_bestiary.js`, `bubble_icons.js`. No style verdict is claimed. |

## Measurable “sounds like Bubble language” criteria

A drawing passes only with fixture evidence for each applicable criterion; this is not a subjective verdict:

1. Deterministic vector: zero raster payload; same input yields byte-identical normalized frame/primitives.
2. Every visible object is calculated from declared geometry/parameters; no opaque bitmap or untracked path. Exceptions are listed with cause.
3. Canonical UTF-8 frame size ≤1,024 bytes after serialization.
4. `preceptoros.bubble/1` validates with current contract/compiler (`docs/bubble-language.md`, `bubble_language.js`); unknown token/shape rejects with named cause.
5. Chroma is semantic: use roles from `comic_tokens.js`, `comic_accents.js`, `tabla_semantica.js`; record role-to-token mapping and preserve roles across skins.
6. If sound applies, trace a declared frame/state field through cue mapping to FM recipe in `core.js`. If none applies, say “none”. Never equate visual phase with audio phase (LF-2).
7. Transitions are deterministic and bounded; compare same geometry/event sequence across variants. Any timing difference must be explicit in fixture.

Existing evidence: Bubble/compiler cases, WEB#295 paint measurements, LF-2 receipt. The haiku-era asset-by-asset score is NOT VERIFIED until exact paths and provenance are identified and Claude runs the criteria.

## Three color-theme examples on one geometry

Proposed shared family-friendly fixture: rounded island, two expressive characters, path and collectible. Keep object IDs, primitive topology, coordinates, frame schema, event sequence and cue IDs identical. Change only semantic palette mapping and explicitly declared transition tokens.

| Variant | Palette/transition dimension | Candidate seeds |
|---|---|---|
| basic | neutral/front-door ink, paper and cyan roles from `comic_tokens.js`; shared reveal-and-settle timing | `bubble_icons.js`, `bubble_bestiary.js`, WEB#295 fixture |
| atlantis | water/depth roles selected from current semantic tables; preserve foreground contrast; same events/timing | `codex_scene.js`, `bubble_world.js`, `bubble_light.js` |
| zombie | friendly, non-gory semantic palette; same rounded silhouettes, faces and object count; same events/timing | `bubble_bestiary.js`, `bubble_icons.js`, comic token/accent tables |

Do not invent token names or colors: if current tables cannot represent a role, mark NO_DATA and propose a separate token extension. Haiku provenance remains NO_DATA until its exact files/receipts are found.

## One product: measurable terminal/chat parity

Web and app pass one shared conformance corpus when: (a) public persona/name/version match; (b) request/action schema, capability names, bounds and normalized statuses/errors match for identical fixtures; (c) refusals, consent and human-signature handoff are identical; (d) transcript records distinguish user input, preceptor response, tool result and cause in a common bounded form; (e) voice profile/cue IDs match when enabled and missing audio yields an explicit cause. Feed identical fixtures to both adapters and compare normalized records byte-for-byte. Measure keyboard, touch, screen reader and physical audio separately. Current sources (`public/assets/thegame.js`, `interface/app.html`, `bin/preceptoros-pwa`) are distinct; a shared conformance suite is not evidenced, so current parity is NOT VERIFIED.

## Claude one-shot sequence

1. Verify access to each measured piece and run its existing validator; record exact command/output.
2. Identify haiku-era drawing paths and provenance; score criteria above, with NO_DATA for missing evidence.
3. Produce basic, atlantis and zombie from one fixture; change only palette/declared transition values and compare geometry/frame bytes.
4. Stop at the first step requiring FIRMO. Seal: **ASIGNACIÓN PENDIENTE**.
