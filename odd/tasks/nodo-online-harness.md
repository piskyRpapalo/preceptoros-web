# nodo-online-harness

Date: 2026-11-02
Law: the Sovereign's order of the night of 2-nov: «when we can, we run the test of the online node creating its terrain, we test the validity of the app as harness, and we prepare collaborators to write on GitHub with the new rules». Status: **PLAN · REQUIRES_SIGNATURE**. Zero code here; each step below is its own piece.

## What exists, measured 2026-11-02

| link | reading |
|---|---|
| live state | `/api/world-state` 200: **2 nodes** (`primer-ancla` LIVE since 11-02 at q0 r0, one rack node STALE since 11-01 at q1 r0), 1 building, **0 units** |
| heartbeat | one producer on the Sovereign's node, every 240 s; it was rejected (401) from 11-01 17:57 UTC until the key was rotated at 20:42 UTC (`haiku-latido-medida.md`) |
| terrain | `public/game/global_map.js` `terrenoMarco(col, fila)`: tile type from `hash32`, deterministic; no terrain is tied to a node's own data yet |
| the app | PreceptorOS `bin/preceptoros-pwa` (stdlib, started by hand, endpoints for the chat); `interface/face/` vendors the web language, pinned by sha256 (`odd/tasks/app-acho-ac0.md`, PreceptorOS#151) |
| Acho | validator (AC-1), rename + load-bearing seal (AC-0, #584), readable line + sound verdict (AC-3, #589) |
| audio | **0 of 10** map frames sound (AC-3 reading): the map is silent |

## The test, in four pieces (one PR each, in this order)

1. **NO-1 · the node draws its own terrain** (level CUADRO). A node's terrain frame comes from its own heartbeat (id, seal, since) through `hash32`, not from a fixed grid: same heartbeat, same tiles. Each tile frame passes `Acho.valida` and reads through `Acho.lee`. *First measurable step:* for the two live nodes, the bytes and the `alt` of their terrain frames, today `NO_DATA` (no such frame exists).
2. **NO-2 · the online node is born on the map** (level PRODUCCIÓN, propose-only). A new node's first accepted heartbeat appears in `/api/world-state`, and its terrain is drawn on `/openworld/` on a real phone. *First measurable step:* time from the first 202 to the node being visible on the test phone, read with the actions probe plus ADB. Needs the Sovereign's hands for any key.
3. **NO-3 · the app as harness** (level LEY). The app opens the same `/openworld/` state, validates every frame with `Acho.valida`, and speaks each `alt` aloud. *First measurable step:* the share of frames the app accepts against the share the web accepts for the same state (they must be equal), plus app CI green. It waits for the app's AC-0 (PreceptorOS#151).
4. **NO-4 · the map gets its voice** (level CUADRO). Bots and buildings carry the harmonics of their node, so `Acho.oye` says «Sound». *Target:* coverage from 0/10 to 10/10, or `NO_DATA` with cause per frame. It touches `public/`: it reseals and waits for its letter.

## Collaborators

The rules for writing in Acho (why: audio, local models, blind readers) are in `CONTRIBUTING.md` («Writing in Acho», #591). NO-4 is listed there as a first contribution.

## Checklist

- [x] NO-0 · this plan, measured.
- [x] NO-1 · terrain frame from the heartbeat: `atlas/puros/node_terrain.js`, seven tiles per node keyed by the FNV-1a hash of id, birth day and offset (the seal changes the sentence, never the land); water tiles carry a wave and sound. Gate `atlas/puros/node_terrain_cases.mjs`, 8 cases; red first (keying on the seal fails 2). On the two live heartbeats of 2026-11-03: 14/14 tiles pass `Acho.valida` (largest 512 B), 3 sound.
- [ ] NO-2 · the online node born on the phone (Sovereign's hands for keys).
- [ ] NO-3 · the app as harness, parity of verdicts with the web.
- [ ] NO-4 · the map sounds.

## Log

- 2026-11-02 · plan written on main.
