# norte7-corte-a-play-301

Date: 2026-10-28
Law: Norte 7 decree (2026-10-28) · `docs/norte-7-corte-propuesta.md` §4 (`/play/` → `/openworld/`, approved) · commission "the one map", tanda 2 · slice A

## Objective
`/play/` stops being a destination: the Worker answers 301 to `/openworld/`, the query preserved.

## Problem and why
The game's old door at `/play/` still serves the old tutorial map. The decree names one destination for it: the isometric OpenWorld.

## Scope
- `worker/index.js`: `PLAY` pattern (`/play`, `/play/`, `/play/index.html`) → `url.origin + '/openworld/' + url.search`, 301.
- `tests/canonical_apex.test.mjs`: the RED test for `/play/` → `/openworld/`; `/play/` leaves the lookalike list; `/play/x` and `/playground/` stay assets.
- Out of scope, on purpose: `public/` (no VERSION bump, no seal), `/face/`, `/creation.html`, the dynamic combat (`wave_duel_scene.js`).

## Constraints
- Worker only, no file under `public/`: the SW rule (VERSION + seal) does not apply to this commit.
- The SW still precaches `/play/` (`public/sw.js` `rutasDelShell()`, `public/sw-listas.js`). A client with the SW installed keeps the old game until a later piece changes the precache and bumps VERSION.

## Checklist
- [x] A1 · RED: `/play/` answers 200 before the change (`node --test tests/canonical_apex.test.mjs` → 5 pass, 1 fail).
- [x] A2 · GREEN: `/play`, `/play/`, `/play/index.html?x=1` answer 301 to `/openworld/` (query kept).
- [x] A3 · lookalikes (`/play/x`, `/playground/`, `/face/`, `/es.json`…) still answer 200 from the assets.
- [ ] A4 · deployed Worker answers 301 on `preceptoros.org/play/` — NO_DATA: not deployed from here (no `wrangler` deploy by silicon).
- [ ] A5 · browser capture on the weakest live device of the fleet ring — NO_DATA: no live deploy yet, no device at hand.

## Verification evidence
- `node --test tests/canonical_apex.test.mjs` on the branch: 6/6 pass, 0 fail. (RED: 5/6, `/play/` at 200.)
- Before/after HTTP capture (`captura_worker.txt`, origin/main worker vs. branch worker):
  - before: `/play`, `/play/`, `/play/index.html?x=1` → 200.
  - after: → 301 `https://preceptoros.org/openworld/`, and `…/openworld/?x=1` for the query case.
  - unchanged: `/openworld/`, `/playground/`, `/face/` → 200.
- Browser guard, same `origin/main` head (1a3f890), not this branch: `node atlas/openworld_browser.mjs` → exit 0, fallos `[]`, externas 0, chat active, `NO_DATA · no_manifest` after sending "hola". Capture: `openworld-390.png`.

## Standing signature
Searched the corpus: the decree 2026-10-28 is in `docs/norte-7-corte-propuesta.md` §4 and §5 ("Redirecciones §4: APROBADAS, con la corrección de `/play/` → `/openworld/`"). The ODD README says work never halts for a signature; the merge is gated by the Desk under piece FIRMO on the exact head.

## Methodology relief
None.

## Log
- 2026-10-28 · The router piece (`haiku/chunk-router-20261028`) was already on `main` via PR #382 (MERGED; #379 CLOSED). Its two unmerged local commits (`dfa80e2`, `3813f7e`) are superseded, and its uncommitted index is a stale snapshot of `main` before #388/#389. Committing it would have reverted the One map. Saved as `router-worktree-sucio-20261028.patch`, not committed.
- 2026-10-28 · The OpenWorld browser test on `origin/main` was run with `TMPDIR` redirected: the Chrome profile is created under `os.tmpdir()`, which is the quota-full `/tmp`.
- 2026-10-28 · Slice A is one Worker change plus its guard, not a `public/` change: no VERSION bump.

## Next step
Carbon pushes the branch (silicon does not push under the Ley del Buzón) and the Desk opens the PR, from the web checkout: `! git push -u origin haiku/norte7-play-301-20261028`.
