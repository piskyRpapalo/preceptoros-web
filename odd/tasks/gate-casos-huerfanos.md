# gate-casos-huerfanos

Date: 2026-11-02
Level: **LEY**. Law: the Sovereign's order «touch what nobody talks about» (2-nov night). The house's own law: «a gate that never ran did not pass» (firmas `AGENTS.md`, rule 3).

## What nobody was looking at

`atlas/todos_los_casos.mjs` discovers only `atlas/*_casos.mjs` and `questions/*_casos.mjs` at the top level, and the workflows name the rest one by one. **11 suites in subfolders were run by no gate** (measured on main `b849f743`): every one of them is written, none is checked.

Run on main, 2026-11-02:

| suite | result |
|---|---|
| `atlas/fixtures/first_journey_cases.mjs` | green |
| `atlas/ojo/eye_descent_cases.mjs` | green |
| `atlas/puros/battle_replay_controls_cases.mjs` | green |
| `atlas/puros/bench_move_cases.mjs` | green |
| `atlas/puros/colony_page_cases.mjs` | green |
| `atlas/puros/colony_controls_cases.mjs` | green |
| `atlas/puros/map_scene_cases.mjs` | green |
| `atlas/puros/openworld_state_cases.mjs` | green |
| `atlas/puros/tutorial_walk_cases.mjs` | green |
| `atlas/puros/walk_route_cases.mjs` | green |
| `atlas/ojo/eye_words_cases.mjs` | **red**: `ojo ok=false`. Its fixtures load `public/game/bubble_game.js`, retired with the cut of North 7 D. Red for some time; nobody saw it, because nothing ran it |

`atlas/puros/colony_page_cases.mjs` is the parity gate of the colony page with its served copy. It was the one whose silence weighed most.

## Change

The 10 green suites join `gate.yml`, in one block after `colonia_edificios_casos`. `ojo_palabras` stays out, declared red with its cause. It gets cured in its own piece: point its fixtures at live files, or retire the suite with its retired file.

## Verification

Each of the 10 runs green on this branch (n=2). The YAML parses. No file under `public/`, so no reseal.

## Open (for the Mesa)

- The discovery runner could walk subfolders. Then a new suite could never be orphaned again. That is a change of law of the runner, so it is proposed, not made.
- `ojo_palabras_casos`: cure or retire.

## Log

- 2026-11-02 · measured and wired on main `b849f743`.
