# OPENWORLD · the `/openworld/` route (NORTE 7 · PR 2)

Status: landed 2026-10-28 · head `adca0abf` (web#367, FIRMO of the Sovereign; HITL line in buzon#30) · moved to `odd/done/` by housekeeping decree 2026-10-28.

## Objective
Give `/openworld/` its decreed shape: an interactive map on the upper half, an always-present chat on the lower half. The default state (zero nodes) shows only the global map and the tutorial cabin.

## Problem and why
The INTRO (PR #366) sends OpenWorld to `/play/` provisionally. This PR creates the definitive destination, with no live nodes and no external requests.

## Scope
- New route `public/openworld/index.html` (a single page, under 16 KiB).
- Map: the tutorial cabin always; Atlantis and the Risen only while their node is alive.
- Chat: a panel always present on the lower half. Its response engine arrives with PR #363.
- Sitemap 9 → 10 (`sitemap.py`).
- SW: precache +1 (`/openworld/`).
- INTRO: OpenWorld's destination moves from `/play/` to `/openworld/`.
- VERSION rises in the same commit as `public/` (see log).
- SW seal in the same commit.

## Constraints
- Client: zero external requests. No `api.` and no `atlas.` from the browser.
- Node state: same-origin file, `public/openworld/estado.json`, zero nodes by default. No new Worker and no deployment.
- Graphics: today's bubble, 3 colors (`paper`, `ink`, `cyan`), nothing more.
- UI text in English. No device names and no user paths. No banned vocabulary.
- No merge, no deploy, no Cloudflare.

## Checklist
- [x] OW1 · page `public/openworld/index.html` with the two halves and the cabin always visible.
- [x] OW2 · default state: zero nodes; the map shows only the cabin.
- [x] OW3 · Atlantis and the Risen appear only if `estado.json` lists them as alive; otherwise they do not exist on screen.
- [x] OW4 · chat always present, no "Chat" button; input disabled with honest text until #363 arrives.
- [x] OW5 · INTRO: OpenWorld → `/openworld/`.
- [x] OW6 · sitemap 9 → 10, regenerated with `sitemap.py`.
- [x] OW7 · precache 222 → 223 in `arnes_sw.mjs`, with a history line.
- [x] OW8 · tests: route, default state, zero external requests, no chat button.
- [x] OW9 · seal: VERSION rises, fingerprint, `gzip_juego_b`, counters.
- [x] OW10 · gates ×2 green, locally and in CI, before reporting. Closed at merge: CI green on the exact head (hitl, gate, phase), merged by the Desk under the Sovereign's FIRMO.

## Verification evidence
- OW1–OW4: `atlas/openworld_browser.mjs` (real browser, 390 px): title OpenWorld; buttons only "Tutorial cabin"; 17,319 px of ink on the map; state "Nodes online: 0"; input off; no Chat button; no side scroll; 0 external requests; 0 exceptions. Capture in the conversation.
- OW8: `test_web.OpenWorld` 6/6 (page ≤ 16 KiB, default state zero nodes, nodes only if alive, zero external requests, chat always present without button, sitemap and precache).
- OW5: `local_first_surface_build.py` moves OpenWorld's destination to /openworld/; `test_web.Puerta` and `landing_doors_browser` updated.
- OW6: `sitemap.py` 9 → 10 URLs (`sueltas()` gains `openworld/`); `sitemap.xml` regenerated.
- OW7: `arnes_sw.mjs` 222 → 223 (history line).
- OW9: VERSION `preceptoros-2026-17-abjy` → `preceptoros-2026-17-abjz` (bump in the same commit); final fingerprint `90dde68cece3fcda`; `gzip_juego_b` 111321 (< 153600); `arnes_sw` 23/23; `pruebas_web` 84 (measured by `Ran 84 tests`).

## Decision log (unattended mode: feature-branch-chain)
- 2026-10-28 · Base: `origin/main` = `7d909bb` (PR #366 merged). Branch `haiku/openworld-20261028`.
- Prior search. Findings: "5.42" and "Punto 6" are not in `main` (`git grep`). The jewels and the decree log live on the rack, outside the repo. Not verified; not used as a base.
- Finding: PR #363 is OPEN and unmerged (REQUIRES_FIRMA). Its code is not consumed. The chat panel stays as an honest-text gap. It connects when #363 merges.
- Signatures: the work needs none. There are no actions of value (invoke, adopt, challenge, accept, liquidate). No search in the corpus needed.
- VERSION conflict: the `sello-del-juego` skill says "VERSION intacta" (commission law of 2026-10-17). Tonight's commission asks for VERSION to rise in the same commit. The newer commission is followed. Declared in the PR.
- Precache: `/openworld/` plus one JS file = +2. To keep +1, the script goes inline in the page. The count stays 223, as the commission asks.
- Reused `bubble_language.js`, `bubble_letters.js` and `comic_atoms.js` as-is (already in the precache). No rewrite of `game/`.
- 2026-10-28 · Two commit units: (1) `odd/tasks/openworld.md`; (2) route, sitemap, precache, tests, CI gate and seal. Unit 2 exceeds ~400 lines because the seal regenerates `public/` files; the seal goes in the same commit as `public/`, as the commission asks.
- 2026-10-28 · `pruebas_web` = 84. The `como` field of `counters.json` says "python3 test_web.py, figure Ran N tests". Updated with that measured figure. `coherencia-publica.py` does not exist on this machine, so the external meter could not run; declared.
- 2026-10-28 · `atlas/test_atlas.py`: new list `OPENWORLD_PAGE_DEPENDENCIES` (the same bubble pieces as the landing page), with an exception in the two on-demand-parts assertions.

## Next step
Landed and closed. Kept as history in `odd/done/`.
