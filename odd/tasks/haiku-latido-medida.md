# haiku-latido-medida

Date: 2026-11-02
Level: **PRODUCCIÓN**. Law: the Mesa's swarm order (haiku-PRODUCCIÓN, gap #1 of E-3: «run the heartbeat chain by hand and diff the state; leave the measure, not the fix»). Propose-only. No fix inside: the cause is a credential, and credentials belong to the Sovereign.

## Measure

The chain exists, end to end, on main `5cc55dac`:

timer (240 s, on the Sovereign's node) → `f1_heartbeat.py` (`preceptoros.latido/1`, node `primer-ancla`) → the customs `api/v1/latidos` → `worker/world_state.js` (`/api/world-state`, `no-store`, ≤ 16,384 B) → `public/game/world_feed.js` → `/openworld/` (`openworld_page.js:296` refreshes the colony from it).

Read on 2026-11-02, GET only:

| link | reading |
|---|---|
| `/api/world-state` | **200**, 423 B, schema `openworld-estado/2`, `cobertura: MEDIDO · 2 · node_heartbeats`. Two nodes (`primer-ancla`, one rack node), both **STALE since 2026-11-01**. `units: []` |
| `/openworld/state.json` (static) | 200. Four colony nodes with `since: 2026-10-30`. This is the fallback that E-3 read as «the state» |
| the timer | active, fires every 240 s |
| the one-shot service | **failed**. Last accepted heartbeat: **HTTP 202, 2026-11-01 17:57:38 UTC**. Since then, **396 rejections, HTTP 401** (54 B body), about 15 per hour, until this reading |

## What this corrects (CORREGIDO POR this haiku)

E-3 gap #1 said «no heartbeat producer on main». That is **wrong**. The producer and the route exist and worked until 11-01 17:57 UTC. What broke is **the credential**: the customs refuses the heartbeat's key. The map is STALE because the key stopped being accepted, not because the chain was never built. The score of gap #1 stays (the map is stale either way), but its first step changes: the next measurement is not «build», it is «why 401».

## Also seen (out of this haiku's level, recorded only)

- The unit is **not listed** in `deploy/soberano/unidades.md` (0 mentions). The node's canon asks for one signed entry per unit.
- Two more units of the same node are failing: the rack snapshot (`failed`) and the ecosystem room (`activating auto-restart`, a restart loop).

## Verification

Any reader repeats it in one minute: `curl -s https://preceptoros.org/api/world-state` → read `since` and `seal`. On the node: the unit's journal → count `"http":401` after the last `"http":202`.

## Decisions for the Sovereign

1. **Rotate or re-register the heartbeat key** at the customs (a secret: only the carbon).
2. Record the unit in `unidades.md`, or retire it.

## Checklist

- [x] HL-1 · chain traced link by link, every link read.
- [x] HL-2 · the break dated (last 202) and counted (396 × 401).
- [x] HL-3 · E-3 gap #1 corrected.
- [ ] HL-4 · the fix: Sovereign only.

## Log

- 2026-11-02 · measured on main `5cc55dac`; no code, no secret read (only the HTTP status and the byte count of the replies).
