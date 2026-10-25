
const IDIOMAS = ['es', 'en', 'fr', 'pt', 'it', 'de', 'ru', 'el', 'ar'];
const PAGINAS = [''];

const JUEGO = [
  '/creation.html',
  '/assets/front_door_view.js', '/assets/front_door.css', '/game/front_door.js',
  '/assets/thegame.js', '/assets/thegame.css', '/assets/tubo.css', '/assets/atlas.css',
  '/assets/atlas-arte.js', '/assets/atlas-coord.js', '/assets/atlas-carta.js', '/assets/atlas-ondas.js',
  '/assets/atlas-obra.js', '/assets/atlas-gesto.js', '/assets/atlas-dialogo.js',
  '/assets/atlas-motor.js', '/assets/atlas-piso.js', '/assets/atlas-piloto.js', '/assets/atlas-partida.js',
  '/assets/atlas-piloto-capa.js', '/assets/atlas-guardado.js', '/assets/radio_message_log.js', '/game/z_cutoff.js', '/assets/terminal_menu_shell.js', '/assets/terminal_menu_shell.css', '/assets/terminal_window_frame.js', '/assets/worm_transition.js', '/assets/atlas-hud.js',
  '/assets/atlas-opina.js', '/assets/atlas-voz.js', '/game/juez.js', '/game/valores.js', '/game/gacha.js',
  '/game/db.js', '/game/core.js', '/game/ui-ficha.js', '/game/ui-invoca.js', '/game/ui.js', '/game/canon.js', '/game/tabla_semantica.js', '/game/comic_tokens.js', '/game/comic_atoms.js', '/game/killswitch_dot.js', '/game/wave_render.js', '/game/escena.js',
  '/game/gdpr-art25-ephemeral-crab.js', '/game/aiact-art50-crab-terminal.js', '/game/gdpr-art7-entry-choice.js', '/game/aiact-art50-state-radio.js', '/game/casa-medidas.js', '/game/casa-personaliza.js', '/game/casa-lateral.js', '/game/crab_state_screen.js', '/game/reef_building_lifecycle.js', '/game/home_buildings.js',
  '/game/summon-wave-card.js', '/game/summon_reveal.js', '/game/taller.js', '/game/army-wave-panel.js', '/game/ui-taller.js', '/game/primer_eco.js', '/game/summon-access.js', '/game/deep_links.js', '/game/hitl_firma.js', '/game/onda_profunda.js', '/game/tarjeta_cantada.js', '/game/cable_llamar.js', '/game/cable_terminal.js', '/game/home.css', '/game/sobres.js', '/game/rating.js', '/game/combate_ticks.js', '/game/arena.js',
  '/game/duelo.js', '/game/fog_of_war.js', '/game/isometric_floor_projection.js', '/game/world_camera.js', '/game/map_pointer_input.js', '/game/semiotic_glyph.js', '/game/map_nodes_layer.js', '/game/map_zoom.js', '/game/piece_inspector.js', '/game/vector_contract.js', '/game/state_vector.js', '/game/place_reading.js', '/game/npc_territory_map.js', '/game/sea.js', '/game/sea-anchors.js', '/game/crab_render_hd.js', '/game/audio_feedback_manager.js', '/game/local_app_bridge.js', '/game/crab_free_move.js', '/game/genesis_tutorial.js', '/game/buildings_toon.js', '/game/reef_place_cards.js', '/game/shell_schematics.js', '/game/reef_buildings_paint.js', '/game/latency_crystal.js', '/game/hexelion_bench.js', '/game/reef_corals.js', '/game/reef_buildings_layer.js', '/game/sea-crabs.js', '/game/sea-floor.js', '/game/sea_rift.js', '/game/nodos-pesos.js',
  '/game/nodos-cedulas.js', '/game/node_reception_contract.js', '/game/node_trust_anchor.js', '/game/node_trust_manifest.js', '/game/node_signature_messages.js', '/game/node_signature_verify.js', '/game/node_bindings_messages.js', '/game/node_bindings.js', '/game/node_projection.js', '/game/nodos.js', '/game/cuenta.js', '/game/ui-nodos.js', '/game/ui-rack.js',
  '/game/escuadron.js', '/game/battle_choreography.js', '/game/battle_replay.js', '/game/npc_occupancy.js', '/game/npc_walls.js', '/game/node_preview.js', '/game/node_file_receiver.js', '/game/ui-arena-comun.js', '/game/ui-arena.js', '/game/ui-duelo.js', '/game/hexelion_dictionary.js',
  '/game/bubble_editor.js', '/game/bubble_paint.js',
  '/game/creation_package.js', '/game/creation_feedback.js', '/game/creation_flow.js',
  '/assets/eaa-art12-local-first-surface.js', '/assets/eaa-art12-local-first-surface.css',
  '/game/comic_accents.js', '/game/bubble_language.js', '/game/bubble_light.js', '/game/bubble_bestiary.js', '/game/map_bubble_figures.js', '/game/bubble_world.js', '/game/bubble_letters.js', '/game/bubble_game.js', '/game/bubble_icons.js', '/game/descent_sound.js',
  '/game/local_app_bridge.js', '/assets/descent_view.js', '/game/world_creator.js', '/assets/descent.css', '/game/tutorial_fases.js', '/game/ui-tutorial-fases.js', '/game/deploy_building.js', '/game/etiqueta.js', '/game/en301_tutorial_building.js', '/game/silueta.js', '/game/en301_practice_model.js', '/game/en301_practice_arena.js', '/game/en301_tutorial_copy.js', '/game/en301_tutorial_model.js', '/game/en301_tutorial_audio.js', '/game/en301_tutorial.js', '/assets/en301_practice.css', '/assets/en301_tutorial.css', '/game/tutorial-fases.css', '/assets/codex_scene.js', '/assets/bout_scene.js',
  '/face/basic.html',
  '/face/atlantis.html',
  '/face/zombie.html',
  '/face/face.css',
  '/face/face.js',
  '/face/face_army.js',
  '/face/face_battle.js',
  '/face/face_canon.css',
  '/face/face_eggs.js',
  '/face/face_fight.js',
  '/face/face_hero.js',
  '/face/face_hud.js',
  '/face/face_paint.js',
  '/face/face_panel.js',
  '/face/face_tutorial.js',
  '/face/face_views.css',
  '/face/face_workshop.js',
  '/face/face_world.js'
];

const PORTADA = ['/assets/base.css', '/assets/canon.css', '/assets/soberano.css', '/assets/consiento.css', '/assets/consiento.js',
                 '/assets/auth.js', '/assets/enviar.js', '/assets/page-comment.js', '/assets/page-comment.css', '/assets/pwa.js',
                 '/assets/favicon.svg', '/assets/icon-pwa-192.png', '/assets/icon-pwa-512.png', '/assets/icon-pwa-512-maskable.png']
  .concat(IDIOMAS.map(function (l) { return '/assets/enviar-' + l + '.js'; }));
const HUB = [...PORTADA, ...JUEGO];

const ATLAS = ['ar', 'de', 'el', 'en', 'es', 'fr', 'it', 'pt', 'ru']
  .map(function (l) { return '/atlas-' + l + '.json'; })
    .concat(['/atlas-opina-en.json'])   
    .concat(['/atlas-arena-en.json'])   
    .concat(['/atlas-casa-en.json']);
const CONTENIDO_JSON = [...ATLAS, '/dictionary.json', '/dictionary-en.json'];

const RED_PRIMERO = ['/manifest.webmanifest'];

