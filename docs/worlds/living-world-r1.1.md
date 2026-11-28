# OPENWORLD · LIVING WORLD R1.1 · INTEGRATED SPECIFICATION

**Status:** SPEC_ONLY · R2_SPEC_ACCEPTED · BUILD_NOT_AUTHORIZED  
**Mission:** Continue the existing Living World R1.1. No new mission ID.  
**Authority:** The Sovereign  
**Coordination:** ORC CONTROL  
**Owner:** ORC WEB  
**Repositories:** preceptoros-web, preceptoros-atlas, aduana, preceptoros-app, babel  
**Mode:** SPEC_CONVERGENCE → CONTRACT → IMPLEMENTATION_PLAN

> This document integrates existing source evidence and the accepted R2 specification. It is not an implementation, a new authority, a new registry, or a claim that persistent NPC society is live.

## 0. Executive decision

OpenWorld already has a substantial playable surface: a hex map, exploration fog, visitor movement, deterministic building-key patrol squads, guardian presentation, historical-tick combat, visit-local conquest, a node-presence projection, and an existing ACHO event presentation path.

It does **not** yet have an authoritative persistent society of simulated characters.

The decisive architectural gap is not the absence of another game engine. It is the absence of an authorized persistent world-mutation and replay contract for simulated characters, territorial control, factions, diplomacy, and economic settlement.

The integrated direction is:

**Existing OpenWorld state and geometry → bounded deterministic simulation → validated intent → existing authority boundary (Aduana, subject to a future approved contract) → one authoritative world event/history → existing WEB projections and ACHO readers.**

The last two stages are not currently available for NPC/world mutations. They are requirements, not implemented components.

### Non-negotiable distinctions

1. Visitor presence is not land ownership.
2. A node building declaration is not a title transfer.
3. A local visitor conquest is not persistent territorial control.
4. A deterministic patrol squad is not a persistent character identity.
5. Guardian animation is not autonomous behaviour.
6. An ACHO event is a presentation event, not a durable world journal.
7. A proposal or validator is not an authorized writer.
8. An LLM proposal is not a world-state mutation.
9. A test fixture is not production or physical E2E.
10. A specification acceptance is not authorization to build.

## 1. Evidence grades and naming law

### 1.1 Evidence grades

Use these labels independently. A capability can be IMPLEMENTED and still have E2E_VERIFIED=NO_DATA.

- **SOURCE_ONLY:** source or documentation inspected; no execution claim.
- **IMPLEMENTED:** code path exists. Reachability, deployment, and runtime use are separate questions.
- **TESTED:** a named test was actually executed; cite its command or receipt and exact base.
- **MEASURED:** a quantitative result was measured in a named environment.
- **E2E_VERIFIED:** the complete path was exercised with real clients and the relevant authority; synthetic tests do not qualify.
- **PROPOSED:** design only.
- **NO_DATA(cause):** the fact cannot be established from available evidence.

This SPEC pass executed no tests and performed no deployment or physical device measurement. Historical test statements are explicitly marked historical and are not presented as fresh runs.

### 1.2 Vocabulary

Babel is the single vocabulary authority. The current registry and Commission D establish:

- **PreceptorOS** and **OpenWorld** are existing product/experience names.
- **Living World** is a descriptive working label for a future capability, not a canonical product promise.
- The current file public/game/inhabitants.js describes rack nodes from heartbeat evidence. It must not be repurposed silently to mean simulated characters.
- The Babel term **the Guardian** has a collision with proposed game use of “Guardians”.
- Use **simulated character** as descriptive prose in this SPEC. Keep **NPC** only as a technical placeholder where needed. Neither is promoted to a new canonical name here.
- Factions, Diplomacy, Trade, and World Memory remain proposed concepts, not claims of existing runtime capability.
- “A world that remembers” is a future vision, not a present-day marketing claim.

Proposed hierarchy, pending Babel and Sovereign naming decisions:

**PreceptorOS → OpenWorld → Living World**

Truthful positioning candidate already recorded by Commission D:

“Designed for local-first AI on hardware you control. Explore OpenWorld.”

No vocabulary is coined or canonicalized by this document.

## 2. Verified source baseline

All five requested repository HEADs were checked against their main branches on 2026-11-28. They match the supplied baseline.

| Repository | Verified main HEAD | Result |
|---|---|---|
| preceptoros-web | 6ae932b7cdbfce3d0a3bd443d7ce11a067f9acb4 | MATCH |
| preceptoros-atlas | a89845c572f5092f0953cdbbdc4413c6023eb7a7 | MATCH |
| aduana | 1a2167a2cef5f7d419775b6ad116039b503c3960 | MATCH |
| preceptoros-app | 57cce851cefafa1511e154ee040f9492c0a9c07b | MATCH |
| babel | d871b3b390e23a22cb306fc74ec7bbb67e573646 | MATCH |

WEB had zero open PRs at the verification point. No matching Living World R1.1 SPEC branch existed before this documentation-only branch.

### 2.1 Existing evidence recovered; no archaeology repeated

- Commission A — identity and behaviour: Mesa #62 comment 7231343587.
- Commission B — territorial authority: Mesa #62 comment 7231374794.
- Commission C — resources, diplomacy, trade: Mesa #62 comment 7231384699.
- Commission D — Babel and positioning: Mesa #62 comment 7231240381.
- Integrated archaeology FAN-IN: Mesa #62 comment 7231614352.
- NPC compact contract: Mesa #62 comment 7231621835.
- WEB-B-R2 SPEC: Mesa #62 comment 7229271839.
- Sovereign technical acceptance: Mesa #62 comment 7231808714.
- ORC CONTROL resource/pause update: Mesa #62 comment 7231810266.

No source SHA changed, so the four commissions are consumed as evidence, not repeated.

## 3. WEB-B-R2 — SPEC gate closure

**R2 status: CLOSED_ACCEPTED_SPEC_ONLY.**  
**R2 implementation status: NOT IMPLEMENTED by this SPEC.**

The Sovereign accepted all five specification boundaries in #7231808714. That acceptance is technical SPEC acceptance only. It does not authorize code, test execution, PR merge, or deployment.

### 3.1 Canonical combat mode

The place resolver is the authority for the encounter mode:

- Practice place → practice.
- NPC building place → guardian encounter.

Resolve this mode before canonical result construction and verification. Put it in the canonical result and every relevant round frame. Verification recomputes the mode from the place resolver. The UI, ACHO, quest update, and conquest gate consume the verified result mode.

Preserve the historical digest formula and ordered squad exactly. The mode is derived from the place resolver; do not add a nonce, change RNG, reorder the squad, or alter the historical seed formula.

**Current source gap:** visitor_battle.js resolves a place and computes the historical seed from place ID, visit seed, and ordered squad, but its result does not yet carry canonical mode. Its round sentence is hard-coded as “practice”. visitor_battle_ui.js adds result.practice after verify. visitor_conquest.js then clones the result and deletes that field before re-verification. This is precisely the non-canonical post-verification mutation rejected by the accepted R2 contract.

### 3.2 Practice and guardian semantics

- Practice victory: no fight count, reward, conquest, territorial change, or persistent character death.
- Guardian encounter: a verified victory may produce the existing visit-local conquest record.
- Loss, draw, invalid result, replay alteration, stale visit, duplicate place, or changed visit: no conquest.
- Never clone, delete, or mutate canonical result fields to bypass verification.
- Local visit conquest remains local. It does not become persistent title or world control.

### 3.3 Fog units

Keep two different coordinate systems distinct:

- The active map fog layer uses axial hex distance and radius 4 for the visit-local conquest clearing.
- The separate AtlasNiebla helper uses world-coordinate circles with radius 200.

Do not compare these radii as if they used the same unit. UI wording must state the correct unit or use a neutral phrase such as “wide clearing”.

### 3.4 Squad selection

- Optional selection of 1–10 creatures from the current visit's adopted army.
- Default is exactly the current first min(10, n) entries in stable army order.
- Preserve order because the ordered squad is part of the historical seed.
- No reorder, persistent preference, adoption mutation, or inventory mutation.
- Cancel is a no-op.
- Reject empty, foreign, duplicate-if-disallowed-by-existing-contract, malformed, or over-limit selections. Do not invent a new duplicate rule without reconciling the existing troop contract.

### 3.5 Quests and ACHO

- Reuse visitor_eggs.game.quests()/claim() and visitor_view.questBoard.
- One post-verified-guardian-combat refresh path. Do not create a second quest board.
- Retain preceptoros.acho/1 and its under-1,024-byte frame limit.
- Trace reference is the existing event/seed reference. Freshness is the visitor/page lifetime.
- Trusted calendar date remains NO_DATA(no_trusted_calendar_date_source).
- Balance and fairness remain NO_DATA until a reproducible seeded benchmark exists.
- Physical screen-reader and audible-output E2E remain NO_DATA.

### 3.6 R2 source gap and implementation status

The source still contains the accepted-boundary defects. They are recorded, not modified:

- visitor_battle.js: place resolution, seed, result and frame construction.
- visitor_battle_ui.js: result.practice is attached after verification.
- visitor_conquest.js: the result is cloned and its practice field deleted before verification.
- visitor_conquest_browser.mjs: the historical test path uses a practice place and expects conquest; the test semantics must be split.
- map_fog_layer.js: active axial radius-4 clearing.
- fog_of_war.js: separate world-coordinate radius-200 helper.

Therefore the R2 SPEC gate is closed, but the R2 code correction and its regression tests remain a future implementation candidate behind a separate BUILD authorization.

## 4. Existing architecture and dependency graph

### 4.1 Current source graph

**Visitor combat path**

Visitor UI → visitor_battle_ui.js → visitor_battle.js → historical combat tick engine → verified local result → combat_acho.js / visitor_conquest.js → map and visit-local records.

**Public node-state path**

Browser GET /api/world-state → WEB worker/index.js → worker/world_state.js → Aduana GET /api/v1/latidos → D1 node_heartbeats and node_buildings → Aduana estadoActual() → WEB world_feed.js → openworld_state.js → inhabitants.js and map consumers.

**Visitor-presence path**

Visitor → Aduana presence route → OpenWorldPresence Durable Object → signed /open, /step, /view records → ephemeral presence projection. This is separate from the node-heartbeat and building-declaration path.

**Presentation-event path**

Existing producers → document event acho:event → echo_feed.js / town_echoes.js and other readers → map effects and Echoes menu. This is a presentation bus, not a persistent world event journal.

### 4.2 Future simulation path — contract only

World snapshot + stable simulated-character identity
→ bounded perception
→ deterministic logical-cycle scheduler
→ legal goal candidates and utility scoring
→ bounded intent proposal
→ authoritative validation
→ authorized state transition
→ one durable event/history mechanism
→ replayable world projection
→ existing map, visual, screen-reader, speech/audio and machine-readable ACHO consumers.

The future path is deliberately incomplete at the authority and durable-history boundary. No missing component is silently assumed to exist.

## 5. A — Simulated character identity and behaviour

### 5.1 Existing implementation

| Source | What it actually represents | Grade |
|---|---|---|
| public/game/visitor_battle.js | Deterministic patrol squads derived from a building encounter key | IMPLEMENTED |
| public/game/guardian_pressure.js | Client-side guardian pose and alert projection derived from distance and visit-local win state | IMPLEMENTED, presentation only |
| public/game/map_fog_layer.js | Draws guardian figures and visit-local fog/clearing state | IMPLEMENTED, projection only |
| public/game/inhabitants.js | Projects physical rack nodes from /api/world-state heartbeats | IMPLEMENTED; not simulated characters |
| public/game/agent_state.js + agent_states.json | Read-only preceptor/node readiness state machine | IMPLEMENTED; not NPC lifecycle |
| atlas/npc_occupancy_cases.mjs | Retirement guard for removed npc_occupancy.js | IMPLEMENTED guard; not occupancy |

The deterministic npcPlace() result is an encounter generator. The building key selects a patrol kind and squad. It does not establish persistent character identity, memory, faction membership, mutable world location, or an authorized lifecycle.

guardian_pressure.js explicitly says it is a projection: it moves no rules, starts no fight, and grants no ownership. Its states are presentation states, not a persistent NPC state machine.

### 5.2 Proposed stable identity contract

Candidate identity:

**id = H(world_id, origin_building_id, birth_slot, incarnation)**

Fields:

- world_id: stable identifier for the shared world. Its canonical source and scope still require authority definition.
- origin_building_id: stable canonical origin building. A visitor encounter key alone is not proof of a persistent building identity.
- birth_slot: stable role slot within the origin building. It must not be inferred from mutable array order.
- incarnation: monotonically distinguished generation for a replacement occupying the same origin/slot after a terminal lifecycle.

Mutable fields include current location, current faction, current goal, behaviour state, current resources, and current relationship projections. They do not change the character identity.

A building key such as b:<kind>:<q>,<r> may remain an encounter key. It must not be treated as the full character identity.

### 5.3 Lifecycle state and behaviour state are separate

Proposed lifecycle FSM:

- BIRTH → ACTIVE after an authorized birth record.
- ACTIVE ↔ DORMANT under explicit scheduler/visibility policy.
- ACTIVE or DORMANT → MISSING only when a complete authoritative snapshot proves absence.
- MISSING → ACTIVE only after verified return of the same identity.
- ACTIVE, DORMANT, or MISSING → DEAD only after an authorized committed death event.
- ACTIVE, DORMANT, or MISSING → RETIRED only through an authorized retirement event.
- DEAD and RETIRED are terminal for that incarnation. A replacement receives a new incarnation.

Missing is not dead. A partial snapshot, failed read, stale source, or NO_DATA coverage must not produce MISSING or DEAD.

Proposed independent behaviour state:

PATROL · WATCH · ALERT · DEFEND · INTERACT · RETREAT

These are goal/behaviour states. They are not lifecycle states and must not be confused with guardian_pressure.js presentation states.

### 5.4 Deterministic decision model

Recommended baseline: deterministic utility selection with bounded state-machine execution.

For each logical world cycle:

1. Read a validated world snapshot and its freshness/cause.
2. Build a bounded perception set from visible hexes, known events, local resources, faction rules, and authorized relationships.
3. Generate only legal candidate goals.
4. Score candidates with integer utility values.
5. Apply stable tie-breaking based on stable identity and candidate ID.
6. Apply hysteresis to avoid goal oscillation.
7. Enforce per-character and per-faction action budgets.
8. Produce a bounded intent.
9. Validate all preconditions in the authoritative engine.
10. Commit only an authorized transition and record the reason/result.
11. Re-evaluate on the next logical cycle.

Do not run an LLM on every movement, frame, or patrol tick. The baseline simulation must work deterministically without model calls. A future model may propose a high-level intent, but it cannot write state, sign, bypass budgets, or alter the canonical result. Model output is optional, bounded, attributable, and rejectable.

### 5.5 Memory and relationships

No persistent simulated-character memory or relationship store is identified in the reviewed source scope.

Future memory must be derived from authorized world events, bounded by a declared retention policy, and reproducible from its source references. It must distinguish observed fact, inferred belief, and NO_DATA. Do not turn the page-local Echoes list into a memory database.

Relationships must have explicit subjects, targets, type, strength, source event, freshness, and authority. Faction membership and diplomacy must not be inferred from visual proximity or a model narrative.

### 5.6 Invariants

- Stable identity survives movement and rendering changes.
- The same identity and same accepted event history replay to the same state.
- Missing never silently becomes dead.
- A practice fight cannot kill or persist a character.
- An unverified intent cannot change location, ownership, faction, resources, or lifecycle.
- Model output cannot grant authority.
- No decision may exceed its action/resource budget.
- Incomplete world coverage produces NO_DATA, not an invented decision.

## 6. B — Territorial authority and World Memory

### 6.1 Actual route and ownership boundary

The public route is not an Aduana route named /api/world-state. The exact path is:

1. WEB serves GET /api/world-state through worker/index.js.
2. worker/world_state.js makes a fixed read-only service-binding request to Aduana GET /api/v1/latidos.
3. Aduana src/index.js routes GET /api/v1/latidos to estadoActual().
4. estadoActual() reads the latest accepted heartbeat per configured node and verifies public building declarations before returning the projection.
5. WEB world_feed.js validates preceptoros.openworld-estado/2.
6. openworld_state.js validates and projects that state; inhabitants.js interprets its nodes as rack inhabitants.

This is a read path. It is not a general world-mutation path.

### 6.2 Existing Aduana capabilities

**OpenWorldPresence Durable Object**

- Handles /open, /step, and /view.
- Uses an explicit OPENWORLD_PRESENCE=on configuration gate and a bounded law.
- Verifies Ed25519 signatures and a sequence/previous-hash chain for accepted visitor actions.
- Uses Durable Object storage transactions for the current presence snapshot.
- Expires visits after the configured gone_after interval.
- Deletes the stored presence snapshot when no visits remain.
- Is visitor presence and cooperation authority, not NPC or territorial authority.

**D1 node_heartbeats**

- Append-only rows keyed by node and sequence.
- Monotonic sequence guard.
- No-update and no-delete triggers.
- Aduana reads only the latest row for each configured node for the public projection.
- This is heartbeat evidence, not a complete replayable world event history.

**D1 node_buildings**

- One row per canonical node and one unique building identifier.
- Append-only declaration and receipt.
- Authenticated node/building declaration with provenance and payload/receipt hashes.
- Not a general building ownership, conquest, transfer, or occupation ledger.

**Current gap**

The Durable Object keeps ephemeral presence state. The D1 tables keep heartbeat and building-declaration evidence. The reviewed source does not establish a durable world event journal with replay for NPC decisions, territorial conquest, title transfers, faction changes, diplomacy, or trade.

### 6.3 Required semantic separation

| Term | Required meaning | Current status |
|---|---|---|
| Presence | A visitor or node is observed under its own admission/heartbeat rules | IMPLEMENTED in separate bounded paths |
| Building declaration | An admitted node declares its assigned building with a receipt | IMPLEMENTED |
| Ownership | A recognized title/owner relationship under an authorized contract | NO_DATA(territorial_title_contract_not_found) |
| Control | Current rule-authorized control of a territory/building | NO_DATA(persistent_control_writer_not_found) |
| Occupation | A bounded, authorized occupying force/state | NO_DATA(npc_occupancy_removed_and_not_authorized) |
| Conquest | A verified transition that changes control/title under the governing authority | Visit-local only; persistent conquest NO_DATA |
| World event | An immutable authorized fact with identity, sequence, provenance, and replay semantics | NO_DATA(world_event_writer_and_replay_contract_absent) |

Do not restore npc_occupancy.js or fog-push. atlas/npc_occupancy_cases.mjs is a retirement guard, not a signal to restore the old system.

### 6.4 Authority contract required before persistent simulation

A future proposal must first establish whether and how the existing Aduana boundary may be extended. This SPEC does not create a writer.

Any approved mutation contract must specify:

- Authenticated actor and stable subject identity.
- Authorized action and policy version.
- Preconditions and current-state digest.
- Sequence, idempotency key, and replay protection.
- Atomic validation and commit.
- Conflict and concurrency semantics.
- Immutable receipt and provenance.
- Deterministic replay or an explicit replay limitation.
- Expiry semantics for presence versus durable history.
- Reversal as a new authorized compensating event, never destructive rewriting.
- Human signature boundary for treaties and territorial title transfers.

Do not add a parallel database, event bus, or journal. Do not assume that the existing presence Durable Object or node declaration tables can be repurposed without a new reviewed contract.

## 7. C — Factions, diplomacy, resources, and trade

### 7.1 Resource reconciliation

The three current vocabularies are not equivalent:

| Source | Declared resources | Actual boundary |
|---|---|---|
| Holdings / WASM ledger | copper, light, biomass, oxygen | Visit-local ledger; no durable settlement |
| Caravan E2 | luz, biomasa, cobre, flujo, oxigeno | PROPOSE-ONLY; route places are aliases, not account IDs; units and account settlement are absent |
| APP Policy v2 | madera, piedra, comida, energia, metal | Validator-only proposal; runtime still reads v1 |

No canonical unit, conversion, common cycle, account mapping, production-rate reconciliation, or conservation mapping is established.

**NO_DATA(canonical_resource_units_and_conversion_not_defined).**

Do not silently equate light with luz or copper with cobre and do not infer that similarly named resources have the same unit or owner.

### 7.2 Holdings

holdings_live.js and the Rust/WASM ledger define a visit-local game simulation: garrisons, yields, oxygen upkeep, raids, and retaking. The source states that the holdings are not stored or sent. Commission C records that the main page loader omits the live/WASM path. Treat this as existing code, not a durable shared economy.

holdings_map.js emits ACHO events and map projections from the local ledger. It does not make the ledger authoritative or persistent.

### 7.3 Caravan

atlas/puros/caravan.js is explicitly E2, PROPOSE-ONLY.

- Place fields are aliases, not account identifiers.
- Cargo amounts are bounded integers, but canonical units are not defined.
- Resource names differ from Holdings and Policy v2.
- signature.state is a textual enum. The string SIGNED is not itself cryptographic proof.
- A COMPLETED state requires the text SIGNED in this contract; this does not establish a debit/credit transaction or verified human signature.

No durable trade settlement is implemented.

### 7.4 Policy v2

APP politica_v2_validator.py validates a closed v2 document and fails closed on missing/invalid signatures. It is isolated and does not import the runtime policy gate. The source itself notes that atlas.oferta/1 is not defined and the resource set is a best-effort enumeration.

APP politica_vista.py reads the v1 runtime policy and reports posture and signature as NO_DATA where v1 has no such fields. Policy v2 is not the active runtime policy.

The five postures—peaceful, hostile, cooperative, closed, and open—remain a proposal for future policy behaviour, not an active faction system.

WEB does not edit APP in this mission. APP continues independently.

### 7.5 Proposed faction and diplomacy contract

The following are requirements for a future SPEC/implementation slice, not current features:

- Stable faction identity and provenance.
- Membership with explicit admission, departure, and expiry.
- Leadership and delegation boundaries.
- Public policy version and bounded powers.
- Relations between factions with source events and freshness.
- Alliance, non-aggression, trade agreement, aid, and conflict proposals.
- Treaty proposal, acceptance, human signature, activation, expiry, breach, and revocation semantics.
- Player influence through explicit choices and authorized proposals.
- NPC interests bounded by faction policy and available resources.

NPCs may propose alliances, trade, or conflict. They may not sign treaties or transfer territorial title. The Sovereign retains signature authority for treaties and territorial transfers.

### 7.6 Minimum future trade transaction

Before a trade can be called operational, its contract must define:

1. Canonical resource ID and unit.
2. Source account owner and debit authority.
3. Recipient account and explicit acceptance.
4. Atomic debit/credit conservation.
5. Idempotency and monotonic sequence.
6. Replay protection and signed/authorized transaction intent.
7. Immutable receipt with before/after balances and provenance.
8. Abort semantics: no partial write.
9. Reversal semantics: a new authorized compensating transaction.
10. Shared logical cycle and expiry rules.

No pooled treasury, balance, conversion, or settlement is introduced by this SPEC.

## 8. D — Product and vocabulary boundaries

Babel remains the only naming authority. This document does not modify the registry.

- PreceptorOS is the product.
- OpenWorld is the public world experience.
- Living World is a descriptive future capability.
- Simulated character is descriptive prose only until Babel resolves the collision.
- Do not rename the existing rack-node projection in inhabitants.js.
- Do not canonize Guardians while the existing “the Guardian” collision remains unresolved.
- Do not advertise persistent NPC memory, faction politics, durable trade, territorial ownership, or autonomous society as implemented.
- “A world that remembers” remains a future vision.

## 9. Multiplayer colony

### 9.1 Existing capability

- Aduana supports signed visitor presence and movement under its presence contract.
- The presence rules include a bounded cooperation experiment that can turn two signed decisions into one beacon event. Its source explicitly states that it makes no copper, claims no land, and grants nothing.
- Node heartbeat and building declaration are separate D1 paths.
- WEB reads a public state projection through the fixed worker service binding.
- world_feed.js and openworld_state.js are consumers/projections, not world mutation authorities.

### 9.2 Not established

- Persistent NPC movement across clients.
- Persistent territory ownership/conquest.
- Shared faction membership or diplomacy.
- Shared resource settlement.
- Persistent world-event replay.
- Production multi-client E2E for a living NPC society.
- Two, three, five, or ten real users on independent networks with current p50/p95/p99 propagation evidence.

Do not change transport to WebSockets without a measured bottleneck. First measure the existing path: acceptance, propagation, polling wait, render delay, request volume, error rate, reconnect, and device/network class.

## 10. ACHO and one-state/many-readers contract

### 10.1 Existing pieces to reuse

- docs/acho-language.md defines preceptoros.acho/1, the compact frame and its text/state/sound fields.
- combat_acho.js reads the resolved combat record and describes three readers: visual fighter cards, a spoken/status line per round, and machine data attributes.
- echo_feed.js listens to the existing acho:event bus, retains the last 20 echoes in page memory, and renders the Echoes menu with role=log, source and age. It also draws short-lived map rings.
- town_echoes.js emits an acho:event when an existing town building changes from locked to available.
- guardian_pressure.js exposes a machine-readable read() projection, uses Preceptor Talk news for the first alert, and may play two low notes when the audio-only setting is enabled.
- holdings_map.js emits local ACHO events for the visit-local holdings simulation.
- state_frames.js is a pure core file whose own header says it is not served yet. Do not treat its existence as proof of a live universal state adapter.

### 10.2 Projection rules

Every future world event must have one validated state and one source reference. Visual, screen-reader, speech/audio, and JSON projections derive from that same state and cause.

- Visual: show state, location, freshness, and cause. Colour alone is insufficient.
- Screen reader: expose the same sentence and cause; do not create a second competing live announcement.
- Speech: only claim speech when the actual speech path is available and measured.
- Audio: sound metadata is not proof of physical playback.
- Machine: retain event ID/reference, source, state, cause, and the ACHO frame without inventing fields outside the contract.
- Reduced motion and audio-off change presentation only; they do not change the result.
- Every ACHO frame remains under 1,024 UTF-8 bytes.
- NO_DATA must retain its cause across every reader.

The LF-2 contract explicitly states that current geometry and FM sound are not phase-equivalent. A shape or sound cue is not evidence of physical audible output.

### 10.3 Current parity matrix

| Event/capability | Visual | Screen reader | Speech/audio | Machine/ACHO | Current boundary |
|---|---|---|---|---|---|
| Combat replay | Fighter cards and replay | Per-round status text in combat reader | Physical audible output not verified | Combat data attributes and ACHO/1 frames | Local result; R2 mode fix still required |
| Guardian alert | Map pose and alert state | Talk news path exists; device E2E NO_DATA | Two low notes are conditional; playback E2E NO_DATA | guardian_pressure.read() | Page-local presentation, not autonomous decision |
| World heartbeat | Node/map projection | inhabitants.js creates say text; actual reader path not proven here | NO_DATA(actual speech E2E) | world-state schema and node seal | Node evidence, not simulated character activity |
| Town building unlock | Echo ring and Echoes menu | role=log Echoes list | Physical speech/audio not verified | acho:event with source and frame | Page-local event presentation |
| Visit conquest | Flag, fog clearing, visit record | Labeled list exists; live announcement parity not proven | NO_DATA(physical speech/audio E2E) | visit-local place/seed/rules/step | Cleared on visitor:end/pagehide |
| Holdings change | Map garrison projection if loaded | Textual life information exists in module | ACHO metadata only; physical output not verified | local acho:event | Visit-local module; main-route integration NO_DATA |
| Faction/treaty/trade | Not implemented | Not implemented | Not implemented | No authoritative event/frame | NO_DATA(no writer or shared state) |
| Persistent NPC lifecycle | No persistent character renderer | No persistent lifecycle reader | No persistent lifecycle speech | No identity/lifecycle event source | NO_DATA(no registry, writer, scheduler, or replay) |

## 11. Player experience

### 11.1 Honest current first-session path

1. Enter OpenWorld and understand that the web is the public world.
2. Explore the hex map and reveal the visit-local fog.
3. Discover a grey building and its deterministic patrol squad.
4. Use the existing army and historical combat replay.
5. Distinguish practice from a guardian encounter.
6. If a verified guardian victory qualifies, record only the current visit-local conquest.
7. Reuse the existing quest board and town echoes; do not create parallel progression systems.

The current path does not include persistent NPC identity, durable territorial title, faction membership, treaties, or shared trade.

### 11.2 Future player decisions

Once the authority and simulation contracts exist, progression may expand through:

- Exploration and discoveries.
- Building specialization.
- Creature and squad composition.
- Guardian encounters and territorial defence.
- Negotiation with communities and factions.
- Trade under conserved resource rules.
- Alliances and collective decisions.
- Political choices with visible consequences.
- World events that occur without a player pressing a button.

The design must produce agency, understandable consequences, and fair recovery. It must not rely on FOMO, hidden odds, or wall-clock pressure. Logical world cycles are preferred.

## 12. Source-to-contract-to-consumer matrix

| Capability | Existing producer / source | Contract and consumers | Persistence / replay | Projection and evidence |
|---|---|---|---|---|
| Map and fog | map_fog_layer.js; fog_of_war.js | Axial hex map/fog rules; map painter and building UI | Visit/page memory; no persistent discovery journal | Visual fog/guardian; tests exist; no test run in this SPEC pass |
| Encounter squad | visitor_battle.js npcPlace() | Building-key deterministic patrol; visitor battle UI | Re-derived from key; no character registry | Visual battle and replay; deterministic source present |
| Guardian behaviour | guardian_pressure.js | Distance/visit-win projection; map_fog_layer.js; Talk news; read() | Page-local seen/alerted state | Visual pose, news, conditional notes, machine read(); not autonomous |
| Combat | visitor_battle.js; visitor_battle_ui.js; combat_acho.js | historical-ticks/1, replay verification, accepted R2 boundaries | Visit seed and ordered squad; bounded round frames | Visual/status/machine readers; historical browser evidence in docs; no fresh tests or physical E2E |
| Visit conquest | visitor_conquest.js; visitor_battle_ui.js | Same visit + verified guardian result; visitor:changed and map fog | Page/visit local; cleared at visitor:end/pagehide | Map flag and labeled list; not title or persistent ownership |
| Node presence | Aduana heartbeat route and presence DO | atlas.latido/1 / atlas.paso/1 family; WEB worker/world feed | D1 heartbeat history append-only; DO presence TTL/ephemeral | Node seals and map projection; production multi-client E2E NO_DATA |
| Building declaration | Aduana registraEdificio() | Authenticated node → assigned building declaration and receipt | D1 node_buildings append-only, one per node | Public building projection; not ownership or transfer |
| World read projection | worker/world_state.js; world_feed.js; openworld_state.js | preceptoros.openworld-estado/2 | Reads latest heartbeat/building evidence; no general world-event replay | Map/node projection and coverage causes |
| Echo presentation | producers of acho:event; echo_feed.js; town_echoes.js | Existing presentation bus; Echoes menu and map ring | Last 20 in page memory; no durable journal | Visual + role=log; physical speech/audio not verified |
| Holdings | holdings_live.js; holdings_wasm.js; holdings_map.js | Rust/WASM visit-local ledger | Visit-local, not stored/sent; main loader omits live/WASM | Map and ACHO module exist; integrated live route NO_DATA |
| Caravan/trade | atlas/puros/caravan.js | E2 PROPOSE-ONLY contract | No account settlement or durable debit/credit | Proposal only; no trade event projection |
| Policy/factions | APP politica_v2_validator.py; politica_vista.py | v2 validator isolated; runtime reads v1 | No faction/treaty writer | Posture/signature NO_DATA in v1 view; no WEB social state |
| Simulated identity | No authorized producer found | Proposed stable ID/FSM contract in §5 | No registry, lifecycle writer, or replay | NO_DATA(persistent_simulated_identity_not_implemented) |
| World memory | echo_feed.js is only page-local presentation; Aduana stores presence/heartbeat/building evidence | No general world-event journal contract | No world-event replay | NO_DATA(world_event_writer_and_replay_contract_absent) |
| Diplomacy/title transfer | No authorized producer found | Human signature boundary required | No durable treaty or title history | NO_DATA(faction_treaty_and_title_writer_not_found) |

## 13. Dependency graph and implementation sequence

### 13.1 Dependency graph

Exploration and map projection can continue independently.

The persistent society path is gated:

Aduana authority decision
→ one authorized world-event and replay contract
→ stable simulated-character identity and lifecycle
→ bounded deterministic scheduler and behaviour
→ faction membership and relations
→ canonical resource ontology
→ authorized trade and treaty transitions
→ player-facing social/political decisions
→ shared event projections through existing ACHO readers
→ multi-client measurement.

Combat R2 is a parallel prerequisite for correct guardian encounters and visit-local conquest. It does not authorize persistent territory.

### 13.2 Independently reviewable sequence

**Piece 0 — WEB-B-R2 implementation candidate (not authorized yet)**

Correct mode canonicalization before digest/result verification, preserve historical seed/order, remove post-verification mutation, split practice and guardian conquest tests, preserve radius-unit distinction, implement optional 1–10 selection with stable default, and keep ACHO/1. This is the next bounded candidate because the Sovereign has already accepted its SPEC. It still requires a separate BUILD gate.

**Piece 1 — Aduana world-authority contract decision**

Before persistent NPC or territory work, define the authorized world mutation boundary, event identity, atomicity, idempotency, replay, retention, and human-signature rules. Reuse the existing Aduana boundary if approved. No new database, bus, journal, or writer is created by this SPEC.

**Piece 2 — Stable simulated-character identity and lifecycle**

Only after Piece 1 is authorized. Establish world/building/slot/incarnation identity, lifecycle FSM, complete-snapshot semantics, and recovery. No autonomous decisions yet.

**Piece 3 — Deterministic behaviour scheduler**

Pure bounded decision logic using logical cycles, integer utility, legal candidate generation, stable tie-breaking, hysteresis, and action budgets. No per-frame LLM dependency.

**Piece 4 — Faction and diplomacy contract**

Membership, leadership, policy scope, relationships, treaties, proposal/acceptance, expiry, revocation, and human signature boundaries. No APP changes are required to continue WEB R2 or the earlier WEB-only pieces.

**Piece 5 — Canonical resource ontology and trade settlement**

Resolve units and mappings before production, consumption, storage, or trade. Reconcile Holdings, Caravan, and Policy v2 without assuming equivalence. Add no pooled treasury.

**Piece 6 — ACHO projection and player interaction**

Adapt existing producers and consumers so one validated event feeds visual, screen-reader, speech/audio, and machine-readable state. Reuse ACHO/1, acho:event, Echoes, combat readers, and existing quest board.

**Piece 7 — Multiplayer scale and resilience**

Measure 2, 3, 5, and 10 clients on independent networks and physical Android devices. Only consider transport changes after the existing path is measured and shown to be the bottleneck.

Every piece requires its own exact base, review, adversarial tests, and evidence receipt. No new mission ID is created here.

## 14. Acceptance and adversarial test plan

No test in this plan was executed during the SPEC pass.

### 14.1 R2 combat

- Resolver returns practice or guardian before canonical result construction.
- Tampered mode is rejected by recomputation.
- Historical digest formula and ordered squad remain byte-for-byte stable.
- Practice win cannot count, reward, conquer, or persist.
- Verified guardian win can create only the authorized visit-local conquest.
- Guardian loss/draw, wrong visit, duplicate conquest, altered result, invalid seed, and stale context fail closed.
- No clone/delete/mutate workaround exists between verify and conquest.
- Axial radius-4 map clearing and world-coordinate radius-200 helper are tested independently.
- Default squad equals first min(10,n); selection preserves order; cancel changes nothing.
- Quest board updates once through the existing board.
- Every ACHO frame remains below 1,024 UTF-8 bytes.
- Delayed/reordered script loading proves required globals are ready before fog drawing and combat challenge.

### 14.2 Identity and lifecycle

- Same world/building/slot/incarnation always derives the same identity.
- Moving the character does not change identity.
- Different slots or incarnations do not collide.
- A partial/failed snapshot cannot produce MISSING or DEAD.
- A complete snapshot can produce MISSING only under the approved coverage contract.
- A verified return restores the same identity.
- DEAD and RETIRED are terminal; replacement increments incarnation.
- Practice combat cannot kill or persist a simulated character.

### 14.3 Deterministic behaviour

- Identical accepted snapshot, event history, policy, and logical cycle produce identical choices.
- Candidate order changes do not change the stable tie-break.
- Utility ties and near-ties obey deterministic hysteresis.
- Illegal destinations, unaffordable actions, stale facts, and forbidden faction actions are rejected.
- Action budgets cannot be exceeded by repeated proposals.
- Model output cannot alter the canonical state or bypass validation.
- Scheduler load is bounded by visible/active population and a declared per-cycle budget.

### 14.4 Authority, persistence, and replay

- Invalid signature, stale sequence, broken previous hash, duplicate idempotency key, and unauthorized actor are rejected.
- Concurrent conflicting writes resolve deterministically and atomically.
- Failed transaction leaves no partial debit, credit, ownership, or lifecycle mutation.
- Replaying accepted events reproduces the same state digest.
- Expired visitor presence does not erase durable world history.
- Presence, building declaration, ownership, control, and conquest cannot be substituted for one another.

### 14.5 Factions and trade

- A faction cannot admit or expel members outside its authority.
- An NPC cannot sign a treaty or transfer title.
- Expired/revoked treaties cannot authorize new actions.
- Resource debit equals recipient credit under the same canonical unit.
- No negative balance, double spend, replay, or partial settlement.
- Retry with the same idempotency key returns the same receipt.
- Reversal is a new compensating event.

### 14.6 ACHO and accessibility

- One event ID, source, state, and cause produce the same semantic result in all readers.
- Visual and screen-reader text expose state and cause, not colour alone.
- No duplicate competing aria-live announcements.
- Speech is only declared when actual speech output is available.
- Sound metadata is not counted as physical playback.
- Audio-off and reduced-motion preserve the same verdict and machine state.
- NO_DATA cause survives every projection.
- Unicode and frame-size boundaries are checked.

### 14.7 Multiplayer

- Two, three, five, and ten clients.
- Independent browser profiles and independent networks.
- Physical Android clients.
- p50/p95/p99 for acceptance, propagation, polling wait, render delay, and total visible update.
- Request volume, error rate, reconnect, stale state, and simultaneous movement.
- Authority coordinates and visible map coordinates agree after every accepted move.
- A changed coordinate with unchanged declared direction/distance is investigated as a separate state/render parity defect.
- No WebSocket migration without measured evidence.

## 15. Decisions still requiring the Sovereign

1. Approve the canonical English term for simulated characters after Babel completes its Alphabet/collision evidence. This SPEC does not coin it.
2. Approve the stable world_id namespace and its authority source.
3. Decide whether Aduana may be extended as the single authority for persistent world mutations and replay, and under what bounded scope.
4. Approve the legal meaning of ownership, control, occupation, and conquest before any persistent territorial writer is proposed.
5. Approve which political decisions may be delegated to bounded policies and which always require human signature. Treaties and territorial transfers remain human-signed in this SPEC.
6. Approve canonical resource units, conversion rules, production/consumption cycles, and account ownership before trade can be implemented.
7. Approve lifecycle consequences such as permanent death, retirement, and replacement/incarnation rules.
8. Approve player influence mechanisms for collective policies, faction membership, and disputes.
9. Give a separate exact-scope BUILD authorization before any code, test execution, or implementation branch beyond this documentation-only SPEC.

## 16. Risk register

| Risk | Evidence grade | Impact | Required control |
|---|---|---|---|
| R2 mode is attached after verification in current source | IMPLEMENTED source defect; accepted SPEC | Practice/guardian semantics can diverge | Bounded R2 code slice and sabotage tests |
| Historical practice conquest test asserts the wrong contract | SOURCE_ONLY from R2 audit | Regression may certify the wrong behaviour | Split practice and guardian browser cases |
| No persistent simulated-character identity writer | NO_DATA(authorized_NPC_writer_not_found) | Characters cannot persist safely | Authority contract before identity implementation |
| Presence mistaken for territory | IMPLEMENTED separate systems | False ownership claims | Keep semantic boundaries explicit |
| No world-event replay | NO_DATA(world_event_writer_and_replay_contract_absent) | No reliable world history or recovery | One approved authority/history mechanism |
| Resource vocabularies are incompatible | NO_DATA(canonical_resource_units_and_conversion_not_defined) | Invalid balances and trade | Resource ontology before settlement |
| Policy v2 is not runtime-active | IMPLEMENTED validator only | Policy proposal may be mistaken for active law | Preserve v1 runtime; no v2 claims |
| Caravan SIGNED text mistaken for cryptographic signature | IMPLEMENTED textual field only | Unauthorized settlement claim | Real signature verification and human boundary |
| ACHO metadata mistaken for audible output | SOURCE_ONLY | Accessibility claims exceed evidence | Physical audio and screen-reader E2E |
| Page-local Echoes mistaken for World Memory | IMPLEMENTED page-local list | False persistence claim | Keep presentation bus separate from history |
| Physical multi-client scaling unknown | NO_DATA(physical_multiclient_E2E) | Incorrect transport/scaling decisions | Measure current transport first |
| Babel collision/tokenizer scan incomplete | NO_DATA(full_collision_scan_and_tokenizer_run) | Unapproved or conflicting names | Babel-only naming approval |

### 16.1 Current capability summary

- Map, movement, fog, building rendering: IMPLEMENTED; historical tests exist; no tests run in this SPEC pass.
- Deterministic patrol squad generation: IMPLEMENTED.
- Guardian visual pressure: IMPLEMENTED as projection, not autonomy.
- Visitor battle/replay: IMPLEMENTED; historical local Chromium evidence is documented; accepted R2 canonicalization is still missing in source.
- Visitor conquest: IMPLEMENTED as visit-local state; not persistent territory.
- Aduana visitor presence: IMPLEMENTED behind configuration and TTL; production E2E not verified.
- Node heartbeat/building declaration: IMPLEMENTED append-only evidence; not title/territory.
- World-state read projection: IMPLEMENTED.
- Echoes: IMPLEMENTED page-local presentation.
- Holdings: module implementation exists; main-route integration and durable settlement are NO_DATA.
- Caravan: PROPOSE-ONLY contract.
- Policy v2: isolated validator; not active runtime policy.
- Simulated-character registry, lifecycle writer, scheduler, persistent relationships, faction writer, treaty writer, trade settlement, and world-event replay: NO_DATA.
- Physical screen-reader, audible-output, and real multi-network multiplayer E2E: NO_DATA.

## 17. Source map

All WEB links below are pinned to 6ae932b7cdbfce3d0a3bd443d7ce11a067f9acb4 unless a different repository HEAD is shown.

### WEB

- [AGENTS.md](https://github.com/piskyRpapalo/preceptoros-web/blob/6ae932b7cdbfce3d0a3bd443d7ce11a067f9acb4/AGENTS.md)
- [visitor_battle.js](https://github.com/piskyRpapalo/preceptoros-web/blob/6ae932b7cdbfce3d0a3bd443d7ce11a067f9acb4/public/game/visitor_battle.js#L1-L48)
- [visitor_battle_ui.js](https://github.com/piskyRpapalo/preceptoros-web/blob/6ae932b7cdbfce3d0a3bd443d7ce11a067f9acb4/public/game/visitor_battle_ui.js#L24-L60)
- [visitor_conquest.js](https://github.com/piskyRpapalo/preceptoros-web/blob/6ae932b7cdbfce3d0a3bd443d7ce11a067f9acb4/public/game/visitor_conquest.js#L1-L40)
- [guardian_pressure.js](https://github.com/piskyRpapalo/preceptoros-web/blob/6ae932b7cdbfce3d0a3bd443d7ce11a067f9acb4/public/game/guardian_pressure.js#L1-L75)
- [map_fog_layer.js](https://github.com/piskyRpapalo/preceptoros-web/blob/6ae932b7cdbfce3d0a3bd443d7ce11a067f9acb4/public/game/map_fog_layer.js#L1-L48)
- [fog_of_war.js](https://github.com/piskyRpapalo/preceptoros-web/blob/6ae932b7cdbfce3d0a3bd443d7ce11a067f9acb4/public/game/fog_of_war.js#L8-L45)
- [inhabitants.js](https://github.com/piskyRpapalo/preceptoros-web/blob/6ae932b7cdbfce3d0a3bd443d7ce11a067f9acb4/public/game/inhabitants.js#L1-L31)
- [agent_state.js](https://github.com/piskyRpapalo/preceptoros-web/blob/6ae932b7cdbfce3d0a3bd443d7ce11a067f9acb4/public/game/agent_state.js#L1-L85)
- [openworld_state.js](https://github.com/piskyRpapalo/preceptoros-web/blob/6ae932b7cdbfce3d0a3bd443d7ce11a067f9acb4/public/game/openworld_state.js#L1-L109)
- [world_feed.js](https://github.com/piskyRpapalo/preceptoros-web/blob/6ae932b7cdbfce3d0a3bd443d7ce11a067f9acb4/public/game/world_feed.js#L1-L90)
- [worker/index.js](https://github.com/piskyRpapalo/preceptoros-web/blob/6ae932b7cdbfce3d0a3bd443d7ce11a067f9acb4/worker/index.js#L1-L45)
- [worker/world_state.js](https://github.com/piskyRpapalo/preceptoros-web/blob/6ae932b7cdbfce3d0a3bd443d7ce11a067f9acb4/worker/world_state.js#L1-L44)
- [echo_feed.js](https://github.com/piskyRpapalo/preceptoros-web/blob/6ae932b7cdbfce3d0a3bd443d7ce11a067f9acb4/public/game/echo_feed.js#L1-L80)
- [town_echoes.js](https://github.com/piskyRpapalo/preceptoros-web/blob/6ae932b7cdbfce3d0a3bd443d7ce11a067f9acb4/public/game/town_echoes.js#L1-L43)
- [combat_acho.js](https://github.com/piskyRpapalo/preceptoros-web/blob/6ae932b7cdbfce3d0a3bd443d7ce11a067f9acb4/public/game/combat_acho.js#L1-L55)
- [state_frames.js](https://github.com/piskyRpapalo/preceptoros-web/blob/6ae932b7cdbfce3d0a3bd443d7ce11a067f9acb4/public/game/state_frames.js#L1-L49)
- [holdings_live.js](https://github.com/piskyRpapalo/preceptoros-web/blob/6ae932b7cdbfce3d0a3bd443d7ce11a067f9acb4/public/game/holdings_live.js#L1-L90)
- [holdings_wasm.js](https://github.com/piskyRpapalo/preceptoros-web/blob/6ae932b7cdbfce3d0a3bd443d7ce11a067f9acb4/public/game/holdings_wasm.js#L1-L59)
- [holdings_map.js](https://github.com/piskyRpapalo/preceptoros-web/blob/6ae932b7cdbfce3d0a3bd443d7ce11a067f9acb4/public/game/holdings_map.js#L1-L83)
- [Caravan E2](https://github.com/piskyRpapalo/preceptoros-web/blob/6ae932b7cdbfce3d0a3bd443d7ce11a067f9acb4/atlas/puros/caravan.js#L1-L76)
- [Visitor battles contract](https://github.com/piskyRpapalo/preceptoros-web/blob/6ae932b7cdbfce3d0a3bd443d7ce11a067f9acb4/docs/visitor-battles.md)
- [Visitor conquest contract](https://github.com/piskyRpapalo/preceptoros-web/blob/6ae932b7cdbfce3d0a3bd443d7ce11a067f9acb4/docs/visitor-conquest.md)
- [Acho language](https://github.com/piskyRpapalo/preceptoros-web/blob/6ae932b7cdbfce3d0a3bd443d7ce11a067f9acb4/docs/acho-language.md)
- [Acho visual/audio contract LF-2](https://github.com/piskyRpapalo/preceptoros-web/blob/6ae932b7cdbfce3d0a3bd443d7ce11a067f9acb4/docs/acho-visual-audio-contract.md)
- [Historical map canon and status](https://github.com/piskyRpapalo/preceptoros-web/blob/6ae932b7cdbfce3d0a3bd443d7ce11a067f9acb4/docs/canon-map-details-20261107.md)

### Aduana

- [presence.js](https://github.com/piskyRpapalo/aduana/blob/1a2167a2cef5f7d419775b6ad116039b503c3960/src/openworld/presence.js#L1-L140)
- [rules.js](https://github.com/piskyRpapalo/aduana/blob/1a2167a2cef5f7d419775b6ad116039b503c3960/src/openworld/rules.js#L1-L150)
- [index.js heartbeat, read, building and routing](https://github.com/piskyRpapalo/aduana/blob/1a2167a2cef5f7d419775b6ad116039b503c3960/src/index.js#L22-L46)
- [index.js current state read](https://github.com/piskyRpapalo/aduana/blob/1a2167a2cef5f7d419775b6ad116039b503c3960/src/index.js#L217-L310)
- [index.js building declaration](https://github.com/piskyRpapalo/aduana/blob/1a2167a2cef5f7d419775b6ad116039b503c3960/src/index.js#L322-L380)
- [index.js routes](https://github.com/piskyRpapalo/aduana/blob/1a2167a2cef5f7d419775b6ad116039b503c3960/src/index.js#L675-L705)
- [schema.sql](https://github.com/piskyRpapalo/aduana/blob/1a2167a2cef5f7d419775b6ad116039b503c3960/schema.sql#L20-L70)
- [OpenWorld presence documentation](https://github.com/piskyRpapalo/aduana/blob/1a2167a2cef5f7d419775b6ad116039b503c3960/docs/openworld-presence.md)

### APP, Atlas, and Babel

- [APP Policy v2 validator](https://github.com/piskyRpapalo/preceptoros-app/blob/57cce851cefafa1511e154ee040f9492c0a9c07b/politica_v2_validator.py)
- [APP policy view](https://github.com/piskyRpapalo/preceptoros-app/blob/57cce851cefafa1511e154ee040f9492c0a9c07b/politica_vista.py)
- [Atlas shared-state consumption proposal](https://github.com/piskyRpapalo/preceptoros-atlas/blob/a89845c572f5092f0953cdbbdc4413c6023eb7a7/canon/state-consumption-contract-20261112.md)
- [Atlas COMMISSION contract](https://github.com/piskyRpapalo/preceptoros-atlas/blob/a89845c572f5092f0953cdbbdc4413c6023eb7a7/canon/commission.md)
- [Babel governance](https://github.com/piskyRpapalo/babel/blob/d871b3b390e23a22cb306fc74ec7bbb67e573646/registry/governance.md)
- [Babel game vocabulary](https://github.com/piskyRpapalo/babel/blob/d871b3b390e23a22cb306fc74ec7bbb67e573646/registry/game.md)

## 18. Governance and closeout

- This is a continuation of Living World R1.1. No new mission ID.
- WEB-B-R2 is closed at SPEC acceptance only.
- No APP repository was modified.
- The local native H / ACHO v0.4, v0.6, v0.6.7 and Native ~19 MB track remains PAUSED. No load, inference, training, benchmark, lease, or artifact change was performed or requested.
- No code, tests, deployment, merge, or production action was performed.
- The only proposed repository change is this documentation-only SPEC.
- The next implementation candidate is the bounded WEB-B-R2 code correction, subject to a separate explicit BUILD authorization.
- The Sovereign retains naming, implementation authorization, signatures, merge, and deployment decisions.

**Final status: INTEGRATED_SPEC_READY_FOR_SOVEREIGN_REVIEW · BUILD_NOT_AUTHORIZED.**
