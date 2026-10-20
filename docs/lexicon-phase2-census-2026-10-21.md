# Phase 2 visual and text census — 2026-10-21

Base: `21ae1e831fb16ecc89540afb509c5c34891025c9` (`origin/main`). Measurement ran from a fresh worktree, loopback-only, Chrome headless, viewport 412×915. This is a census, not a canon declaration; `docs/lexicon.md` remains PROPOSAL.

`HABLA` means a browser PNG was captured for that HTML route; it does not certify wording or design. The hash is SHA-256 of the saved PNG. Reload equality is reported separately. `NO_DATA` means the eye could not satisfy its viewport contract. For source modules, a module is not an independently navigable surface: frame attribution is therefore NO_DATA rather than guessed.

## HTML routes

| Route | HTML B | Frame SHA-256 | State | Reload |
|---|---:|---|---|---|
| `public/ar/index.html` | 3539 | `NO_DATA` | NO_DATA: eye measured 1648×3660, expected 412×915 | NO_DATA |
| `public/de/index.html` | 3532 | `ff3bec04c74f05a8cfc3fbd3010e23e92ccda4bd0c62f37acd7ab69532b4bd14` | HABLA | yes |
| `public/el/index.html` | 3541 | `f8953d7ebdfb13667c92c95c5c3119d3c061aff8d1d570182adbc0bdee916a67` | HABLA | no |
| `public/en/index.html` | 3532 | `4c8fca8717f25aee7c958736f7cdc0466f26f0f88896744b66a1da49dcc72ecc` | HABLA | no |
| `public/es/index.html` | 3533 | `e1103e66c4ba4c3878cec0ef3c0137d8cd2d93ee3e5c678ceffe4836b2977a89` | HABLA | no |
| `public/fr/index.html` | 3534 | `95cf8e622ff8d48284553a9b86a5a851c302d18827a9a41428f787e982766cf2` | HABLA | no |
| `public/index.html` | 3506 | `4c8fca8717f25aee7c958736f7cdc0466f26f0f88896744b66a1da49dcc72ecc` | HABLA | yes |
| `public/it/index.html` | 3533 | `47190f637d3dabad08a697d310ea1ab49580845aeb1a5d38cc538cba5f81f05d` | HABLA | yes |
| `public/pt/index.html` | 3535 | `e1103e66c4ba4c3878cec0ef3c0137d8cd2d93ee3e5c678ceffe4836b2977a89` | HABLA | no |
| `public/ru/index.html` | 3539 | `08883e50f7b2ad868c5869a2e287629230f14dd922e613e1589da31044184095` | HABLA | no |

The nine captured routes include the root page and eight language routes; root and English produced the same PNG digest. Arabic is the only route without a PNG. A captured image is evidence of visible output, not stable pixels: six routes differ after reload in the current run.

## Existing eye canvases, re-measured

`ojo_palabras.mjs` measured 15 canvases; second pass after reload and a second fresh process produced the same full PNG digests; causes=0. PNG bytes and full SHA-256:

| Canvas | PNG B | SHA-256 |
|---|---:|---|
| `bout-BOUT` | 60777 | `a23b21b039782b4e0ee796beaa05833d4947f9ca86e0da9a0e567b9056f17d08` |
| `bout-SILENCE` | 75080 | `03ade4f92f3998bff4e4ef4a719ded5a7287d866f205337f013e53695a3b1bfa` |
| `bout-SLEEPERS` | 56887 | `6c5b8cb1dc3b52de85a77677fe4b2f22375d2a82d36c9a80e6d09b428dac6a47` |
| `bout-WAKE` | 52933 | `10bf3d14987a386d7d6ef1c47b7d5785a99afe0d55ae9c474fc9ae49f4864d2c` |
| `busto-despierto` | 35716 | `a3ab475a5aa558566d190a750404be8f4c8ea9b3dbe611a70c8a3353244eede7` |
| `busto-dormido` | 35081 | `90d8410c2b78be83224a3188586e087a15ad529edf99cf7178fa2d5460e4754e` |
| `busto-feliz` | 25313 | `67319daad18e75a03e7b8588793fd7bf2bb8c5a5620f8b4960ccc97a22f6746d` |
| `cangrejo-abierto` | 26199 | `0cdc93cd7efb482b5d8e6653c85d4d4844000f3f09b61a85373f9ed4b1615fed` |
| `cangrejo-arriba` | 26169 | `9c7dded7c3efb5c65321811e5b63430a0f98a192261f9dc4ea7da2d951b06476` |
| `codex-ARMY` | 82369 | `574abdfde5942d819270d4e867ab33b17ed67e7c6b3d368b0ae15639324a4410` |
| `codex-BATTLE` | 67689 | `bb7aa019649c47bc07c3a736fe90cb2f4bd1d37d031f2779a0b69d0552496a8d` |
| `codex-PRECEPTOR` | 77983 | `9eacc5f1f68b8014633e2f88451f0ede0e8b54d74686f25e739ebb001166efe3` |
| `codex-REFUGE` | 92778 | `e437f287f83d141a41c182c5ed014922820ac0cd1811c65bd991c06f2b5d0650` |
| `codex-RIFT` | 48099 | `68db1e136df0674ccdb090a8af61303c22796c0d79c646f51c8a9e20275818ea` |
| `codex-SUMMON` | 80935 | `92d4490942cd6ae580984da9312c4ca828520c98873eb1161c8f5c2709c2e0f5` |

The `public/game` inventory is in [`lexicon-phase2-module-inventory-2026-10-21.md`](lexicon-phase2-module-inventory-2026-10-21.md): 128 modules, byte-measured; module-level frame attribution remains NO_DATA with cause.

## Public text and records

Public text assets and repository documentation were inventoried by path and bytes. Markdown and plain-text sources are not rendered by the measured PWA route, so no PNG is attributed to them; their visual status is NO_HABLA for this browser surface, not a claim that the text is unreadable.

| File | B | Status |
|---|---:|---|
| `public/downloads/README.md` | 2001 | NO_HABLA: plain text, not rendered in sampled PWA |
| `public/llms.txt` | 7850 | NO_HABLA: plain text, not rendered in sampled PWA |
| `public/robots.txt` | 539 | NO_HABLA: plain text, not rendered in sampled PWA |
| `docs/ESTADO.md` | 13737 | NO_HABLA: repository document, not rendered in sampled PWA |
| `docs/INDEX_RENAMING.md` | 6318 | NO_HABLA: repository document, not rendered in sampled PWA |
| `docs/MVP.md` | 8986 | NO_HABLA: repository document, not rendered in sampled PWA |
| `docs/New_Naming_Proposal.md` | 12649 | NO_HABLA: repository document, not rendered in sampled PWA |
| `docs/New_Naming_Proposal_2.md` | 10503 | NO_HABLA: repository document, not rendered in sampled PWA |
| `docs/T1_remedida_zoom.md` | 3044 | NO_HABLA: repository document, not rendered in sampled PWA |
| `docs/Visual_Theme_Proposal_1.md` | 7536 | NO_HABLA: repository document, not rendered in sampled PWA |
| `docs/bubble-language.md` | 14057 | NO_HABLA: repository document, not rendered in sampled PWA |
| `docs/canon-arena-and-duels.md` | 15169 | NO_HABLA: repository document, not rendered in sampled PWA |
| `docs/canon-context-hygiene.md` | 3073 | NO_HABLA: repository document, not rendered in sampled PWA |
| `docs/canon-house-maths.md` | 5069 | NO_HABLA: repository document, not rendered in sampled PWA |
| `docs/canon-house.md` | 18565 | NO_HABLA: repository document, not rendered in sampled PWA |
| `docs/canon-identity-and-signatures.md` | 17102 | NO_HABLA: repository document, not rendered in sampled PWA |
| `docs/canon-laws-of-the-world.md` | 17882 | NO_HABLA: repository document, not rendered in sampled PWA |
| `docs/canon-map-and-painter-2.md` | 14310 | NO_HABLA: repository document, not rendered in sampled PWA |
| `docs/canon-map-and-painter.md` | 21325 | NO_HABLA: repository document, not rendered in sampled PWA |
| `docs/canon-map-panels.md` | 2475 | NO_HABLA: repository document, not rendered in sampled PWA |
| `docs/canon-node-evidence-and-account.md` | 2166 | NO_HABLA: repository document, not rendered in sampled PWA |
| `docs/canon-node-trust.md` | 1091 | NO_HABLA: repository document, not rendered in sampled PWA |
| `docs/canon-nodes-and-npc.md` | 3250 | NO_HABLA: repository document, not rendered in sampled PWA |
| `docs/canon-saving-and-records.md` | 2837 | NO_HABLA: repository document, not rendered in sampled PWA |
| `docs/canon-service-worker.md` | 8660 | NO_HABLA: repository document, not rendered in sampled PWA |
| `docs/canon-summons.md` | 2461 | NO_HABLA: repository document, not rendered in sampled PWA |
| `docs/canon-terminal-and-radio.md` | 3849 | NO_HABLA: repository document, not rendered in sampled PWA |
| `docs/canon-tutorial-entry-and-audio.md` | 2001 | NO_HABLA: repository document, not rendered in sampled PWA |
| `docs/canon-ui-and-i18n.md` | 3389 | NO_HABLA: repository document, not rendered in sampled PWA |
| `docs/canon-vector-and-wave.md` | 4738 | NO_HABLA: repository document, not rendered in sampled PWA |
| `docs/canon-workshop.md` | 7104 | NO_HABLA: repository document, not rendered in sampled PWA |
| `docs/en301-tutorial-building-receipt.md` | 2452 | NO_HABLA: repository document, not rendered in sampled PWA |
| `docs/figures-index.md` | 3316 | NO_HABLA: repository document, not rendered in sampled PWA |
| `docs/img/chat.webp` | 117108 | NO_HABLA: repository document, not rendered in sampled PWA |
| `docs/img/install.webp` | 64430 | NO_HABLA: repository document, not rendered in sampled PWA |
| `docs/img/phone.webp` | 77064 | NO_HABLA: repository document, not rendered in sampled PWA |
| `docs/img/puerta.webp` | 56908 | NO_HABLA: repository document, not rendered in sampled PWA |
| `docs/lexicon.md` | 14191 | NO_HABLA: repository document, not rendered in sampled PWA |
| `docs/node-p3-p4-inventory.md` | 8719 | NO_HABLA: repository document, not rendered in sampled PWA |
| `docs/node-p3-p4-plan.md` | 12384 | NO_HABLA: repository document, not rendered in sampled PWA |
| `docs/node-reception-contract.md` | 4956 | NO_HABLA: repository document, not rendered in sampled PWA |
| `docs/node-signature-verification.md` | 5205 | NO_HABLA: repository document, not rendered in sampled PWA |
| `docs/pruebas-retiradas/cabezal_cajas.mjs` | 5712 | NO_HABLA: repository document, not rendered in sampled PWA |
| `docs/pruebas-retiradas/mudanza-b1.py` | 38823 | NO_HABLA: repository document, not rendered in sampled PWA |
| `docs/pruebas-retiradas/mudanza-b3.py` | 180802 | NO_HABLA: repository document, not rendered in sampled PWA |
| `docs/terminal-ejemplo1.html` | 41233 | NO_HABLA: repository document, not rendered in sampled PWA |

## Harness correction and limits

Before correction, `node atlas/ojo/ojo_palabras_casos.mjs` failed: the positive case reported 11 canvases and a missing combat scene. The fixture omitted `combate_ticks.js`; the eye also treated a non-empty `causas` list as success. The fixture now loads that dependency, the eye fails closed on causes, and the positive case requires at least 15 PNGs. Current result: 15 canvases, reload identical, zero causes; the synthetic nondeterminism case remains expected-red.

This census does not mark the lexicon canonical. Module-level HABLA/NO_HABLA, individual documentation screenshots, stable reloads for every language, and mobile captures are NO_DATA until a dedicated attribution/reader path exists. No public runtime files were changed.
