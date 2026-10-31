# Play without a node · construction audit

## Recent construction audit — correction, 2026-10-30

This evidence supersedes any reading above that treats territory, economy, NPC content or conquest as entirely unbuilt. Window: 2026-10-01 through 2026-10-30. Commit dates establish repository history, not fresh production/browser verification.

| Date | Main-history evidence | Constructed behavior | Integration limit |
|---|---|---|---|
| 2026-10-10 | 6276f4c | Local NPC conquest, sanitized atlas-conquista persistence through db.js, local-practice flag; commit records browser reload verification | Prior conquest persists; JN-5 session-only policy is a proposed change, not preservation of existing behavior |
| 2026-10-11 | 1d0f974 | gdpr-art7-entry-choice.js explicitly offers Open sea: play, fight NPC patrols, propose without node acceptance | Historical territory contract already exists; reuse its meaning instead of inventing territory rules. Its former UI is not proof of current OpenWorld wiring |
| 2026-10-11 | d4fa276, 0ac25e4 | Paid egg chain survives reload; visible odds and invocation chronicle; historical pity behavior exists | Commission still keeps pity NO_DATA; do not reactivate historical behavior without reconciling its signature/scope |
| 2026-10-23 | fed7f94 | Egg save awaited and rapid invocations serialized | Reuse existing transactional behavior |
| 2026-10-23 | e1ebf42 | Served creation_flow signs through optional persistent Identity | Ephemeral key in creation-package documentation refers to generate.mjs, not this browser signing path |
| 2026-10-25 | 394e992 | face_tutorial.js defines beacon reward 100 copper/0 light and battle-step reward 50 copper/0 light; face_eggs.js starts at zero and grants rewards; face_battle derives patrol seeds/troops from valores.patrullas | Existing tutorial economy and NPC definitions are evidence, not a signed automatic allowance or measured balance for the new anonymous wave route |
| 2026-10-27 | 3239165 | Face combat redirected toward the existing wave scene | Rendering integration is distinct from W1 rules and measured balance |
| 2026-10-28 | 752338f | Old play entry and its exclusive game files retired | Historical removal explains missing wiring; absence at the new door does not mean never built |
| 2026-10-30 | 423c5c3, f20ebd8 | SHA-256 wave core and pure scene composition | Still require the visitor route and explicit content/authority adaptation |

Current source inspection confirms face_eggs requires Identity for summoning, face_tutorial requires a key as its first step, face_battle constructs NPC troops deterministically, and db.js still exports conquistasWeb. Main basic.html still loads face egg/army/fight/tutorial modules in the inspected origin/main tree. This does not establish anonymous functionality or a live deployment measurement.

Revised scope: JN-2 remains the new visitor authority adapter. JN-3 must adapt existing egg/economy flows rather than rebuild them; propose reusing the existing beacon reward progression, with explicit approval for this route, rather than inventing an initial grant. JN-4 must inventory existing patrol definitions and scene adapters before adding content. JN-5 must explicitly reconcile historical persistent local conquest with the commissioned session-only record; no silent deletion or migration. Existing Open sea territory is the starting contract for the same-map visitor layer. Balance, browser ephemeral custody, Aduana transition compatibility and current zero-node end-to-end play remain NO_DATA until directly verified.


## Production and source measurements

Authority: Mesa v3 commission. This section supersedes conflicting inventory/deployment statements above. Inspection UTC 2026-10-30 21:41–21:43; main d37edeb877c6b5c61dc79dc3fa7f84a6f3aa84b1. Read-only HTTPS GET with curl; no deployment, POST or runtime code changes.

Production results: service worker VERSION al (6,924 B), basic.html 3,455 B with zero face_eggs and battle-sheet references; Atlantis 13,402 B and Zombie 13,635 B each retain one egg script and one battle sheet. Army 1,457 B declares NO_DATA. OpenWorld 17,328 B loads gacha.js and retains “Army fixture”. Thus the earlier claim that main basic loads egg/battle modules is superseded. Current face battle/name gates restrict face coverage to Atlantis/Zombie and separately measure the neutral terminal. Source tree contains npc_occupancy cases, no served module.

Production already serves al, superseding the supplied ah snapshot. OpenWorld exceeds this commission's 16,384-byte raw door ceiling by 944 B; byte equality with the local served file and browser/device captures remain to be measured per slice. JN must not add to this excess: the first signed door slice must reduce it before claiming compliance. HTTP bytes are not a device/browser pass.

GET Aduana health returns 200 and preceptoros.aduana/2. GET /api/v1/latidos returns 200, empty colony and NO_DATA cause identidades_canonicas_no_configuradas. This establishes the read route, not POST receipt, configured identities, emitter deployment or timer operation. Those remain NO_DATA; no write probe was authorized or performed. Current local Aduana source contains a heartbeat handler and D1 binding; configuration alone proves no deployment. Inspected registration handler verifies node credentials and SSH signatures. No adoption receiver was found: adoption 64hex key/128hex Ed25519 verification is evidenced in web db.js, not attributed to Aduana without endpoint evidence.

