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

## Next step

IC1 + IC2 (codex): hex lattice state core and iso projection, propose-only, gates n=2, one PR each.
