# enjambre-haikus-acho

Date: 2026-11-02
Law: the Mesa's message after E-3 (order 5, swarm of haikus) and the addendum «Soberanía de Hexelion» (triggers D1-D5). Propose-only: this piece lists the swarm, gives each haiku its level and **its first measurement, already taken**, and builds none of them. Each haiku becomes its own PR with its own HITL line on the exact head.

A haiku = one logical level + one measurable change + one verification. Receipt of 3 lines (level · measure · proof) < 1,024 B.

## Already on the rail

| haiku | level | PR | state |
|---|---|---|---|
| AC-1 · pure validator | LEY | #581 | parity with `checkFrame` on 39 frames, 44 cases, red first |
| PRODUCCIÓN · the heartbeat | PRODUCCIÓN | #582 | the chain exists; **401 since 2026-11-01 17:57 UTC** (396 rejections); corrects E-3 gap #1 |

## The swarm (measured first step for each)

| # | haiku | level | first measurement (taken 2026-11-02) | the change it would make | verification |
|---|---|---|---|---|---|
| H1 | **FIRMA · fission of the book** | SELLO | `LIBRO_DE_FIRMAS.md` = 22,512 B against a 16,384 B ceiling. Largest sections: §7 HITL lines register **8,742 B**, §10 flow HITL → signatures **5,151 B**, §5 pre-signatures 2,127 B. Moving §7 alone brings the book to ~13.8 KB | §7 moves to a new file in `firmas` (append-only), with one pointer line left in the book. What it loses: one-file reading. Nothing is deleted (the book's rule 1) | `wc -c` of the book < 16,384; each line of §7 is found by `grep` in the new file |
| H2 | **LEY · `/api/creaciones/`** | LEY | `creation_flow.js:59` fetches `/api/creaciones/<id>`; production answers **404**; `worker/index.js` routes only `/api/world-state`. The web's law: «no server; signed envelopes travel by the person's channel» | **Option A**: remove the fetch and keep Send / Copy / Download (cost S, honours «no server», loses the shareable link). **Option B**: a read-only route in the worker, backed by the customs like the heartbeat (cost M-L, needs a store, a quota and a FIRMO against «no server»). The Sovereign decides | A: `git grep "/api/creaciones"` = 0 under `public/`. B: `/api/creaciones/<id>` = 200 for a signed package, 404 for the rest |
| H3 | **CANON · OPTIMIZACIONES of p0x** | LEY | p0x `master` holds the file as of **2026-09-13** (`629e88e`). The local side branch `haiku/optimizaciones-20261031` adds **101 lines**: one commit (`0f3b7e9`) on **no remote**, plus this session's entry, uncommitted. p0x push is blocked on the rack by design (RT-3C ·6549828098) | Bring it to the canon: the carbon pushes the branch with one `!` line, or the lessons stay cited here as `NO_DATA: lessons since 09-13 live only in one local clone` | `git branch -r --contains 0f3b7e9` is no longer empty |
| H4 | **MCP · the tentacles speak Acho** (addendum D2) | LEY | `bin/mcp_preceptoros.py`: protocol `2025-11-25`, `FRAME_LIMIT = 1024`, tool `web.validate_bubble`. «bubble» appears **6 times there and 6 in `tests/test_mcp_preceptoros.py`, 0 in both manifests**. Nothing under `public/` → **no reseal** | Rename the tool to `acho.validate` (the exact name is AC-0b's, in the Lexicon), with the old name as a declared alias for one window (D5). Protocol and limit untouched | `tests/test_mcp_preceptoros.py` green; `git grep -i bubble` = 0 in the two files outside the alias line |
| H5 | **CUADRO · native Acho per device** (addendum D1) | CUADRO | The seam is `atlas/puros/state_frames.js` (`stateFrame`, served copy in `public/game/`). Its `valida` counts `texto.length` without `TextEncoder` (AC-1 note). `Acho.valida` exists unserved (#581) | An ODD piece «ACHO NATIVO POR EQUIPO»: who converts vector → frame (`state_frames`), who judges (`Acho.valida`), with what seal (D5 window). REQUIRES_SIGNATURE before code | the ODD piece names the converter, the judge and the seal for each host |
| H6 | **ESTADO · census card per device** (addendum D3) | ESTADO | Measured from this node: the phone (ADB, Chrome 156, Ed25519 ok, SW at `dl`); the rack node behind the tunnel (`/api/world-state`: STALE since 11-01); the heartbeat node (401). **NO_DATA** for the rest of the fleet: propose-only toward other nodes | one frame ≤ 1,024 B per device, measured fields only, `NO_DATA` with cause elsewhere; together, the index = the map | each card passes `Acho.valida`; each field cites its reading |
| H7 | **LEY · benchcard for a new brain** (addendum D4) | LEY | No benchcard for the 35.5B F16 model in this node's tree (`find` = 0). It runs on another node: the probe can only be **proposed** here | the same probe as the writer's batch, 3 warm runs, tok/s prompt and generation, with backend | the card carries 3 runs, the backend and the model's exact tag |
| H8 | **SELLO · Rosetta seed for the LoRA** (addendum D5) | SELLO | No Rosetta file in this node's p0x tree (`find` = 0): it lives in the forge on another node. **NO_DATA** here | after AC-0 and AC-0b, export the renamed corpus (Lexicon + Acho docs) as the seed, with zero «bubble» outside the alias | `git grep -i bubble` over the exported corpus = 0 outside the alias lines |

## Order proposed

H3 (S, carbon's push) · H1 (S) · H2 (decision) · H4 (S, after AC-0b names the tool) · H5 → H6 (after the vector study) · H7, H8 (other nodes, propose-only).

Rules kept: never two live PRs resealing the same tree. None of H1-H8 touches `public/` except H2 option A, which then waits behind TF and AC-0 for a letter.

## Seen while measuring (recorded, not touched)

On the Sovereign's node, two more user units are failing: the rack snapshot (`failed`) and the ecosystem room (a restart loop). The heartbeat unit is not listed in the node's unit register. This is out of every haiku here: the Ojo and the units belong to the Sovereign.

## Log

- 2026-11-02 · written on main `5cc55dac`. Docs-only. Each measurement above was taken this day.
