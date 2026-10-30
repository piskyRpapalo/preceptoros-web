# isometric-colony

Date: 2026-10-28
Law: Sovereign decree of 2026-10-28 (the graphics choke point of the MVP) + FIRMO ODD permanent (docs-only, decree 2026-10-28).

## Objective

The global node map as a 2.5D isometric hex colony in comic ink, drawn natively in bubble language: one more render of the same state. Each entity of the map has its place and its building; the space is the attention interface. Working name (grey area, not coined here): the isometric bench.

## Problem and why

The map of nodes today reads as a list, and the house has no drawing catalogue at all: nothing in the web or the app shows the colony the way a human eye wants to read it - as a place you can learn. The Sovereign names the graphics choke point of the MVP and decrees: no 3D editor today; the centre of gravity is a list of preconfigured images with their evolutionary part in the ephemeral tutorial.

## The reference (measured 2026-10-28, cited and never copied)

Bot Crossing, github.com/Station-Sciences/bot-crossing: MIT, 94 commits, active through 2026-10-23, by Jarren Rocks; the author's video (~14.7K views, sep 2026) shows the feel we want. The repo is downloaded in the rack and read; what the sessions need from it is the pattern of its proof tools, not its code.

Adopted (the sensation, the perspective, the mobility of units for our one-KB screenshots; above all the measurements and the 3D consistency):

- The colony: one hex zone per entity, one bot + one building per session; a place you learn because the layout is sticky (the previous arrangement is an input to the next one).
- Unit state as a strict precedence ladder, first match wins, one state at a time; only the states that want something from you get a badge; a name plate shows only while somebody is working, waiting or stuck.
- One reference height every prop is measured from (their deck slab number); consistency over decoration.
- Their proof-tools pattern: standalone check pages over a synthetic fixture with a seeded RNG and a screenshot contact sheet (visual-check, render-check, picking-check, occlusion-check, face-sheet, bot-showcase) - this is what the rack sessions use to measure fidelity to the eye, with temporary screenshots from the live fleet devices.
- Day/night as a palette that rotates with t. Their "Live" mode follows the machine's wall clock: NOT adopted (our law is the cycle, never the wall clock).
- "When one needs you, it stops": propose-only discovered independently by them - convergence registered, not a novelty. Ours has teeth (FIRMO + the fence).

Not adopted (fences):

- No 3D engine, no three.js, no imported models, no free camera: they die at the first-load ceiling and in the stdlib. Nothing alien enters the door.
- Disposable software ("3-6 tools a day"): incompatible with append-only and receipts.
- The "...Crossing" name pattern (a franchise that is not ours). Our name is measured for collisions first.
- Nothing is uploaded, nothing reads the harness: that part of their problem is not ours; our colony state is same-origin and served by the Worker.

## Design

- Hex lattice, fixed axonometric angle. One building per hexagon; the central hexagon is the principal node (Node.0 creates Atlantis; the Risen and the fleet queue stand around it - Rosetta). Six neighbours per cell: the right node map for a fleet. The hexagon is the house name, not an imitation.
- All native bubble language: hexagons, buildings and sprites are procedural comic atoms drawn by the existing painter (public/game/bubble_paint.js; prims in bubble_language.js: wave, blob, ribbon, arcs, field, wall, text, keep, neck; new words go through define(), never a fork of the core). Zero imported assets, zero network.
- Growth: a building is born as a blob in peristalsis using the worm ops already in the metal. Measured: neck lives in main (bubble_language.js neck(); atlas/neck_cases.mjs; worm_transition.js gusano() is built on it). settle/wobble are NOT in main today - NO_DATA, cause: the external grammar is registered as a pointer and not coined. Slice IC4 either composes neck + blob + seeded rng, or proposes coining settle/wobble as define()'d words inside the same slice. Reduced motion = arrival in one step (the standing law).
- A node appears only when it is alive (the zero-nodes decree stands); a fallen node disappears like any other user - no error panels, no placeholders.
- Every visible change travels as a state frame (atlas/puros/state_frames.js): one sentence per atom, sound declared from the frame's own data, under 1,024 UTF-8 bytes.

## The catalogue (the decree focus)

A list of preconfigured images, each one a bubble-language frame born from the state, each with its lexicon key: the Risen (zombies), the sea creatures of the Submerged Forest, the fleet units of the rings, the cabin, the Tower, and the buildings of the colony. Their evolutionary part lives in the ephemeral tutorial: the tutorial shows the stages of a creature as ephemeral frames and they die when the tutorial ends - nothing persists that the state does not declare. No editor is built today (web or app).

## Checklist (construction order, delegated to the Mesa)

- IC1 - hex lattice state core: the colony as rows in the state (node, building, unit), pure, under 1,024 B, with cases and sabotage. Owner: codex.
- IC2 - iso projection: pure function from a hex cell to the screen at the fixed angle; same vector/1 gives the same bitmap, byte-identical, two runs. Owner: codex.
- IC3 - catalogue core: the preconfigured sprite frames with their lexicon keys; a sprite without a key is an orphan_visual_node error. Owner: claude.
- IC4 - buildings and birth growth from IC1 (peristalsis; reduced motion honoured). Owner: claude.
- IC5 - day/night palette rotating with t (cycle, never wall clock). Owner: claude.
- IC6 - the colony page in the openworld door: audio from the frame's own data, SW seal and VERSION bump in the same commit if public/ changes. Owner: claude.
- IC7 - the ephemeral tutorial evolution of the catalogue. Owner: claude.
- IC8 - visual-check page: a synthetic colony fixture, seeded rng, contact sheet, served for rack sessions. Owner: codex.
- IC9 - app twin identical (Rosetta A9). Owner: codex.

Ladder: pure cores first (IC1, IC2), then the catalogue (IC3), then the render slices (IC4-IC7) with IC8 in parallel, the twin last (IC9). One slice, one branch, one PR; propose-only; the fence gates every merge.

## Gates and sabotage

- Red before green: the FIRST motion measure runs on the weakest live device of the fleet ring, not on the strongest node. If the weak device cannot move it, the render serves fewer people than the current law: that is drift, not ship.
- Gates n=2: same vector/1, same iso bitmap, byte-identical, two runs.
- Sabotage (each one must be able to go red): a sprite without a lexicon key; a bitmap hash that changed without a state change; a building without a row in the state; a day/night palette reading a wall clock; Math.random or Date.now in the render path.

## Verification evidence

- Reference measured as stated above; read: README (colony semantics, sticky zones, the precedence table, planets and light, the never-getting-stuck rules), DECISIONS.md (one writer for the map file; sounds refuse to load without a synth - convergence with our audio law), tools/ (the check pages listed above). Cited, not copied; the license and their reserved marks are theirs.
- Local ground truth measured 2026-10-28 on web main: painter and prims as named in Design; worm and frames law as named in Design; the 1,024 B frame law and the reduced-motion law measured in atlas/puros/state_frames.js.
- settle/wobble: NOT in main - NO_DATA with cause, recorded here.

## Standing signature

This document is docs-only: covered by the FIRMO ODD permanent (decree 2026-10-28). Code slices are pieces of value: each needs its piece FIRMO on the exact head, per the standing approval rules; the fence gates every merge.

## Methodology relief (the one law amendment, decree 2026-10-28)

Fidelity to the eyes of the carbon and to the understanding of the orchestrators and the small local models: a render is right when a human eye reads it at a glance AND a small model can parse the same state. Landed as an amendment in the study legislation (docs-only, same day).

## Log

- 2026-10-28: the doc is born from the Sovereign's decree; the reference is measured and cited; the Mesa defines the construction order and the slice owners; commissions served on the PR of this document.
- 2026-10-28 (evening, NODO-MAPA, branch `haiku/global-map-20261028`): the global map with the first three nodes, node-only, in the openworld door. Choices and stand-ins, each one reversible:
  - IC1/IC2 (codex) were not on main when this was built. Lawful default: the existing `public/game/isometric_floor_projection.js` (fixed axonometric cell, same numbers every run) places the three nodes on their lattice coordinates (cabin 0,0 · Atlantis -2,1 · the Risen 2,-1). No hex-lattice core is written here. When IC1/IC2 land, their core replaces this stand-in; one state, many renders.
  - `mana` coined in `docs/lexicon.md` (the Sovereign's term). Collision scan 2026-10-28: no project term in the web repo; in `p0x` the word appears only in tokenizer vocabularies, third-party locale strings and video-prompt text.
  - Cabin mana: no measurement source is wired yet, so it is `NO_DATA` with its cause, written into the frame sentence. No value is invented. A mana wave is drawn only from a measured whole number 0-100.
  - The base sound of each bubble is the tutorial sea's own wave (the frame's design data, as the door drew before). A measured mana adds a second wave. The listen control plays the selected frame's own sound.
  - Live state: `public/openworld/estado.json` lists no nodes, so the live map shows the cabin alone. The three-node picture is a labelled SYNTHETIC fixture; it proves the render path and is not a measurement of a live node.
  - The door fetched `/openworld/state.json`, which does not exist on disk. It now fetches `/openworld/estado.json`, the file that is there. Additive correction, declared.
  - The cycle: `t` advances one tick per second in the door, and the palette reads `t` only (never a clock). Reduced motion: no cycle.
  - Tests moved with the law: `test_web` (OpenWorld) now asserts the three rows in `global_map.js`; `test_atlas` declares `global_map.js` as on-demand, outside the precache, and the door's isometric dependency. Same law, new location.
  - Seal: `public/sw.js` VERSION `preceptoros-2026-17-abke` → `abkf`, huella re-stamped by `bin/sellar.py`, counters re-measured by `contadores.py`.
- Verification evidence (measured 2026-10-28):
  - `atlas/global_map_casos.mjs` 328/328 (pure). Sabotage inside it: an orphan key throws `orphan_visual_node`; a poisoned `Date` changes no byte; a jittered frame moves its hash; a `Math.random` in a synthetic file is caught by the grep gate.
  - `atlas/global_map_gate.mjs` (headless Chrome, `atlas/global_map_visual.html`): clean run n=2 identical on 8 scenes (2 rows × 4 ticks 0/30/90/120); sabotage `jitter` → n2 false; sabotage `clave` → refused as `orphan_visual_node`. Receipts: `atlas/global_map_recibos.json`. Picture: `atlas/global_map_contact_sheet.png`.
  - Frame sizes: largest node frame 699 B over all 240 ticks with measured mana 100/0; sky frame 262 B. Law: under 1,024 B.
  - Palette: t=0 `#17131f` (night) · t=120 `#f4ebd0` (day) · period 240 ticks, integer lerp.
  - `test_web.py` 86 tests OK (1 skipped, pre-existing) · `test_atlas.py` 190 tests OK.
  - NO_DATA · motion on the weakest device of the fleet ring: not measured here, no device at hand; the cycle has been measured only in headless Chrome.
  - NO_DATA · live liveness of Atlantis and the Risen: no source wired on the web; `estado.json` lists none.
  - NO_DATA · mana of the tutorial cabin: no measurement source; shown as NO_DATA.
- Standing signature: the search was done against the PR #387 comments (the Sovereign's mandate of 2026-10-28, evening, naming the three nodes and the coinage of `mana`) and against the repo's seal and lexicon rules. Both are covered; no other signature is needed for this slice. Buildings (IC4) are NOT in this slice and wait for the Sovereign's piece FIRMO.

- 2026-10-29 (IC3, branch `haiku/isometric-catalogo-ic3-20261029`): the catalogue core in `atlas/puros/catalogo_iso.js` (pure UMD, not served). Each living row of the state becomes one bubble-language frame, sorted by id; the kinds are six lexicon keys (`sprite.cabin`, `risen`, `sea`, `fleet`, `tower`, `building`) with a fixed wave table; a kind without a key or a row without id is refused as `orphan_visual_node`; a value not measured (whole 0-100 only) is NO_DATA with its cause and does not sound; a `sintetico` row says SYNTHETIC; a `vivo: false` row is not drawn. Evidence: `atlas/puros/catalogo_iso_casos.mjs` 12/12 (sabotage: unknown kind, missing id, out-of-range value, frame over 1,024 B, Math.random/Date/fetch grep). Not served: no change under `public/`, so no SW VERSION bump. IC4 (buildings, birth growth) waits for the Sovereign's piece FIRMO.
- 2026-10-29 (IC4, branch `haiku/isometric-edificios-ic4-20261029`, on main ad89776): buildings and birth growth in `atlas/puros/colonia_edificios.js` (pure UMD, not served), over the colony of IC1 and the projection of IC2. Every node is a hex module, coloured from a hash of its id (house bands: vermilion, comic yellow, ocean, cyan, paper, ink); every building is a frame whose shape (dome, tower, block) comes from a hash of its id. Growth: six steps, p from 1/6 to 1; reduced motion arrives whole in one step. Units are not drawn (buildings only). Evidence: `atlas/puros/colonia_edificios_casos.mjs` 12/12; `atlas/colonia_edificios_gate.mjs` green (pure cases, two clean runs identical on 8 scenes, reduced motion equal to the whole, sabotage jitter and nodo red); contact sheet `atlas/colonia_edificios_contact_sheet.png`. Stand-in: the smoothing of the bubble painter rounds closed shapes; corners are doubled so the hexagons keep straight edges (declared, not a new primitive). NO_DATA: birth growth is scaled, not the neck peristalsis (the neck composition is not measured here); the weakest-device motion is not measured. gate.yml is not edited: its line waits for the Mesa's order after #409.

- 2026-10-29: the Mesa ordered the IC4 cases and visual gate added to the workflow (buzon#30 ·6511406023).

- 2026-10-30 (IC5, branch `haiku/isometric-paleta-ic5-20261030`, on main 86bf9a8): the day and night palette as a pure core in `atlas/puros/paleta_ciclo.js` (not served). The colours read the tick t alone: whole ticks only (a fraction is refused as a clock), period 240, noon at 120, the measured night `#17131f` and day `#f4ebd0` of the global map, integer lerp. Reduced motion is no cycle: the palette stays at noon and no sky frame changes. Sky changes travel as state frames under 1,024 B. Evidence: `atlas/puros/paleta_ciclo_casos.mjs` 12/12, including tick-by-tick equality with the global map over 480 ticks and the sabotages (wall clock moving, Math.random throwing, a fractional tick); `atlas/paleta_ciclo_gate.mjs` green (two clean runs identical on 7 scenes, sabotage jitter and reloj red); contact sheet `atlas/paleta_ciclo_contact_sheet.png`. NO_DATA: device motion of the weakest ring device; the ink band of the buildings is hard to tell apart from the night sky (observed, not changed). gate.yml is not edited: its line waits for the Mesa's order in the PR.

## Next step

The Sovereign's piece FIRMO on the exact head of the global-map PR, after he sees `atlas/global_map_contact_sheet.png`. That FIRMO releases IC4 (the first buildings). Codex's IC1/IC2 later replace the stand-in projection.
