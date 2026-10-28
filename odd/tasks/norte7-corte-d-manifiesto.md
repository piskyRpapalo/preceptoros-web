# norte7-corte-d-manifiesto

Date: 2026-10-28
Law: Norte 7 decree (2026-10-28) · commission «the one map» · Sovereign priority: eliminate everything under `/play/` · slice D, first step (manifest, no deletion)

## Objective
Measure, before any delete, which files under `public/` belong only to theGame (`/play/` and `assets/thegame.js`), which are shared with the live doors (`/`, `/openworld/`, `/face/*`, `/get-the-app/`, `/aduana/`, `/creation.html`), and which are referenced by no root at all.

## Problem and why
A delete without a measured manifest removes files that a live door still loads. The guard the commission asks for is only as good as the list it protects.

## Scope
- Script: `bin/manifiesto_dependencias.py` (a static reference graph over `public/`). It reads `public/`, writes JSON to stdout, changes nothing. Run: `python3 -I bin/manifiesto_dependencias.py "$PWD"`.
- Roots of the theGame group: `play/index.html`, `assets/thegame.js`.
- Roots of the live group: `index.html`, `openworld/index.html`, `face/index.html`, `face/basic.html`, `face/atlantis.html`, `face/zombie.html`, `get-the-app/index.html`, `aduana/index.html`, `creation.html`.
- Dynamic loads the graph cannot see were found by grep and are listed separately below.

## Constraints
- A literal that looks like a file counts as a reference. This over-approximates shared use, so the exclusive set can only shrink. The manifest is conservative for deletion.
- `/playground/` is named in the commission but does not exist in `public/`: NO_DATA, not a root.
- `sw-listas.js` and `sw.js` are precache lists, not users: they are not counted as shared use. The precache is the thing this piece removes.

## Checklist
- [x] D0 · script runs on the slice C tree with `python3 -I` (no import from the cwd).
- [x] D1 · counts measured: {"COMPARTIDO": 62, "EXCLUSIVO_THEGAME": 123, "HUERFANO_SIN_REF": 48, "VIVO": 38}.
- [x] D2 · the commission's «shared with /face/» list (core, db, valores, gacha, bubble_*, comic_*, combate_ticks, escuadron, wave_duel_scene, sea-floor, crab_render_hd, fog_of_war, isometric_floor_projection, world_camera, map_zoom) is classified COMPARTIDO; `face/face_battle.js` and `face/face_fight.js` are VIVO. Matches the commission.
- [x] D3 · dynamic loads: `assets/atlas-piso.js` loads `atlas-<lang>.json` and `atlas-mundo.json` by name. The lexicon JSON are used only by the theGame cluster (`atlas-piso`, `atlas-opina`, `atlas-guardado`, `atlas-motor`, `terminal_menu_shell`, `thegame.js`), checked by grep.
- [x] D4 · cross-check by basename, outside the candidates and outside `sw-listas`/`sw`: only `game/sobres.js` is cited, and by two orphans (`game/narragrafo.js`, `game/mercado.js`), neither reachable from a root.
- [ ] D5 · the delete itself: NOT in this piece. It needs the test migration (see Next step) and VERSION + seal in the same commit.

## Verification evidence
- Exclusive to theGame, by reference graph: **123 files** (726588 B), listed below.
- Exclusive to theGame, by name-loaded lexicon: **12 files** (132414 B): `atlas-ar.json`, `atlas-arena-en.json`, `atlas-casa-en.json`, `atlas-de.json`, `atlas-el.json`, `atlas-en.json`, `atlas-es.json`, `atlas-fr.json`, `atlas-it.json`, `atlas-opina-en.json`, `atlas-pt.json`, `atlas-ru.json`.
- Candidate footprint if all are deleted: **135 files, 859002 B**. `public/play/index.html` is one of the graph ones (it is a root).
- Shared with the live doors: **62 files** (kept).
- Served by the live doors only: **38 files** (kept).
- Referenced by no root: **36 files** (listed below; NOT in the delete set; each needs its own decision).

### Exclusive to theGame (static graph)
- `public/assets/atlas-arte.js` (8553 B)
- `public/assets/atlas-carta.js` (11750 B)
- `public/assets/atlas-dialogo.js` (2259 B)
- `public/assets/atlas-gesto.js` (6822 B)
- `public/assets/atlas-guardado.js` (5964 B)
- `public/assets/atlas-hud.js` (2949 B)
- `public/assets/atlas-motor.js` (11435 B)
- `public/assets/atlas-obra.js` (4960 B)
- `public/assets/atlas-ondas.js` (6824 B)
- `public/assets/atlas-opina.js` (7992 B)
- `public/assets/atlas-partida.js` (4847 B)
- `public/assets/atlas-piloto-capa.js` (3099 B)
- `public/assets/atlas-piloto.js` (1908 B)
- `public/assets/atlas-piso.js` (9589 B)
- `public/assets/atlas-voz.js` (4164 B)
- `public/assets/atlas.css` (13249 B)
- `public/assets/base.css` (16051 B)
- `public/assets/canon.css` (14116 B)
- `public/assets/codex_scene.js` (10879 B)
- `public/assets/consiento.css` (7336 B)
- `public/assets/consiento.js` (3918 B)
- `public/assets/descent.css` (4802 B)
- `public/assets/descent_view.js` (7851 B)
- `public/assets/eaa-art12-local-first-surface.css` (2858 B)
- `public/assets/eaa-art12-local-first-surface.js` (648 B)
- `public/assets/en301_practice.css` (1142 B)
- `public/assets/en301_tutorial.css` (2657 B)
- `public/assets/enviar-en.js` (646 B)
- `public/assets/enviar.js` (5023 B)
- `public/assets/front_door.css` (3633 B)
- `public/assets/front_door_view.js` (8015 B)
- `public/assets/page-comment.css` (2212 B)
- `public/assets/page-comment.js` (11748 B)
- `public/assets/soberano.css` (8514 B)
- `public/assets/terminal_menu_shell.css` (13024 B)
- `public/assets/terminal_menu_shell.js` (13820 B)
- `public/assets/terminal_window_frame.js` (4897 B)
- `public/assets/thegame.css` (12519 B)
- `public/assets/thegame.js` (15411 B)
- `public/assets/tubo.css` (4559 B)
- `public/atlas-mundo.json` (344 B)
- `public/dictionary-en.json` (2591 B)
- `public/dictionary.json` (14881 B)
- `public/game/aiact-art50-crab-terminal.js` (5020 B)
- `public/game/aiact-art50-state-radio.js` (6305 B)
- `public/game/arena.js` (8231 B)
- `public/game/audio_feedback_manager.js` (5568 B)
- `public/game/bubble_game.js` (9359 B)
- `public/game/buildings_toon.js` (3234 B)
- `public/game/cable_llamar.js` (1998 B)
- `public/game/cable_terminal.js` (3804 B)
- `public/game/casa-lateral.js` (2310 B)
- `public/game/casa-medidas.js` (1194 B)
- `public/game/casa-personaliza.js` (3189 B)
- `public/game/combat_screen.js` (3429 B)
- `public/game/crab_free_move.js` (8271 B)
- `public/game/crab_state_screen.js` (3010 B)
- `public/game/deep_links.js` (4249 B)
- `public/game/deploy_building.js` (4947 B)
- `public/game/descent_sound.js` (5676 B)
- `public/game/duelo.js` (11450 B)
- `public/game/en301_practice_arena.js` (8213 B)
- `public/game/en301_practice_model.js` (11286 B)
- `public/game/en301_tutorial.js` (15197 B)
- `public/game/en301_tutorial_audio.js` (5550 B)
- `public/game/en301_tutorial_building.js` (2480 B)
- `public/game/en301_tutorial_copy.js` (3088 B)
- `public/game/en301_tutorial_model.js` (13986 B)
- `public/game/etiqueta.js` (2009 B)
- `public/game/front_door.js` (6496 B)
- `public/game/gdpr-art7-entry-choice.js` (4031 B)
- `public/game/genesis_tutorial.js` (13915 B)
- `public/game/hexelion_bench.js` (1455 B)
- `public/game/hexelion_dictionary.js` (5868 B)
- `public/game/hitl_firma.js` (3722 B)
- `public/game/home.css` (9885 B)
- `public/game/home_buildings.js` (8866 B)
- `public/game/juez.js` (2130 B)
- `public/game/killswitch_dot.js` (1823 B)
- `public/game/latency_crystal.js` (4675 B)
- `public/game/map_bubble_figures.js` (1424 B)
- `public/game/map_integrity.js` (2870 B)
- `public/game/map_nodes_layer.js` (1772 B)
- `public/game/map_pointer_input.js` (2540 B)
- `public/game/nodos-cedulas.js` (1784 B)
- `public/game/nodos-pesos.js` (844 B)
- `public/game/npc_occupancy.js` (9567 B)
- `public/game/npc_territory_map.js` (1188 B)
- `public/game/npc_walls.js` (3859 B)
- `public/game/onda_profunda.js` (1456 B)
- `public/game/piece_inspector.js` (5540 B)
- `public/game/place_reading.js` (1440 B)
- `public/game/primer_eco.js` (7982 B)
- `public/game/rating.js` (2094 B)
- `public/game/reef_building_lifecycle.js` (3383 B)
- `public/game/reef_buildings_layer.js` (10851 B)
- `public/game/reef_buildings_paint.js` (2950 B)
- `public/game/reef_corals.js` (4034 B)
- `public/game/reef_place_cards.js` (4667 B)
- `public/game/sea-anchors.js` (1258 B)
- `public/game/sea-crabs.js` (3083 B)
- `public/game/sea_rift.js` (1832 B)
- `public/game/semiotic_glyph.js` (5653 B)
- `public/game/shell_schematics.js` (5066 B)
- `public/game/silueta.js` (1937 B)
- `public/game/sobres.js` (8519 B)
- `public/game/state_vector.js` (14014 B)
- `public/game/summon-access.js` (3083 B)
- `public/game/tarjeta_cantada.js` (2817 B)
- `public/game/tutorial_fases.js` (3696 B)
- `public/game/ui-arena-comun.js` (2614 B)
- `public/game/ui-arena.js` (14917 B)
- `public/game/ui-duelo.js` (8203 B)
- `public/game/ui-ficha.js` (5394 B)
- `public/game/ui-invoca.js` (5058 B)
- `public/game/ui-nodos.js` (13441 B)
- `public/game/ui-rack.js` (3933 B)
- `public/game/ui-tutorial-fases.js` (5393 B)
- `public/game/ui.js` (10567 B)
- `public/game/vector_contract.js` (3259 B)
- `public/game/world_creator.js` (12050 B)
- `public/game/z_cutoff.js` (1807 B)
- `public/play/index.html` (2371 B)

### Exclusive to theGame (name-loaded lexicons)
- `public/atlas-ar.json` (13566 B)
- `public/atlas-arena-en.json` (11315 B)
- `public/atlas-casa-en.json` (4212 B)
- `public/atlas-de.json` (11280 B)
- `public/atlas-el.json` (15804 B)
- `public/atlas-en.json` (16368 B)
- `public/atlas-es.json` (10424 B)
- `public/atlas-fr.json` (11241 B)
- `public/atlas-it.json` (10753 B)
- `public/atlas-opina-en.json` (1575 B)
- `public/atlas-pt.json` (10578 B)
- `public/atlas-ru.json` (15298 B)

### Referenced by no root (kept, to decide)
- `public/assets/atlas-mapa.js` (12989 B)
- `public/assets/enviar-ar.js` (854 B)
- `public/assets/enviar-de.js` (759 B)
- `public/assets/enviar-el.js` (1151 B)
- `public/assets/enviar-es.js` (650 B)
- `public/assets/enviar-fr.js` (702 B)
- `public/assets/enviar-it.js` (684 B)
- `public/assets/enviar-pt.js` (669 B)
- `public/assets/enviar-ru.js` (1093 B)
- `public/assets/og-card.png` (45814 B)
- `public/atlas-record.json` (2499 B)
- `public/cerebros.json` (11222 B)
- `public/counters.json` (2816 B)
- `public/downloads/README.md` (2001 B)
- `public/downloads/entorno-estudio-v1.tar.gz` (3096 B)
- `public/downloads/entorno-estudio-v1.tar.gz.sha256` (92 B)
- `public/downloads/preceptor-charla-base-v1.gguf.sha256` (65 B)
- `public/downloads/preceptor-charla-base-v2.gguf.sha256` (65 B)
- `public/downloads/preceptor-charla-multi-v1.gguf.sha256` (65 B)
- `public/downloads/preceptor-tribune-en-v1.gguf.sha256` (65 B)
- `public/downloads/preceptor-tribune-multi-v1.gguf.sha256` (65 B)
- `public/game/battle_choreography.js` (8345 B)
- `public/game/cria.js` (6967 B)
- `public/game/estrella_captura.js` (2660 B)
- `public/game/lexical_projector.js` (3529 B)
- `public/game/local_app_bridge.js` (3122 B)
- `public/game/mercado.js` (5450 B)
- `public/game/narragrafo.js` (6192 B)
- `public/game/tutorial-fases.css` (166 B)
- `public/lexical_state_schema.json` (2529 B)
- `public/llms.txt` (7850 B)
- `public/mcp-manifest.json` (4217 B)
- `public/nexo-v1.json` (1549 B)
- `public/robots.txt` (539 B)
- `public/sitemap.xml` (832 B)
- `public/sw-listas.js` (6172 B)

## Standing signature
Searched the corpus: the decree 2026-10-28 names the delete (slice D) and its dependency list; the commission asks for the manifest as an ODD doc before the delete PR. A measurement needs no new signature. The delete keeps the Desk's FIRMO on the exact head.

## Methodology relief
None.

## Log
- 2026-10-28 · The static graph did not see `atlas-piso.js`'s `'atlas-' + lang + '.json'`. Found by grepping for path concatenation in `public/`; added as a separate table, not folded into the graph.
- 2026-10-28 · The manifest is taken on the slice C tree, where the SW no longer precaches `/play/` or `thegame.js`.

## Next step
Decide with the Sovereign the 36 unreferenced files (keep or delete). Then the delete PR: the 135 files above, `public/play/index.html` included, VERSION bump and seal in the same commit, `mapa_viejo_desmontado` rewritten as a retirement guard, `canonical_apex` expecting 301 (slice A), and the lexicon gate base rewritten.
