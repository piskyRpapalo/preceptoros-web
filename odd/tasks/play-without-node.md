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
