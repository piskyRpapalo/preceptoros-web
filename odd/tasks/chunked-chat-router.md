# Chunked chat router

Date: 2026-10-28
Law: NORTE 8 chat-router commission after web#363; Sovereign's 2026-10-28 watchword authorizes building and pushing a proposal branch while exact-head signature gates the merge. Lab#104 supplies the measured chunk transport contract. No receipt ID was attached to the watchword.
Status: IN_PROGRESS · feature branch `mistral/chunked-chat-router-20261028` · propose/build only; no merge or deployment.

## Objective

Connect the lower OpenWorld chat to a deterministic local router. A recognized decision may point to an existing, measured shortcut. A proposal may return only an exact, source-pinned canon chunk. The router writes assistant output through `AtlasRadioChat.dice({quien, fuente, sello, texto})`. It never invents prose, performs a shortcut, mutates game state, or calls a service.

## Problem and why

Web#363 is merged in web main at `ef38a28924e2958275ca530b87ff854e793cac56` (merge commit); its `face_terminal.js` mounts the radio log on the world face. The lower panel at `/openworld/` is still a separate seam: `public/openworld/index.html` has a disabled `#pregunta` field, a placeholder `#registro`, and does not load `radio_message_log.js`. The merged face terminal does not wire the OpenWorld form.

The Lab proof establishes a local, deterministic, consented chunk loader and a classifier fixture. It explicitly does not establish production weights, production response mapping, or world integration. The task is to join those measured transport boundaries to the already-live chat without converting fixture output into a claim of live model knowledge.

## Scope

- Add the OpenWorld chat adapter and its visible/accessible load, progress, answer, and failure states.
- Keep model metadata visible before any weight request: same-origin source, total bytes, each chunk's size, byte offset, and SHA-256. Only the explicit **Download and verify** action may fetch and cache weights. Loading a cache never fetches.
- Verify each downloaded chunk's declared length and SHA-256 before cache write; re-verify cache reads before classification. Any absent, corrupt, unavailable, or unrecognized input produces `NO_DATA` with its stable cause and no fallback fetch.
- Keep classification and answer selection separate. Decision classes can select an existing measured shortcut for the human to activate. Proposal classes can select only an exact canon chunk with a source locator and digest. Neither path generates prose or activates a control.
- Feed the result to `AtlasRadioChat.dice` with the existing four-field contract. Keep the visitor's raw input transient in the current form/DOM; do not send it to a Worker, persist it, or append it to the shared radio log. `dice` receives only a fixed answer or cause-bearing `NO_DATA`.
- Keep all current model results `SIMULATED` until a production model, taxonomy, response sources, and quality are independently measured and accepted. The classifier's category alone is not evidence for `LIVE`.
- Leave Workers, remote inference, signatures, actions, and telemetry outside this feature.

## Constraints

- Use the Lab#104 same-origin contract: four declared files of 6,250,000 B each (25,000,000 B total, 23.84 MiB); each deployed file remains under 25 MiB. These are proof dimensions, not a production model commitment.
- Source pieces remain under 16,384 B; channel output remains strictly below 1,024 UTF-8 B. Bound input as the Lab fixture does and fail closed on overflow, attacks, ties, unknown categories, missing mapping, or missing evidence.
- Do not preload weight files or let a cache miss trigger a request. Do not present SHA-256 as publisher authentication: the Lab contract states it verifies bytes against the manifest, not who published that manifest.
- The interface has visible state and a screen-reader announcement for each transition: consent required, downloading, verifying, ready, and cause-bearing failure. No sound starts without user consent.
- English public text only. No device or private-path identifiers. No banned vocabulary. No live Worker, deployment, or content change to the face terminal.
- The model data in Lab#104 is marked synthetic. Keep that seal visible; do not call the classifier a production model or its fixed fixture text a measured answer.

## Checklist

- [x] C1 · Pin the merged chat API, OpenWorld seam, and Lab#104 contract; record the live baseline below.
- [x] C2 · Define the decision/shortcut and proposal/canon split, no-action boundary, consent path, and fail-closed behavior.
- [ ] C3 · Add a source-backed response catalogue; every shortcut must resolve to an existing measured control and every proposal to a canon chunk with a pinned source. Unmapped categories remain `NO_DATA`.
- [ ] C4 · Wire the OpenWorld form to the local chunk classifier and `AtlasRadioChat.dice`; raw visitor text never enters the radio log, cache, or network request.
- [ ] C5 · Show origin, exact sizes, offsets, and hashes before consent. No weight request before the explicit action; cache-only load never requests.
- [ ] C6 · Verify every chunk and cache read; sabotage missing, short, corrupt, wrong-manifest, tie, attack, oversized input, and absent mapping. Each must return stable `NO_DATA` without fallback.
- [ ] C7 · Keep result and state transitions visible and announced. Repeat same-input tests and hash receipts twice.
- [ ] C8 · Update route/size/service-worker measurements and bump `VERSION` for the published asset change. The 2026-10-28 Sovereign decree permits preceptors to bump and measure against LIVE; this feature branch does not deploy.
- [ ] C9 · Run gates n=2; check SCRUB, size limits, and live smoke only after the accepted head is deployed by the authorized release path. Record `NO_DATA` for anything not measured.

## Verification evidence

- Lab proof source: `lab` main `36019b0ba0580c0f5be11942625986604bd837bc`, `proposals/chunked-web-proof-20261028/CONTRACT.md` (blob `3776a73d5dc31374315e90df9290e718eef49e38`). The contract says: “Only the explicit **Download and verify weights** action starts those requests.” It also says each chunk is checked before cache use and cache misses never download.
- Lab measurement: `proposals/chunked-web-proof-20261028/RECEIPT.json`, same Lab revision. Two browser runs at 2026-10-28 00:13:25Z and 00:13:26Z on Linux x86_64 / Chrome 155.0.8059.39 measured 0 weight requests before action, 25,000,000 received bytes in four 6,250,000 B chunks, cache miss `cache_chunk_missing`, and repeated output SHA-256 `605e71b9dc8e0cbdcee1150f61d00bc2659c9ba9f9a217e6ce030788c04b2dde`. The receipt marks output as a fixture and live integration as `NO_DATA` at that revision.
- Web source: `public/face/face_terminal.js` and `public/assets/radio_message_log.js` at web main `ef38a28924e2958275ca530b87ff854e793cac56`; the terminal calls `C.dice` and the module owns `AtlasRadioChat.dice`. OpenWorld markup and disabled form are in `public/openworld/index.html` at the same revision.
- Live smoke: 2026-10-28, curl + Chrome 155.0.8059.39 on Linux x86_64. `/openworld/` returned HTTP 200 with its chat input disabled. `/face/basic` returned HTTP 200; the terminal mounted open with 3 tabs. A local synthetic submission appeared as `You · LIVE` and returned `Preceptor · NO_DATA` (“No model is connected…”). Live `sw.js` served `preceptoros-2026-17-abka`; the chunk model is not yet deployed. This tests the live chat terminal, not the new router.
- Production shortcut catalogue, canon-chunk set and source receipts, publisher authentication/rollback policy, trained weights/license, moderator coverage, browser cache quota/eviction, and model quality: `NO_DATA` with cause: no accepted production catalogue, source manifest, model, or measurement in the pinned Lab proof.
- Local doctrine fingerprint and scope digest are recorded in `docs/receipts/norte8-chunked-chat-router-20261028.json`.

## Standing signature

No additional signature is needed to build this feature branch or record this task. The exact web#363 FIRMO line was found in buzon#30 comment `6458382463` and its HITL rerun passed for head `913e7f3a3db571be6cfaa75e08b64e67ce0c847b`; web#363 merged at `ef38a28924e2958275ca530b87ff854e793cac56`. This does not sign the new head. The new feature's merge still requires its own exact-head HITL/FIRMO.

## Methodology relief

PROPOSED · INTANGIBLE, not applied to standing doctrine: keep classifier result, source evidence, and radio presentation as separate fields in the router boundary. `AtlasRadioChat.dice` is a presentation/log sink, not a decision authority. Its call receives only a fixed answer or a cause-bearing `NO_DATA`, never raw visitor text. This avoids mistaking a message that was displayed for a measured decision.

## Log

- 2026-10-28 · Re-anchored web#363 without rewriting its signed commit; after the exact-head signature, the Desk merged it. The live smoke confirmed the deployed chat panel, while its answer remains `NO_DATA` until the router is built and released.
- 2026-10-28 · Lab#104's four-class classifier is synthetic. Its proof demonstrates byte verification and deterministic transport, not the requested production shortcuts or canon catalogue. No category-to-content mapping is assumed by this card.

## Next step

Build C3–C7 on this feature branch using only source-backed mappings; leave every unmapped path as `NO_DATA`, then run the full gates n=2 before proposing the exact head.
