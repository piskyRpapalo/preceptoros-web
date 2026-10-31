# main-map-single

Date: 2026-10-31
Law: buzon#30 ·6524440790 (the single map is the one the web exposes; the web is where everything exists; the app is a local instance whose only purpose is to connect to the web from anywhere: it has no map and no data of its own), precising ·6524386655 (one map only), and decree ·6523949872 (the main map must show the living colony; the colony lives only at /openworld/; «lo vivo se ve EN el mapa principal»); the Sovereign's answer to the question «which is the main map» (2026-10-31): only one map exists, the others are tests; that map must be alive at preceptoros.org with all data in the system. Rosetta A9: one state, many renders. Method: propose first, FIRMO per piece before any code (ODD).

## Objective

One map on preceptoros.org, `/openworld/`. It shows the colony with every node the system declares alive, from dated evidence, with its seal and its sentence. Nothing outside that map is the main map.

## Problem and why

- `/openworld/` already draws the colony (IC6, IC7-S3, S4, S5), but `public/openworld/estado.json` lists no node: the public sees only the tutorial cabin and the line `Colony: NO_DATA`.
- The repository has no writer of `estado.json` (measured on main `bf6516c`: the file is read by the door, the tests and two documents; nothing produces it).
- D7 says the page reads only `estado.json`. The canon says a live heartbeat is NO_DATA. So the data has to enter the system by a producer that is not a heartbeat from the apps.
- The other pages (`/face/` hub, `basic`, `atlantis`, `zombie`, `army`, `walker`) are tests by the Sovereign's answer. They are not removed here; they are labelled as tests and not linked as the map.

## Scope

In scope: the single-map declaration; the producer of `estado.json` v2 from dated, measured evidence in the repository; the labelling of the test pages.

Out of scope: a heartbeat sent by the apps or from the racks (needs its own FIRMO and a canon amendment); any node that has no dated measurement; any deletion of a test page (the Sovereign decides that).

## Options for the producer (propose; pick one with FIRMO)

- **A · build-time writer (proposed first)**: a script in `bin/` reads a source file of nodes with their dated evidence (for example `odd/data/nodes.json`, one entry per node: id, q, r, alive, seal, since, evidence) and writes `public/openworld/estado.json` in schema v2. No network, no clock inside the page. Liveness is what the evidence says, with its date; a node with no dated evidence is not written.
- **B · signed heartbeat from the apps**: needs a canon amendment and its own FIRMO. Not proposed here.

## Functions of the single map (read 2026-10-31, before amending)

Source: `ideas13oct` v2.0.1, `propuestas/2026-10-20_recursos_adjuntos/2026-10-20_ideas13oct-manifiesto-v2.0.1.md` (law), sections 2, 15, 17, 18, 23, 24. The `ideas6oct §2.5` text is not in `p0x`: the only trace is the summary in `MISION_V1_1.md` line 19 (building is the door; STALE or NO_DATA when its node falls; building is the anchor; no invented figures). Declared as NO_DATA for the full §2.5 text.

- **F1 · the map is the node.** Each building is a sovereign cell whose rules are visible before entering (sec. 2). Colony IC1 to IC7 already draws it.
- **F2 · local-first grid.** The grid runs in the browser even when the rack is off (sec. 2). The page must show the last declared state and say so, never a fake live one.
- **F3 · click by coordinate.** Click or tap on the map reports where it happened (audio, by coordinate) and offers the actions there (sec. 24).
- **F4 · the terminal is the crab's action panel** (Shell, Claws, Legs, Eyes), with a link to Summoning (sec. 24). Today's terminal (IC7-S5) is the colour anchor only: the panel is a gap.
- **F5 · live visitors and radios** (sec. 23): Radio Niebla (unmeasured, honest static) and Radio of the Node (retransmitted from the rack). Both NO_DATA until the rack transmits.
- **F6 · the contract** (sec. 18): every visible frame under 1 KB, with colour, coordinates, sound and time. Frames already meet this (IC4 to IC7); coordinates and time are added per piece.
- **F7 · core level from the action log** (sec. 17): the level is a log of what the time-interactor does; the tutorial feeds it only when played and is always skippable.
- **F8 · duel of crabs** (sec. 15): two crabs, Fourier coefficients mutate with the cycles, a signed log (commit-reveal, abandonment at 900 cycles) is the script of the animation.
- **F9 · the nine objects** (sec. 3): the laws as toys. Four revealed, five NO_DATA.

## The whole truth, and how each one reaches the map (decree ·6524501049, order 1)

| truth | source of record | writer | route to the map | status |
|---|---|---|---|---|
| nodes, colony, buildings | `odd/data/nodes.json` (to be created, dated evidence) | `bin/estado_v2.py` (option A) | `public/openworld/estado.json` | MM-2, MM-3, after FIRMO |
| frases, seals per frame | the frame contract | the colony modules | rendered on the map | DONE on main (`aby`) |
| versions and seals | `public/sw.js`, `config/sw-huella.txt` | the seal chain at build | the page footer (to be added) | PROPOSED |
| inventory V01-V19 | `odd/tasks/visual-orders-inventory.md` | the author, by hand | a generated status file at build | PROPOSED, no schema yet |
| fleet and station | the rack's measured inventory (codex lane) | codex, not this plan | a status feed, not the node schema | NO_DATA: no producer in this repo |
| ecosystem work (commits, PRs) | git history of the org | a build step reading git | a generated changelog | PROPOSED, needs FIRMO for the step |

Rule: a truth without a producer stays NO_DATA on the map, with its cause. Nothing is copied by hand into the page.

## Checklist (ladder, one piece = one PR)

- [ ] MM-1 · declare the single map in the canon note (this document) and label the test pages as tests in their own titles. No deletion. Gate: text only.
- [ ] MM-2 · source file of nodes with dated evidence (`odd/data/nodes.json`), filled only with what the Sovereign has measured and dated. NO_DATA for any node without evidence.
- [ ] MM-3 · writer `bin/estado_v2.py` (option A) and its tests: it refuses a node with no date, refuses LIVE without evidence, writes schema v2 deterministically. Contact sheet: none (no visual).
- [ ] MM-4 · publish: the writer runs in the build; the page shows the nodes it declares; verify on preceptoros.org with the Sovereign's device (doggee) and the rack. Captures: draft before deploy, definitive after.
- [ ] MM-5 · VERSION bump and seal chain in the same PR as `public/` changes.

## Constraints

- Frame and page limits: door ≤ 16 KiB; frames < 1,024 B; no network on load; sound local and synthetic.
- Seals: LIVE, STALE, STATIC, SIMULATED, NO_DATA, ERROR, per node.
- Lexicon: public text in English. Doctrine: nothing fixed in code; node labels come from the state.
- No new contract without FIRMO (the seal field is already in main).

## Verification evidence

NO_DATA: today the single map has zero nodes with dated evidence in the repository. That is the measured state; this document does not invent any.

## Standing signature

Required: FIRMO of this plan before MM-2. FIRMO per PR. Search done: `public/openworld/estado.json` (`{ nodes: [] }`), the git history of that file (two commits, neither a writer), the canon (`docs/canon-nodes-and-npc.md`, `docs/canon-node-evidence-and-account.md`), decree ·6523949872 and the Sovereign's answer on the single map.

## Methodology relief

None.

## Log

- 2026-10-31 · Single map decided by the Sovereign: `/openworld/`. Others are tests.
- 2026-10-31 · Proposal: option A for the producer; option B waits for its own FIRMO and canon amendment.

## Next step

MM-1 and the FIRMO of this plan. Nothing is built before that signature.
