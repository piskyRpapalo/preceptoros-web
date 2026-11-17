# First Journey Contract

Date: 2026-11-15
Law: HEXELION · JUNIE · FIRST JOURNEY CONTRACT (Soberano decree); tutorial-walk.md (G4-1, D19-D22); duel_states.js (D5); acho.js (AC-1).

## Objective

Extend the existing `tutorial_walk.js` (3 steps: key, beacon, node) with a complete, reusable state machine contract for the first journey:

```
WELCOME → TRAVEL → NODE_0 → SUMMON → BATTLE → CONQUEST → BUILD → EXPLORE
```

Deliver a pure contract and its test fixtures without editing Claude's visual components.

## Decisions (declared)

- **D19 · Skip is never completed.** A skipped step stays `skipped`, never `completed`. (Inherited from tutorial_walk.js)
- **D23 · Battle screen ≠ victory.** Opening the battle screen does not advance the state. The battle must be fought and won.
- **D24 · Building card ≠ building.** Viewing a building card does not grant the building. The building must be actually built.
- **D25 · Skip to EXPLORE without fabrication.** The player may skip the entire tutorial and go to EXPLORE. Skipped steps are recorded as skipped, not as completed. No rewards are fabricated.
- **D26 · NO_DATA never becomes success.** A `NO_DATA` outcome is never transformed into `ok` to improve the experience.

## Files delivered

| File | Role | Lines |
|---|---|---|
| `atlas/puros/tutorial_journey.js` | Pure contract: state machine, "!" signal, parity table, hex routes, visitor isolation | 610 |
| `atlas/tutorial_journey_cases.mjs` | Transition tests: full journey, each transition, rejection cases, skip semantics, determinism | 356 |
| `atlas/hex_route_cases.mjs` | Hexagonal route tests: axial distance, BFS routing, blocked paths, prohibited cells | 286 |
| `atlas/tutorial_parity_cases.mjs` | Parity tests: Eye/Ear/Machine for 9 events, NO_DATA consistency | 183 |
| `atlas/tutorial_isolation_cases.mjs` | Visitor isolation tests: independent progress, logs, signals | 232 |

## Contract summary

### States (8)
`WELCOME`, `TRAVEL`, `NODE_0`, `SUMMON`, `BATTLE`, `CONQUEST`, `BUILD`, `EXPLORE`

### Transitions (7)
Each declares: `from`, `to`, `prerequisite(state, context)`, `event`, `action`, `result`, `reject`, `nextAction`.

### "!" Signal
Each state has exactly one priority action with: `icon`, `accessibleName`, `voiceInstruction`, `actionId`, `disabled`, `disabledCause`.

### Parity (9 events)
`summon_completed`, `summon_rejected`, `battle_lost`, `battle_won`, `conquest_local`, `conquest_credited`, `building_unlocked`, `node0_no_response`, `reward_pending`.

Each produces: Eye (marker, card, animation), Ear (spoken text), Machine (state + receipt with `v: preceptoros.journey/1`).

### Hexagonal Routes
- `axialDistance(q1,r1,q2,r2)` — mathematical distance via max(|dq|,|dr|,|ds|)
- `hexRoute(nodes, seals, fromQ, fromR, toQ, toR)` — BFS over visible nodes
- `routeCrossesProhibited(path, seals, nodes)` — validates suggested routes
- Routes cannot traverse prohibited cells (non-visible nodes)

### Visitor Isolation
- `createVisitorJourney(visitorId)` — tagged journey
- `isolate(journeyA, journeyB)` — verifies independence
- Independent logs, independent progress, independent signals

## Verification evidence

Measured: 95 tests, 4 suites, 0 failures, 2 executions.

```
Execution 1: 95 pass, 0 fail, 66.6ms
Execution 2: 95 pass, 0 fail, 66.6ms
```

Sabotage tests included:
- Battle screen opened without fight → rejected (D23)
- Building card viewed without build → rejected (D24)
- Skipped step never becomes completed (D19)
- Skip to EXPLORE without fabricated rewards (D25)
- NO_DATA never transformed to success

## Standing signature

Required: FIRMO of this plan, then FIRMO per PR.

## Methodology relief

None.

## Log

- 2026-11-15 · Contract created, 95 tests pass ×2. Isolated patch in `atlas/puros/` and `atlas/`. No files under Claude's CLAIM were modified.
