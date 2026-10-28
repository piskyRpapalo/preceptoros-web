# norte7-corte-d-borrado

Date: 2026-10-28
Law: Norte 7 decree (2026-10-28) · commission «the one map» · Desk decisions D1–D4 (2026-10-28) · slice D, the delete

## Objective
Remove everything under `/play/`: the page, `assets/thegame.js` and its exclusive stack, the theGame lexicons. The door `Tutorial` on the landing keeps, pointing to `/openworld/` (D1). Every gate green in the same commit, VERSION bumped and sealed.

## Problem and why
`/play/` is the old tutorial map. The decree names one map: `/openworld/`. Its files are still served and precached.

## Scope
- Delete: 132 files of `norte7-corte-d-manifiesto.md` (the 134 measured, minus `enviar.js` and `enviar-en.js`, which stay: D3 plus the ambiguity rule). Of the 134, 123 are exclusive by reference graph and 11 are lexicons loaded by a constructed name (`atlas-piso.js`).
- Kept on purpose: `public/assets/enviar.js` (no live door loads it, but the suite names it «the only exit door» and the test contract is not measured dead); `public/assets/enviar-*.js` (D3); the 36 rootless files (D3, no proof of exclusivity).
- `public/index.html`: door `Tutorial` → `/openworld/` (D1). INTRO copy is NOT changed here: the INTRO is slice 1 of Norte 7, a different branch.
- `public/sw-listas.js` regenerated from the slice C version. `ATLAS` empty. `CONTENIDO_JSON` empty.
- `local_first_surface_build.py`: `/play/` no longer generated. The door in the template points to `/openworld/`. `--comprueba`: 3 pages = template.
- `public/sitemap.xml`: regenerated from disk (`sitemap.py`): 9 URLs, no `/play/`.
- `public/counters.json`: regenerated (`contadores.py`); `pruebas_web` set to the measured `Ran 75 tests` (see Log).
- `public/atlas-mundo.json`, `public/atlas-record.json` (unchanged, measurement).
- `atlas/mundo.py`: `gzip_juego_b` is `None` when `thegame.js` is absent (NO_DATA, not zero).
- `atlas/arnes_piloto.mjs`: prints `NO_DATA` and exits 0 when `atlas-motor.js` is absent.
- `atlas/lexicon_base.json`: regenerated with `--escribe-base` (81 files, 0 new, base only shrinks).
- `arnes_sw.mjs`: count 221 → 106; retirement asserts (no theGame in the shell, `page-comment.js` gone, `atlas-en.json` not cached).
- `test_web.py`: 86 → 75. Removed the `Portada`, `GlifoSemantico` and `ElJuegoEnInglesEnLasNueve` classes and six methods that read the retired stack; added a `JuegoRetirado` guard (3 tests); the door test now expects `/openworld/`; the precache guard no longer lists the retired pieces; the lexicon contract is inverted to «empty».
- Node tests (`tests/*.test.mjs`): 49 files; 344 → 220 tests (215 pass, 5 skipped, 0 fail). Files whose subject module is retired are replaced by a two-test retirement guard (file absent, not precached): `mapa_viejo_desmontado`, `map_bubble_figures`, `a11y_media_guardian`, `a11y_tap_guardian`, `a11y_target_guardian`, `a11y_print_guardian`, `a11y_dom_guardian`, `bubble_audio_contract`, `cable`, `en301_practice_arena`, `en301_practice_model`, `en301_story`, `en301_tutorial`, `en301_tutorial_building`, `hitl_firma`, `invocation_persistence`, `offline_world_provenance`, `onda_profunda`, `p4_killswitch_guardian`, `tarjeta_cantada`, `front_door`, `deep_links`, `mcp_manifest`, `web_mcp_capability_map`. Two files keep their live contracts and lose only the retired blocks: `node_bindings` (9 tests of 22) and `node_reception_contract` (1 test), plus `army_wave_cartoon` (2 tests on `ui-ficha.js`) and `summon_reveal_face` (1 subtest on `thegame.js`).
- Seal: VERSION `preceptoros-2026-17-abkg` → `abki`; `sellar`, `mundo`, `arnes_piloto`, `contadores`, `sellar` in the chain order; converged («NADA QUE SELLAR»).

## Checklist
- [x] X1 · delete set backed up in `origin/main` (134/134).
- [x] X2 · `sw-listas.js` regenerated; every `HUB` path exists on disk.
- [x] X3 · `arnes_sw.mjs` 24/24.
- [x] X4 · `test_web.py` 75 OK (skipped 1).
- [x] X5 · landing without `href="/play/"`; door `Tutorial` → `/openworld/`.
- [x] X6 · sitemap without `/play/` (derived, 9 URLs).
- [x] X7 · counters: `pruebas_web` = 75 (measured), the rest by `contadores.py`.
- [x] X8 · VERSION `abki` + seal in the same commit; `sellar` dry run → nothing to seal.
- [x] X9 · `lexicon_gate.mjs` VERDE (81 ficheros, 0 nuevos).
- [x] X10 · `version_sw_gate` GREEN; `canonical_apex` 6/6.
- [x] X11 · `atlas/openworld_browser.mjs` exit 0, `fallos []`, `externas 0`, 390 px, chat active.
- [x] X12 · `/face/` live combat: no `face/` file is in the delete set, and the whole node suite and `test_web` pass (`gdpr-art25-ephemeral-crab.js`, which `face/basic.html`, `face/atlantis.html` and `face/zombie.html` load, is `COMPARTIDO` and kept).
- [ ] X13 · RED-before-GREEN on the weakest device of the fleet ring — NO_DATA: no deploy from here.
- [ ] X14 · captures before/after of the landing door and `/openworld/` on a live device — NO_DATA: no deploy from here.

## Verification evidence
- `python3 test_web.py`: `Ran 75 tests … OK (skipped=1)`. Baseline on `origin/main`: 86.
- `node arnes_sw.mjs`: `24/24 en verde`.
- `node --test` over the 49 files in `tests/`: `# tests 220, # pass 215, # fail 0, # skipped 5`. Baseline on `origin/main` + slice A: `# tests 344, # pass 339, # skipped 5`.
- `node atlas/lexicon_gate.mjs`: `VERDE`.
- `node atlas/openworld_browser.mjs`: `exit 0`, `fallos []`, `externas 0`.
- `python3 bin/sellar.py` (dry run): `NADA QUE SELLAR · … abki`.
- `python3 local_first_surface_build.py --comprueba`: `las 3 paginas de entrada son la plantilla`.

## Standing signature
Searched the corpus: decree D1–D4 of 2026-10-28 (the Desk's message on this thread) names the door, the test retirement, the enviar rule and the sequence. The delete is the Desk's to merge under piece FIRMO on the exact head. Nothing here is a signature.

## Methodology relief
None.

## Log
- 2026-10-28 · The first pruning of `sw-listas.js` (line by line) left orphan commas and spaces: discarded; the arrays were regenerated whole from the slice C version.
- 2026-10-28 · `enviar.js` restored after measuring it: it is the file the suite calls «the only exit door»; the ambiguity rule keeps it.
- 2026-10-28 · `pruebas_web` belongs to `coherencia-publica.py` (outside the repo). That script writes into the main tree and is skipped in a worktree (seal skill). The value was set by hand to the figure its own command prints (`Ran 75 tests`), and the rest of the counter file is untouched. The old number is also written in `docs/mesa/PARA_LA_MESA.md` (the only file the grep found; the test message speaks of three portadas). It is not changed here.
- 2026-10-28 · `mcp-manifest.json` still advertises the actions of `deep_links.js`. That file is retired, so those actions have no handler now. The two MCP tests are retirement guards, which leaves the manifest advertising them. Decision needed: trim the manifest, or retire the actions with the page.
- 2026-10-28 · The node suite went from 344 to 220 tests. The difference is the retired modules' tests, each replaced by a two-test guard, and the blocks pruned from files that also cover live contracts. The count is not a regression of live code; it is recorded here so no one reads it as one.
- 2026-10-28 · `base.css` is retired: no live root loads it (measured). Its accessibility guards (`a11y_media`, `a11y_target`, `a11y_print`) are retirement guards now. The accessibility rules that lived there are gone from the served site.

## For review on the PR thread (Desk request, before merge)
1. **«The Sunken Forest» motto.** Its only copy was `public/atlas-en.json` `ui.lema` (`The Sunken Forest. Atlantis did not sink: it fell asleep. You wake it.`). That file is deleted here, so the line lives in git history on `main` and nowhere served. Proposal for its new home (the isometric route's first step) is in `odd/tasks/norte7-corte-b-lore-propuesta.md` (decision D1 there). Decide before merge; the text is not lost while it is in history.
2. **«Say Hi» reconstruction.** The radio handshake lived in `public/game/aiact-art50-state-radio.js`, which is deleted here. The reconstruction plan is seed S2 in `odd/tasks/norte7-corte-b-lore-propuesta.md`: a `atlas.sobre/1` exchange over a manual QR channel (`atlas/PLAN_THEGAME_ESTRUCTURA.md:49`), not a move of the old file. No code of it is in this commit.

## Next step
Desk merge under piece FIRMO on the exact head. Then Sovereign's decisions: the `mcp-manifest.json` actions, and the two review items above. After the deploy: X13 and X14 captures on the weakest live device.
