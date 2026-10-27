# NORTE 5 · (b) conservation list: what leaves /play/ and what stays on the global map

**Measured 2026-10-27** on `soberano` against WEB main `df0dce5`. Docs only: nothing here moves code. The Sovereign signs
**one FIRMO per piece**; each signed piece then becomes its own PR with its judge.

## The ruling this list obeys (the Sovereign, 2026-10-27)

- **The global map IS the basic map that already exists** (the Map with nodes). Law L-057 (ideas + sesion45oct): *"El botón
  Map ya funciona muy bien. El mapa con nodos es fantástico. No hay que romperlo ahora."* No world replaces it.
- **The worlds land on it as real nodes** (Beelink, DOGGEE; the tutorial as the entry world, North point 6).
- **"Play the game", the old part, leaves.** From the old map only (1) the functions applicable to deploying worlds and
  (2) the combat mode are kept.
- **Fence (L-057):** nothing that exists only in a world or in the Base appears on the Map without a valid export or
  invocation rule.
- **Priority:** the chat terminal (NORTE 5's chat panel) and the combat mode (kept by decree).
- **Map canon** (Manifiesto Sep30 §II + C.2), for the style session that comes AFTER this integration:
  - a federation of pillars;
  - fog = measured absence, never zero;
  - states ACTIVO / DECAYING / CAIDO / NO_DATA.

## The decree that decides it (buzon#30 ·6452880777, 2026-10-27, night) · pre-signed in batch (·6452956804)

- Everything visible in "play the game" **leaves**; the one truth is the unification of the worlds.
- **Every graphic section older than one week dies, today.** No hidden route left unreviewed.
- The web should weigh **~1 KB per screen**; today it does not (measured in the removal PR).
- **Creation Studio leaves the web entirely**: app only (drawing app or image generator, or deterministic colour-changing
  "pieces"; both paths proposed measured, the Sovereign decides).
- **The basic tutorial is the web's door**, with the simplest Ephemeral Account. The bubble-language object is always
  the same, the ephemeral user:
  - the tutorial: a plain circle, agar.io-like;
  - Atlantis: the crab, improved;
  - zombie: the spaceman.
  Buildings stay like today's, with more detail on the map.
- Removal **never** deletes what is conserved: the chat terminal, combat, GDPR art. 7 → worlds, save and first echo, the
  tutorial as the entry world, AI Act art. 50.

## How it was measured

- **The pieces:** /play/ mounts **120 modules** in four groups (`thegame.js`: GUIONES 17, ARMY 8, CASA 39, ARENA 56). They are
  grouped here into 15 pieces by what they do for the player.
- **The judges:** for each piece, its judges are every `atlas/*.mjs` and `tests/*.mjs` that names one of its files
  (grep, 2026-10-27). `test_atlas.py` and `test_web.py` also cover many of them and are not listed per row, except where they
  are the only judge (P4).
- **What a world page loads today** is read from `public/face/basic.html`.

## The list

Legend for **Action**: CONSERVE (stays on the global map), CONSERVE→WORLDS (carried into where the worlds land),
RETIRE (leaves with "play the game"), DECIDE (two signed things pull in opposite directions; recommendation given).

| # | Piece | Modules (main ones) | Judges today | In a world today | Action (recommended) | FIRMO |
|---|---|---|---|---|---|---|
| P1 | **Map with nodes** · the global map itself | `sea.js`, `map_nodes_layer.js`, `nodos*.js`, `node_*` (reception, trust, signature, bindings, projection, preview, file receiver), `map_zoom.js`, `map_pointer_input.js`, `map_integrity.js`, `fog_of_war.js`, `world_camera.js`, `npc_*`, `ui-nodos.js`, `ui-rack.js` (27) | `nodos_casos`, `map_integrity_casos`, `map_zoom.test`, `node_*.test` (5), `npc_occupancy_cases`, `camara_casos`, `isometric_floor_casos` … | — | **CONSERVE** (L-057: it IS the global map) | |
| P2 | **Combat mode** | `combate_ticks.js`, `arena.js`, `duelo.js`, `sobres.js`, `rating.js`, `escuadron.js`, `wave_duel_scene.js`, `combat_screen.js`, `ui-arena*.js`, `ui-duelo.js` (11) | `wave_duel_casos` (21), `arena_ticks_casos`, `duelo_casos`, `mp_casos`, `escuadron_casos`, `combat_screen_casos`; Chrome `wave_duel_browser`, `combat_screen_browser` | **yes**: the same wave duel (O1b #355) | **CONSERVE** (decree); the worlds already fight with it | |
| P3 | **Chat terminal** · NORTE 5's chat panel | `terminal_menu_shell.js`, `terminal_window_frame.js`, `radio_message_log.js`, `cable_terminal.js`, `cable_llamar.js` (5) | `ventana_casos`, `cable.test`, `ecos_casos`, `radio_age_cases`, `live_links_casos` | no (the world has its own `#ask`/`#reply` line) | **CONSERVE**, **first piece**: the chat panel of the global map, the one the worlds land with | |
| P4 | **GDPR art. 7 entry choice** · "where you play: open sea or a node" | `gdpr-art7-entry-choice.js` (1) | `test_atlas.py` only (python; no node case or Chrome check) | no | **CONSERVE→WORLDS**: it is literally the choice of where to land; its port adds a Chrome check | |
| P5 | **AI Act art. 50** · crab terminal + state radio | `aiact-art50-crab-terminal.js`, `aiact-art50-state-radio.js` (2) | `radio_phase1_cases`, `grieta_casos`, `audio_offline_casos`, `comic_accents_casos`, `descent_sound_casos` | own `#radio` (not the art. 50 module) | **CONSERVE** (transparency duty; it cannot leave silently) | |
| P6 | **GDPR art. 25 ephemeral crab** · the player on the map | `gdpr-art25-ephemeral-crab.js`, `crab_render_hd.js`, `crab_free_move.js`, `sea-crabs.js` (4) | `gdpr-art25-ephemeral-crab_casos`, `cangrejo_libre_casos`, `toon_casos`, `buildings_toon_casos` | own hero (`face_hero.js`) | **CONSERVE** (privacy by default; "play ten minutes without an account") | |
| P7 | **Save + first echo** · "si te gusta, guarda tu eco" | `atlas-guardado.js`, `primer_eco.js` (2) | `eco_casos`, `persiste_casos`, `mapa_viejo_desmontado.test` | no | **CONSERVE→WORLDS** (the guide phrase of the map canon) | |
| P8 | **Tutorial** · the entry world (North point 6) | `genesis_tutorial.js`, `tutorial_fases.js`, `ui-tutorial-fases.js`, `en301_tutorial.js`, `en301_practice_*.js` (6) | `tutorial_casos`, `tutorial_fases_casos`, `ui_tutorial_casos`, `en301_*.test` (4), `first_building_casos`; Chrome `tutorial_places_browser` | own `face_tutorial.js` | **CONSERVE→WORLDS** as the entry world. Depends on P12's 9 places (see P12) | |
| P9 | **Descent intro** | `descent_view.js`, `worm_transition.js`, `descent_sound.js` (3) | `descent_sound_casos`, `descent_pcm_cases`, `gusano_casos`, `gusano_bitmap_casos`, `en301_story.test`, `neck_cases` | no | **RETIRE** (decree: older than one week; it does not serve deploying the worlds: the door is now the tutorial) | decree ·6452880777 |
| P10 | **HITL signature + deep links** | `hitl_firma.js`, `deep_links.js` (2) | `hitl_firma.test`, `deep_links.test`, `mcp_manifest.test`, `web_mcp_capability_map.test` | no | **CONSERVE** (HITL is the brand's law) | |
| P11 | **Army · summon · eggs** | `gacha.js`, `db.js`, `core.js`, `ui.js`, `ui-invoca.js`, `ui-ficha.js`, `summon-*.js`, `summon_reveal.js`, `army-wave-panel.js`, `killswitch_dot.js` (11) | `gacha_casos`, `g0_casos`, `incubator_cases`, `army_wave_casos`, `invocation_persistence.test`, `p4_killswitch_guardian.test`, `phase_T3_cases` … | own `face_army.js`, `face_eggs.js` | **CONSERVE** as a dependency of P2 (troops fight) and through its signed invocation path only (L-057 fence) | |
| P12 | **Buildings and place cards** (the reef) | `home_buildings.js`, `reef_*.js` (4), `buildings_toon.js`, `shell_schematics.js`, `reef_corals.js`, `latency_crystal.js`, `hexelion_bench.js`, `place_reading.js`, `deploy_building.js` (12) | `place_card_casos`, `reef_building_casos`, `casa_casos`, `shell_schematics_casos`, `corales_casos`, `hexelion_bench_casos`, `place_reading_casos`; Chrome `place_card_browser` | no | **CONSERVE→WORLDS** (decree): the buildings go to the tutorial world, with more detail on the map | decree ·6452880777 |
| P13 | **History mode / crab state** | `crab_state_screen.js`, `casa-medidas.js`, `casa-personaliza.js`, `casa-lateral.js` (4) | `crab_state_screen_casos`, `tutorial_casos`, `mapa_viejo_desmontado.test` | own profile (`#sheet-profile`) | **RETIRE** (the world's profile is its counterpart) | |
| P14 | **Workshop** | `ui-taller.js` (face) · `taller.js` (engine) | `taller_casos`, `eco_casos`, `wave_duel_casos` | own `face_workshop.js` | **RETIRE the whole workshop / Creation Studio from the web** (decree; see P16). **`taller.js` STAYS**: measured loaders that are conserved: `combate_ticks.js`, `arena.js` (P2) and `primer_eco.js` (P7) | decree ·6452880777 |
| P15 | **Pilot layer · ATLAS engine** (the Forest expedition) | `atlas-motor.js`, `atlas-piloto.js`, `atlas-piloto-capa.js`, `atlas-partida.js`, `juez.js` (5) | `motor_casos`, `piloto_casos`, `arnes_piloto`, `verifica_partida`, `grieta_casos`, `vigia`, `phase_T3_cases` … | no | **SPLIT by measured loaders** (decree: what nothing conserved needs, dies). **STAY:** `atlas-motor.js` (`ui.js:189` CICLO_MS, `ui-duelo.js:29` CATALOGO: P11, P2), `atlas-partida.js` (`atlas-guardado.js:45`: P7), `atlas-piloto.js` (`aiact-art50-crab-terminal.js:3`, `sea.js:23`: P5, P1). **DIE:** `juez.js`, `atlas-piloto-capa.js` (only `thegame.js` loads them) | decree ·6452880777 |
| P16 | **Creation Studio** | `creation.html` + `creation_package.js`, `creation_feedback.js`, `creation_flow.js`, `bubble_editor.js`, `bubble_paint.js` (the last two are also in /play/'s CASA list) | `test_atlas` (`CREATION_PAGE_DEPENDENCIES`); its own cases | no | **RETIRE from the web** (decree). App-only: a separate proposal measures both paths (drawing app / image generator vs deterministic colour pieces); the Sovereign decides | decree ·6452880777 |

## What this list does not do

- **No style.** The radar aesthetic of the map canon waits for the visual gate, after the integration (P7 of the order).
- **No world drawn by hand.** The worlds land as nodes from what is measured. Today the aduana route is not deployed and D1/D2
  are pending, so the landing of a real node stays `NO_DATA` with that cause.
- **No removal.** Every RETIRE above becomes its own PR only after its FIRMO, with the routes, sw-listas and judges it drags.

## Tonight's sequence (pre-signed, one piece per PR, no stopping)

1. This list, updated: no DECIDE row remains.
2. P3 chat terminal.
3. The removal PR:
   - the "play the game" door leaves;
   - every RETIRE row, and every graphic older than one week, with its routes;
   - `arnes_sw`, DEPLOY.md and the counts re-measured;
   - the ~1 KB-per-screen gap measured and reported honestly.
4. The basic tutorial as the door: the circle, and the buildings with more detail (P8 + P12).
5. The Atlantis crab improved, from its spectrum (J-SN-01 < 200 B, seal → hue), no sprite.
6. The 3 style examples (basic / atlantis / zombie): the visual gate. **Here the work stops for the Sovereign's eyes.**

Agent: Claude Code · Model: claude-opus-5-5 / Run: NO_DATA
