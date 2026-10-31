# Iron lane · map contracts and rack refresh

Date: 2026-10-31  
Status: PLAN · propose-only · implementation remains separately reviewed.

Authority: [buzon#30 ·6546901936](https://github.com/piskyRpapalo/buzon/issues/30#issuecomment-6546901936). The web chat copy belongs to the Claude lane; this plan does not edit it.

## Goal

Connect measured node presence to the one map and keep local chat fail-closed until its complete runtime is verifiable. Give each surface one contract source, then have the web, app and NEXO adapters consume those contracts. Plan the app service refresh to the exact current app head without migrating private rack data or restarting the service in this slice.

## Measured baseline

- Web `main` is `e466fe4f` (runtime integrity hard gate, #507); the deployed public endpoints were read on 2026-10-31.
- Android Chrome, fresh browser context: OpenWorld and map chat loaded. After the explicit load gesture, the worker reported `runtime_integrity_unavailable` because runtime, library and model configuration are not integrity-pinned. A submitted prompt returned `NO_DATA · model_not_installed`; no inference or answer quality was measured. The only post-gesture requests were same-origin worker/router assets; no external model request occurred.
- The live world-state and D7 read endpoints both returned HTTP 200, `preceptoros.openworld-estado/2`, `MEDIDO` coverage, and one `LIVE` row. This measures published presence only; it does not establish a chatbot-to-node identity binding.
- The inventory source is present on the rack, but its values were not read or copied. The process serving port 8740 has no `PRECEPTOROS_HEARTBEAT_NODES` setting, so its chatbot-to-node binding is `NO_DATA`.
- The app repository target is `main` `44cf577f` (#142). The separate app tree currently serving port 8740 is clean at `5b6c24f`, 84 commits behind that target; its HTTP entry point returned 200. No app files or service state were changed.

## One source per surface

| Surface | Contract source | Consumer rule |
|---|---|---|
| Published world state | Aduana's D7 publisher emits `preceptoros.openworld-estado/2`; the web reader `public/game/world_feed.js` validates it. | Keep Aduana the sole publisher and the web a reader. The app must not keep or publish a parallel colony snapshot. |
| D7 heartbeat request | Aduana validates `preceptoros.latido/1` at `POST /api/v1/latidos`. | Adapt a measured local observation to this request only after canonical identity, stable sequence and sender credential are configured. NEXO's `preceptoros.node-heartbeat/1-proposed` is a local proposal, not a second public D7 wire contract. No alias, cell or credential is inferred. |
| Map-brain status verdict | This task is the single ODD definition for the commission's four-field status envelope; an implementation PR must consume it instead of adding a second local schema. | Exact fields: `{choice, score, no_data, causa}`. If integrity or generation is unavailable, `choice=null`, `score=null`, `no_data=true`, and `causa` is a non-empty stable cause. Positive `choice` values and a `score` scale are not defined for this status surface; keep it fail-closed until a separately measured judge contract defines them. The web and app consume this same definition; neither creates its own rubric. |

Do not copy a contract into another repository as a separately maintained schema. If consumers need a generated or vendored artifact, it must be produced from one versioned source and checked against that source in CI. Runtime page loads remain same-origin and offline-capable.

## Build sequence

1. **Identity boundary.** Keep inventory values and sender credentials private. Measure the canonical sender-to-public-slot mapping from its authorized source, configure the Aduana receiver and the local app separately, and prove the missing-config path remains `NO_DATA`. Until both sides have the required reviewed configuration, no map row is bound to a local model.
2. **Verdict and runtime.** Keep #507's hard gate. Before enabling inference, pin and verify the runtime, every transitive runtime/WASM byte, and model configuration as well as the weights. Make the actual worker return the typed fail-closed verdict for every missing or corrupt dependency. Then measure a real Android response; synthetic fixtures do not count as conversation or quality evidence.
3. **Single map path.** Have one reader consume the Aduana v2 response and the one D7 publisher own liveness. NEXO remains an observation source; its adapter must not create a second state store, freshness clock, or public heartbeat schema.
4. **App refresh.** Create a clean worktree at `44cf577f`; preserve the currently served tree and its ignored local configuration/corpus. Run `./bin/pruebas` in the candidate tree, then start that exact tree on an isolated loopback port and check its health and core routes. Compare the route behavior and data boundaries before proposing a service switch. A rollback keeps the current service tree intact.
5. **Review and rollout.** Split the app refresh, contract/runtime changes, and any web UI work into separate PRs with exact heads and their own receipts. No service restart, model download, production configuration write, or merge is part of this plan.

## Acceptance evidence

- No canonical identity or node placement is inferred from a model name, inventory order, network label, or heartbeat alone.
- Aduana remains the only owner of D7 validation and published v2 world state; web/app/NEXO consumers use those contracts rather than reimplementing them.
- The verdict schema rejects missing causes, contradictory `no_data` fields, unknown choices, and scores without an approved scale. Integrity failure always yields a typed `NO_DATA` verdict before model execution or third-party fetch.
- A later conversation claim includes an Android run against the exact reviewed runtime, response status, elapsed time, and an independently labeled quality measure. Until then, conversation quality is `NO_DATA`.
- The candidate app tree is exactly `44cf577f`; its repository gate, isolated health smoke, privacy checks and rollback path are recorded separately from the currently running service.

## Open decisions and record

- Canonical public identity, coordinates and local-backend authorization remain `NO_DATA`; neither the live heartbeat nor the inventory presence supplies that join.
- The typed verdict's allowed `choice` set and `score` meaning/range need a measured judge definition. This plan does not invent either.
- PreceptorOS already has a separate `hexelion.eleccion.tier2/1` decision contract (`docs/contratos-decision.md` at app main `44cf577f`). Its abstention uses `choice=NO_DATA`, `score=null`, and structured `no_data` causes. It remains the authority for tier-2 elections; it is not silently substituted for or copied into the four-field map-brain status verdict.
- The Android runtime integrity gate passed its negative case. Positive runtime integrity and a coherent generated response remain `NO_DATA`.
- The ODD board in `odd/STATUS.md` reports a 2026-10-28 baseline and is stale relative to this commission; this receipt does not overwrite that shared board or the Claude lane's UI task.

No implementation, configuration, deployment, or public-state mutation is authorized by this plan.
