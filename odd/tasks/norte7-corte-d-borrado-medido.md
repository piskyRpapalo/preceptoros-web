# norte7-corte-d-borrado-medido

Date: 2026-10-28
Law: Norte 7 decree (2026-10-28) · commission «the one map» · slice D, second step (delete) · measured, NOT committed as a delete

## Objective
Record what the physical delete of `/play/` breaks, measured on a working tree where it was done, before anyone commits it.

## Scope of the measurement
- Delete set: the 134 files of `norte7-corte-d-manifiesto.md` (123 exclusive by graph + 11 name-loaded lexicons). `public/assets/enviar-en.js` is KEPT: `HUB` precaches `enviar-<lang>.js` for all nine languages, so deleting one leaves a dangling precache entry, and the other eight are orphans with their own decision.
- `public/sw-listas.js` regenerated from the slice C version: `JUEGO` 81 entries, `PORTADA` 14 + the language generator, `ATLAS` empty, `CONTENIDO_JSON` empty. Every `HUB` path exists on disk (checked by loading the file).
- Commit `7e60016` (slice A, the 301) is in the same base.

## Checklist
- [x] X1 · delete set backed up in `origin/main` (134/134 with `git cat-file -e origin/main:public/...`).
- [x] X2 · `public/sw-listas.js` regenerated; `node --check` OK; every `HUB` path exists.
- [ ] X3 · `arnes_sw.mjs` green — MEASURED RED: 4 FALLOS.
- [ ] X4 · `test_web.py` green — MEASURED RED: 24 (13 failures, 11 errors).
- [ ] X5 · the live landing (`public/index.html`) without `href="/play/"` — MEASURED RED: `Paginas.test_los_enlaces_internos_existen` (`index.html` → `/play/`).
- [ ] X6 · `sitemap.xml` without `/play/` — MEASURED RED: `Sitemap.test_el_sitemap_no_anuncia_paginas_que_no_estan`. Regeneration via `sitemap.py` drops `play/` on its own (it checks the file exists).
- [ ] X7 · counters regenerated — MEASURED RED: `Estructura.test_counters_tiene_dos_duenos_y_ninguno_pisa_al_otro` (`paginas`, `peso_sitio`). Regeneration via `contadores.py`.
- [ ] X8 · VERSION bump + seal in the same commit — NOT RUN: it cannot be sealed while the gates are red.

## Verification evidence
- `arnes_sw.mjs` on the delete tree: exit 1, `4 FALLOS`. The four are the shell and count assertions tied to `/play/` and `thegame.js` (count 221 and the navigation check); the rest pass.
- `test_web.py` on the delete tree: 86 tests, `FAILED (failures=13, errors=11, skipped=1)`:
  - Errors, `Portada` class (`test_un_solo_panel_y_nada_del_hub`, `test_solo_carga_lo_que_el_juego_necesita`, `test_la_pagina_se_reordena_no_carga`, `test_menu_y_hoja_nunca_quedan_abiertos_a_la_vez`, `test_el_juego_se_monta_en_el_panel_no_encima`, `test_las_diez_son_la_plantilla`): all of them read `public/play/index.html`, which is deleted. These test a page that no longer exists.
  - Errors, language and glyph tests (`ElJuegoEnInglesEnLasNueve`, `ComentarEnTodasLasPaginas`, `GlifoSemantico`, `Estructura` capa soberana): they read `thegame.js` or the `thegame` stack.
  - Failures: the SW guards (`test_sw_cachea_los_nuevos_assets` for `eaa-art12-local-first-surface.js` and `atlas-motor.js`, `test_el_worker_pasa_su_arnes`), `test_los_enlaces_internos_existen`, `test_ningun_enlace_interno_roto`, the sitemap, and the counters.

## Standing signature
None needed for the measurement. Every item above is a change the commission either names (`mapa_viejo_desmontado`, `canonical_apex`, `sw-listas`, lexicon gate) or implies (landing door, sitemap, counters). The landing and the public counters are the Sovereign's surfaces, so they are not changed without the decision below.

## Methodology relief
None.

## Log
- 2026-10-28 · The first `sw-listas` pruning, line by line, left orphan commas and spaces; it was discarded and the arrays were regenerated whole from the slice C version.
- 2026-10-28 · `enviar-en.js` was measured as exclusive by graph and restored: `HUB` precaches it for all nine languages.
- 2026-10-28 · The delete WIP is kept as a patch and was not committed: `D-borrado-wip` applies cleanly on this branch's base (checked with `git apply --check`).

## Decisions needed (Sovereign)
1. **Landing door `Tutorial` → `/play/`** in `public/index.html`: remove it (the `OpenWorld` door already exists), or point it to `/openworld/` (a duplicate). The INTRO piece (PR 1, Norte 7) replaces this landing; should the door go with the INTRO or before it?
2. **The 24 failing entries tied to `/play/` or `thegame.js`** (the `Portada` class and the language, glyph and sovereign-layer tests): retire them with the page, or move their contract to `/openworld/`?
3. **The 36 unreferenced files** (see the manifest) and `public/assets/enviar-*.js` (nine files, the precache generator): keep, or retire with the delete?
4. Confirm that counters and sitemap are regenerated in the delete commit, which changes public numbers.

## Next step
With decisions 1–4, the delete commit is mechanical: apply `D-borrado-wip`, fix the listed tests as decided, regenerate sitemap and counters, bump VERSION (`abki`, the next free one, if no branch claims it), seal in the chain order, and run every gate green before committing.
