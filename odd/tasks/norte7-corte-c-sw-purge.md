# norte7-corte-c-sw-purge

Date: 2026-10-28
Law: Norte 7 decree (2026-10-28) · commission "the one map" · Sovereign priority: eliminate everything under /play/ · slice C

## Objective
Installed clients stop precaching the old game: `/play/`, `assets/thegame.js` and `assets/thegame.css` leave the service-worker shell. VERSION moves to `preceptoros-2026-17-abkh`.

## Problem and why
The shell still precaches `/play/` and the theGame bundle, so a client with the SW installed keeps the old game on navigation, even after slice A's 301 is live.

## Scope
- `public/sw.js`: `rutasDelShell()` drops `/play/`; VERSION `abkg` → `abkh`.
- `public/sw-listas.js`: drops `/assets/thegame.js` and `/assets/thegame.css` from JUEGO.
- `arnes_sw.mjs`: shell count 224 → 221; `/play/` removed from the shell asserts; the offline-navigation check moves to `/openworld/`.
- `test_web.py`: the precache guard no longer requires `thegame.js` (it is no longer precached by design).
- Seal: `counters.json`, `atlas-mundo.json`, `config/sw-huella.txt`.
- Out of scope, kept for slice D: `public/play/index.html`, the rest of the theGame stack, the lexicon sections.

## Constraints
- `/face/` (live combat, law app#115) untouched.
- `/openworld/` untouched except through the seal.

## Checklist
- [x] C1 · baseline before the change: `arnes_sw.mjs` 23/23, `test_web.py` 86 OK on `origin/main`.
- [x] C2 · `/play/` and both theGame files are absent from `rutasDelShell()` / JUEGO (arnes assert, 221 entries).
- [x] C3 · guards: `mapa_viejo_desmontado` 6/6, `map_bubble_figures` 4/4, `node_bindings` 22/22, `canonical_apex` 5/5.
- [x] C4 · seal chain converged: `sellar.py` dry run → "NADA QUE SELLAR" at `abkh`; `atlas/mundo.py` `version_sw=abkh`, `arnes_sw=23/23`, `gzip_juego_b=111321` (< 153600).
- [x] C5 · `openworld_browser` on the branch: exit 0, `fallos []`, `externas 0`, chat active, 390 px.
- [ ] C6 · RED-before-GREEN on the weakest live device of the fleet ring — NO_DATA: the change is not deployed and no device is at hand.
- [ ] C7 · before/after capture of the shell on a real installed client — NO_DATA: needs a live deploy and a client with the old SW.

## Verification evidence
- `arnes_sw.mjs` on branch: 23/23. Shell list length 224 (main) → 221 (branch).
- `test_web.py` on branch: 86 OK, skipped 1 (same as main).
- `atlas/version_sw_gate.mjs`: GREEN.
- `atlas/openworld_browser.mjs`: exit 0, `fallos []`.
- Counters: 2 NO_DATA before and after (no new NO_DATA).

## Standing signature
Searched the corpus: the decree 2026-10-28 (Sovereign priority, slice C) names this exact change. The skill `sello-del-juego` covers the seal. The ODD README says the merge is the Desk's under piece FIRMO on the exact head, not the build's.

## Methodology relief
None.

## Log
- 2026-10-28 · The VERSION is bumped by this slice (`abkh`, the next free one; no open branch claimed it). The seal skill's «VERSION intacta» rule is the standing one for slices that do not change the worker; this commission explicitly asks for the bump.
- 2026-10-28 · `test_web.py` precache guard had `thegame.js` as a required piece: a contract change made on purpose here, with a comment.

## Next step
Slice D, in the order the commission gives: first the measured dependency manifest (ODD doc), then the physical delete PR.
