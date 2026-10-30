# Play without a node

Status: PROPOSED · JN-1 · REQUIERE_FIRMA. Documentation only. Each implementation slice requires its own FIRMO before code and its own PR.
Authority: Sovereign commission “JUGAR SIN NODO”.

## Contract and reuse

A visitor can play on the single OpenWorld map with zero LIVE nodes. Node participation is optional. Reuse gacha.js, verified atlas.adopcion/1 and atlas.tropa/1 writes in db.js, atlas-army, army_tope, the SHA-256 wave core, existing wave scene, map_scene and r200 fog clearing. Keep costs and odds visible from their versioned source; pity and balance remain NO_DATA. No new map or combat engine.

Walker memory, terminal preference, optional auth.js identity and node credentials retain separate meanings. No page signs a master account. Slots 1–4 remain NO_DATA. No changes to colony_controls, crab or auth.js are authorized by this plan.

## Territory without nodes

Propose a visitor place layer on the existing map, anchored at the tutorial cabin. Places are playable content, never fabricated LIVE nodes. Keyboard/touch selection opens their actions without requiring the node-only walker to reach them. A signed content contract must declare place ids, coordinates, permitted actions and NPC waves. Missing content yields NO_DATA. Existing LIVE/STALE tutorial eligibility remains unchanged; visitor actions do not complete node tutorial steps. Boundary camps and inter-node war remain asleep pending their own signatures.

## Lifecycle and proof

Proposed phases: ephemeral, bridge, wandering. A visit creates a fresh non-exportable WebCrypto Ed25519 private CryptoKey held only in a controller closure. Never store it in IndexedDB, localStorage, sessionStorage, workers, URLs, logs or exports. Only public key and signatures leave the closure. Reload or closure ends signing authority; page restoration must invalidate the previous visit. Browser lifecycle behavior must be measured; physical memory erasure is not claimed.

Key generation needs secure platform entropy. Propose an explicit initialization exception outside deterministic gameplay/rendering. Domain-separated SHA-256 derives the visit seed from its public key; replay uses the same seed and actions. No Math.random decides outcomes. Fresh visits are not an anti-reroll guarantee.

Local play requires no Aduana request. On an explicit transition action, Aduana should issue a single-use, scoped, expiring challenge. The visitor signs canonical bytes binding challenge, public key, requested phase, audience and schema version. This proves key possession only. Replay, malformed input, wrong audience/scope and expiry fail closed. Transport expiry cannot decide game outcomes.

Bridge activation requires a Sovereign-authorized binding of visit public key, scope and request digest. Bridge to wandering additionally requires an authorized node credential and an Aduana-verified Sovereign signature over the exact transition. A fresh wandering key is generated in memory at transition and bound to the bridge key by possession proofs and the signed receipt. Missing keys or proofs abort. All private keys remain visit-only; durable wandering custody needs a separate signed design.

Aduana deploy ce05d18a, preceptoros.aduana/2 and D1 8661fb4c are commission-supplied evidence. Visitor endpoint compatibility is NO_DATA until the current protocol and rejection cases are inspected. Deployment existence does not prove account-transition support. No deployment is authorized here.

## Persistence and ownership

Keep adoption contracts unchanged: public key 64 lowercase hex, signature ed25519: plus 128 lowercase hex, verification inside the existing write path. Explicit adoption persists the signed troop in atlas-army. No visit key, seed or account profile is stored. Disclose that persisted public keys correlate that visit's adoptions.

After closure, records remain independently verifiable and viewable, but the lost private key cannot retire or transfer them. A new visit cannot silently claim them. Restoration never implies signing authority. Bridge to wandering adds scoped node linkage and a transition receipt, without rewriting old adoptions or transferring ownership. New adoptions use the current phase key. Recovery/delegation needs another signed protocol.

Duel and conquest logs remain session memory: rules version, place, seed, logical step, outcome and cause. No account id, public key, node credential or private key. Seeds correlate session rounds and are not proof of a person. No automatic upload.

## Ordered slices

1. **JN-1: this plan.** One documentation PR. No served code or seal changes.
2. **JN-2: visitor account.** Closed schema, in-memory key custody, explicit consent for each signed action, seed derivation, lifecycle invalidation, historical records without restored authority, and inspected Aduana protocol. Unsupported transitions remain NO_DATA. This slice must resolve transport scope before implementation.
3. **JN-3: gacha without nodes.** Wire existing gacha and army. Visible costs/odds, class terms and a sealed session chronicle. Initial copper/light allocation is NO_DATA: no measured or signed allowance was supplied. A signed allocation and debit rule are release prerequisites. Unknown funds disable the action with a cause; never mint a default allowance. Pity remains NO_DATA.
4. **JN-4: visitor versus place.** Approved visitor troops versus declared NPC waves, using G.tirada(seed, tc), existing terms and wave_duel_scene. Domain-separated seeds bind place, visit seed and rules version. Explicitly approve this extension to node-pair G5-D1. Reuse SHA-256 commitments and ABANDON=900. Public deterministic NPC commitments provide reproducibility, not adversarial secrecy. Damage/life/balance remain NO_DATA; provisional values cannot fill gaps. A signed, measured outcome-to-victory rule is required before conquest.
5. **JN-5: conquest.** Only verified completed victory sets session e.luchados[place] and clears existing r200 fog. Draw, abandon or invalid reveal never conquers. Authoritative date is logical visit step; optional wall-clock capture is labelled untrusted. Real-world date stays NO_DATA without a declared source. Reload clears conquest. No permanent ownership or reward is inferred.

JN-2 precedes JN-3; JN-3 plus approved NPC content precedes JN-4; verified JN-4 precedes JN-5. Missing economy/content/rules cannot be replaced by production fixtures. The core's ABANDON constant alone does not demonstrate missing-reveal timeout behavior; inspect and test that distinction before claiming W3.

## Verification per implementation slice

- Chromium, zero LIVE nodes, no persistent identity: reach each visitor action on the one map by keyboard and touch; controls at least 44 px; outcome sentence, coordinates and sound or NO_DATA cause. Reduced motion arrives immediately.
- Generate the real key through the served browser lifecycle. Sign exact adoption/challenge bytes after user action. Independently verify public key/signature with OpenSSL. Node-generated fixtures do not satisfy this gate. Never export or log private material.
- Inspect browser storage before/after creation, adoption, transition, reload and restoration. Only explicitly accepted adoptions persist. Private export fails; fresh visit cannot retire an old troop. Code inspection complements storage snapshots; a negative snapshot alone cannot prove custody.
- Replay identical seed/actions twice. Sabotage absent seed, invalid signatures, changed reveal, expired/replayed challenge, wrong audience/scope, unsigned transition, missing NPC/budget/victory rule. Reject with cause and no partial writes.
- L-075: observe cold-load network, zero external requests. Dynamic Aduana transport declares destination class, payload and purpose before user initiation. No network in rendering.
- Complete serialized bubble frames strictly below 1,024 UTF-8 bytes, door below 16,384 bytes, logic in public/game/. Reject boundary sizes. Bound/chunk round logs. Preserve map_scene y→x→id order and single-map output.
- Verify victory/draw/abandon against core and existing scene; required gates, sabotage red then green, n=2 determinism and scrubbed browser receipts per PR. No runtime tests are claimed by JN-1.

## Input scrub and failure rules

Closed schemas, bounded UTF-8 strings/list counts, finite coordinates, allowlisted place/action/phase ids, canonical signed bytes and explicit rules versions. Reject unknown signed fields, malformed hex, oversized inputs and instruction-bearing URLs. Render user input as text. No arbitrary fetch destination, injected HTML, implicit persistence fallback or unsigned adoption. Crypto/storage/transport failure yields NO_DATA with cause; failed storage never claims durable adoption. Public artifacts contain no addresses, host aliases, user paths, credentials or raw production inputs.

## Signature decisions and gaps

Plan review must cover territory eligibility, initialization entropy, phase/key binding and immutable adoption ownership. Later pieces separately require signed initial allocation, NPC definitions, victory rule and measured balance. Plan approval never substitutes for per-piece FIRMO. No code before those signatures.

Maintenance proposal: make persistent evidence versus lost signing capability an explicit invariant. Before, storage could be mistaken for recoverable ownership; proposed after, fresh visits never gain authority over old records. Implementation evidence remains NO_DATA until JN-2.

## v3 addendum — measured against main d37edeb8

Measured inventory and HTTPS receipts: [construction audit](../../docs/play-without-node-audit.md). Source main d37edeb8; production al. Door 17,328 B exceeds 16,384 B by 944 B; first signed door slice must cure this before compliance. Heartbeat GET exists but active emitters/POST receipts are NO_DATA. Web adoption verification must not be attributed to Aduana without endpoint evidence.

### Surface, records and queue ownership

Visitor gameplay lives inside /openworld/, as actions on existing map places and a temporary duel overlay using wave_duel_scene. No separate game panel/map. The signed door slice corrects “Army fixture” to the honest destination label and updates its browser gates in the same commit. JN-4/JN-5 records converge to this map using BM-3 round frames: colour, coordinate, declared sound, logical time, sentence and rules version, complete envelope below 1,024 UTF-8 bytes. B4 feed compatibility does not authorize automatic transmission.

Choose queue order: Mesa npc_occupancy privacy piece (T_D67, expected 17 cases and zero-event baseline to verify), then fog-push RC-15, then JN-4/JN-5 integration. No overlapping edits. JN-2/JN-3 planning proceeds independently; before NPC/fog code, record predecessor heads and exclusive file ownership. RC-14 corpus records measured squad ceiling 10 versus unmeasured 30. valores.js contains tropas_max=10 and army_tope=30; inventory capacity is not measured combat capacity. Retain the 10 combat ceiling; 30 and initial anonymous budget remain NO_DATA for this route. Historical tutorial rewards are candidates, not a silently approved allowance.

### Authority, custody and transition hook

Cite docs/canon-the-one-map.md for decrees 6524440790 (web reality, app connects) and 6524501049 (truth converges to one map). Cite odd/tasks/benchmarks-on-map.md for ideas13oct sections 15/18, NORTE 6525335471 and NORTE-ACTIVO 6525528435. The fetched signatures book did not contain either competing NORTE number; 6525335471 is the repository-recorded citation, while primary-comment reconciliation remains NO_DATA. Never replace it with 6535335471 from memory.

Each ephemeral→bridge→wandering transition requires its own contemporaneous Sovereign signature, separate from implementation approval. Visitor signs possession; node signs its travel door; Sovereign signs the scoped phase binding. Proposed travel door binds travel id, short hash, nonce, logical cycle, node signature and exact full request digest (short hash is display only). On explicit user submission Aduana verifies authorized node and Sovereign signatures, challenge replay/scope and possession, then stores a minimal signed transition receipt in a declared transition register. That register/endpoint is proposed, not evidenced deployed. No successful phase change without its verified seat. Ephemeral play/adoptions continue locally without heartbeat; node linkage remains unavailable until a verified current node credential and measured heartbeat satisfy the signed eligibility contract. Heartbeat is evidence, never itself a phase signature. No persistent visitor identity in the ephemeral phase; troop adoptions persist without asserting a person.

### Gates and signatures

Every public/ change carries its seal in the same commit: letter assigned by Mesa, am reserved for device-local-chat and an onward for JN unless reassigned. This plan does not take am. Required checks include version_sw, arnes_sw expected 24/24, lexicon ratchet (review vocabulary before --escribe-base), CI tests/*.test.mjs, affected browser gates, and contar_rutas/DEPLOY.md for new routes. Page and gate behavior change together. Plan FIRMO, per-piece pre-code FIRMO, and exact-head merge signature are distinct; any head change invalidates HITL. Measure local and CI first; device captures against production only after deployment of that exact piece. No merge or deployment under JN-1.

### Corpus inputs retained without expansion of scope

Use the existing Open sea contract and proposed predefined visitor package in Node.0.Hexelion territory without claiming that node LIVE. A public-key-derived pseudonym is a visit label only. L-065 supplies the proposed tutorial theme The Abyssal Light Citadel; L-053 keeps old house-node comparisons archived rather than deleted. L-071 signed, bounded, revocable companion help; L-068 NPC structure attacks/boundary camps; political territory types; sanctuary tier; and B1–B8 resource-book/tier concepts remain inputs for separately signed pieces. Sanctuary remains NO_DATA uncoined_tier; no new tier or economy is coined here. Exact corpus locations for these identifiers remain to be attached before implementation; the Mesa addendum is their current attribution, not a claim of independent verification. L-075 governs zero external load requests, strict door ceiling and declared user-initiated transport.
