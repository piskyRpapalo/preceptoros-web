# benchmarks-on-map

Date: 2026-10-31
Law: the Mesa's canonical answer (buzon#30, 2026-10-31): the NORTE decree ·6525335471 governs; the LoRA freeze is lifted by the Sovereign («todo activo»), served as NORTE-ACTIVO ·6525528435: benchmarks with AIs moving on the map and wave combats on the web, from the app installed on each rack device, with the information reaching the lab where LoRA is made. Also: decree ·6524440790 (the web is the only reality; the app only connects); decree ·6524501049 (the whole truth reaches the single map); ideas13oct sec. 15 (combat: two crabs, Fourier coefficients, commit-reveal log, abandonment at 900 cycles) and sec. 18 (the contract: frames under 1 KB with colour, coordinates, sound and time). Propose-only: nothing is cooked before this plan and its FIRMO.

## Objective

Measure, on the single map, how AIs move and how they fight waves, with a record that the lab can read. Each benchmark is reproducible from a seed and a log, and each result carries its device, its date and its seal. The lab receives the logs; the lab decides what to train.

## Problem and why

- The map has bots with faces (one per live node, IC7-S3) and a walker of the user (IC7-S10 in the terminal branch, merged). Nothing moves by its own rule yet, and no fight happens on the map.
- The combat rules of the crabs (ideas13oct sec. 15) are described, but their balance has no measured value: NO_DATA.
- Aduana's D7 heartbeat receiver and public state endpoint are deployed, but the live
  projection currently returns `NO_DATA · identidades_canonicas_no_configuradas` with
  zero nodes. This does not publish benchmark frames or create the B4 lab feed; those
  remain separate work.

## Scope

In scope, in this order:

1. **B1 · the seeded mover** — a pure rule that moves an AI bot one hex at a time over colony nodes only, from a seed. The same seed gives the same path, twice. A node that is not LIVE is never entered (D7).
2. **B2 · the wave duel** — two bots on a shared hex fight by the crabs' rule (Fourier coefficients, the duel log with commit-reveal). The log is the script; a duel with no seed is refused. Balance: NO_DATA until measured.
3. **B3 · the benchmark record** — every run writes one frame per round (under 1 KB, with colour, coordinates, sound and time, as sec. 18) and one summary: seed, rules version, device, date, result, seal.
4. **B4 · the lab feed** — the records are published as a file the lab reads. The
   deployed heartbeat route supplies map presence only; it is not the benchmark
   record route. Until a measured frames route exists, the feed says NO_DATA with cause.
5. **B5 · from each rack device** — the app connects to the web and runs the benchmark there; the app holds no map and no data of its own (decree ·6524440790).

Out of scope: any LoRA training step (the lab's own plan, after its FIRMO); any real-user data; changes to the separately deployed D7 heartbeat receiver or its operator-managed sender.

## Decisions to take

- **BM-D1 · seed policy**: a fixed seed per published benchmark, listed in its record. Recommendation: fixed seeds only, so every run is reproducible.
- **BM-D2 · balance**: no balance value is invented. The first duel runs with the published rule and reports its outcome as measured; any tuning is a separate, signed piece.
- **BM-D3 · what the lab receives**: only the records (frames and summaries), never the user's identity or the walker's position beyond the round.

## Checklist (one piece = one PR, FIRMO per piece)

- [x] BM-1 · seeded mover (pure), tests twice, sabotage: a path that enters a non-LIVE node is refused. Implemented in PR #444; merged as `97bf5d44`.
- [ ] BM-2 · wave duel (pure) with the commit-reveal log, tests twice, sabotage: a duel with no seed is refused; abandonment at 900 cycles is recorded.
- [ ] BM-3 · benchmark record and frame law, tests, sabotage: a frame over 1 KB is refused.
- [ ] BM-4 · lab feed as a file, NO_DATA with cause until the aduana route is deployed.
- [ ] BM-5 · the app runs it from each rack device; contact sheet per visual piece; captures on the device against production.

## Constraints

- No random number and no clock in the render path; seeds only.
- No network on load; the lab feed is written by the record, not read by the page.
- Frames under 1,024 UTF-8 bytes, one sentence per atom, a declared sound or NO_DATA with cause.
- Lexicon in English in public text; the vocabulary of the single map (C2) applies.

## Verification evidence

Measured in main (`1902295`): the map and its bots (IC7-S3), the walker (IC7-S10), the frase list (IC7-S3 to S5). Measured on 2026-10-30: Aduana health is live; its heartbeat state endpoint returns HTTP 200 with no configured canonical identities and zero nodes. Not measured: a published first heartbeat, the duel's balance (NO_DATA), the benchmark-frames route and lab feed (NO_DATA).

BM-1 receipt: PR #444, merge `97bf5d4403ed7172ed22fa6a13043ea0dbc5a39e`; its head was `bc6b807a35332cf716a91df297758f3b70171a18`. `node atlas/puros/bench_mover_casos.mjs` passed 7/7, including same-seed replay and refusal to enter a NO_DATA node. The implementation stays a pure, unserved rule; live-node execution remains NO_DATA until the heartbeat is live.

## Standing signature

Required: FIRMO of this plan, then FIRMO per PR. The NORTE decree and the LoRA lift are the Sovereign's (·6525335471 and ·6525528435). Search done: ideas13oct secs. 15 and 18, the Mesa's canonical answer, the map and bots on main.

## Methodology relief

None.

## Log

- 2026-10-31 · Benchmarks plan declared (propose-only). No code written at plan time.
- 2026-10-31 · BM-1 close-out recorded from merged PR #444. BM-2 remains open: the W1 SHA-256 core is not evidence of the planned Fourier combat or multiparty commit-reveal contract.

## Next step

BM-2, as its own PR, after implementing the planned Fourier combat and the canon's participant-supplied commit-reveal inputs. BM-3 through BM-5 remain separate PRs; live-node runs wait for a live heartbeat.
