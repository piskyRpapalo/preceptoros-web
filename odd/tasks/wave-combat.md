# wave-combat

Date: 2026-10-30
Law: buzon#30, Mesa flank web (2026-10-30): "G5 combate de ondas: balance en NO_DATA → plano propose-only en odd/tasks PRIMERO. Nada de combate sin plano + FIRMA." Decrees and plans it answers: `odd/tasks/game-pieces.md` (G5), `odd/tasks/benchmarks-on-map.md` (BM-D1 fixed seed, BM-D2 no invented balance, BM-D3 records never identity).

## Objective

A first combat on the single map at `/openworld/`: two bots meet on a shared hex and a wave duel decides the outcome from its own seeded rules. The rules are reproducible, the balance is declared NO_DATA until it is measured, and nothing outside the map is the main map.

## Problem and why

- The wave duel scene is already on main (`public/game/wave_duel_scene.js`, [W] O1, drawing only) and it reads a finished combat record.
- The duel rules that decide the outcome are not served on main: the pure core (`atlas/puros/wave_duel.js`, BM-2, branch `haiku/bm2-wave-duel-20261031`, cabeza `1df6e03`) has `commit`, `duel`, `verify`, the abandonment limit and a balance NO_DATA, but it is not on the map.
- Its commitment uses FNV hashing. That is a declared gap: a commitment that a player can predict is not a commitment. It must be SHA-256 through WebCrypto before any duel is served.
- Without a balance measured on a real duel, any number of damage or life is invented. It stays NO_DATA.

## Scope

In scope, in this order:

1. **W1 · the duel rules as a pure core on main.** Move `wave_duel.js` from BM-2, with its cases, into `atlas/puros/`. Replace the FNV commitment with SHA-256 (WebCrypto is async: `duel` becomes a promise or the commitment is computed before the duel starts). Gate: cases twice; sabotage (a duel with no seed refused; a revealed round that does not match its commitment refused).
2. **W2 · the first combat on the map.** Two bots on a shared hex (the cabin's bot and one bot of a live node) run the duel with the seed fixed by the pair of nodes (BM-D1). The result is recorded in the session only (BM-D3: records, never identity). Gate: determinism twice; contact sheet of the duel scene on the map.
3. **W3 · abandonment.** A duel with no reveal for 900 cycles is abandoned and says so (`ABANDON`). Gate: sabotage (a stalled duel that stays open).
4. **W4 · balance measured.** Only after W2 is seen working on doggee: the damage and life values come from recorded duels, dated, with their seed. Until then the balance is NO_DATA on the map, with its cause.

Out of scope: the crab's panel and Fourier coefficients (F8, a later plan); any balance written in code before W4; any identity or account attached to a record; radios (G8).

## Constraints

- Every visible frame is a bubble frame under 1,024 UTF-8 bytes with its sentence and a declared sound (NO_DATA with cause when none).
- No random number, no clock with authority, no network in the render path; the seed is required.
- The door stays under 16 KiB; the logic lives in `public/game/`.
- Commitment: SHA-256 only. No FNV or other non-cryptographic hash in any served file.
- Accessibility: buttons at least 44 px; the result is a sentence, not only a colour.

## Decisions (declared, open for the Mesa)

- **G5-D1 · the seed is the pair of nodes.** Two fights between the same pair give the same rounds. This keeps the duel reproducible; it does not make it fair by itself, and the fairness is W4's job.
- **G5-D2 · the commitment is SHA-256 before the first round.** The move that breaks FNV is W1, not a later patch.
- **G5-D3 · balance is NO_DATA until measured.** No default damage, no default life in the served code.
- **G5-D4 · the duel on the map is the existing scene.** W2 draws with `wave_duel_scene.js`; it does not add a new scene.

## Checklist (one piece = one PR; FIRMO per piece before code)

- [ ] W1 · duel rules pure core on main with SHA-256 commitment; cases twice; sabotages.
- [ ] W2 · first combat on the map, seeded by the pair of nodes; contact sheet; determinism twice.
- [ ] W3 · abandonment at 900 cycles; sabotage (stalled duel stays open).
- [ ] W4 · balance from recorded duels, dated and seeded; NO_DATA until then.

## Verification evidence

Measured on main (`b607059`): the duel scene exists (`public/game/wave_duel_scene.js`, drawing only, header [W] O1); the rules are not served. Measured on branch `haiku/bm2-wave-duel-20261031` (`1df6e03`): `commit` with FNV, `duel`, `verify`, ABANDON=900, balance NO_DATA, and a declared gap in its header. Not measured: the balance, and whether a duel plays on a live node (NO_DATA until W2 is seen on doggee; the cabin is the only LIVE node in the state today).

## Standing signature

Required: FIRMO of this plan before W1; FIRMO per piece. Search done: `public/game/wave_duel_scene.js` on main; `atlas/puros/wave_duel.js` on branch BM-2; `odd/tasks/benchmarks-on-map.md` (BM-D1 to BM-D3); `odd/tasks/game-pieces.md` (G5). Result: the rules are the BM-2 core, with the one change of its hash declared above.

## Methodology relief

None.

## Log

- 2026-10-30 · Plan declared propose-only. No code written. Balance stays NO_DATA.

## Next step

The Mesa's FIRMA of this plan. Then W1 as its own PR from main.
