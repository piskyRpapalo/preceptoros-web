
const IDIOMAS = ['es', 'en', 'fr', 'pt', 'it', 'de', 'ru', 'el', 'ar'];
const PAGINAS = [''];

// P2/P3 (2026-11-01): the map chunks are precached by exact name; atlas/hornea_chunks.mjs --check keeps them equal to the baked files.
const JUEGO = [
  '/creation.html', '/assets/atlas-coord.js', '/assets/radio_message_log.js', '/assets/worm_transition.js',
  '/game/valores.js', '/game/gacha.js', '/game/db.js', '/game/core.js', '/game/canon.js',
  '/game/tabla_semantica.js', '/game/comic_tokens.js', '/game/comic_atoms.js', '/game/wave_render.js',
  '/game/escena.js', '/game/gdpr-art25-ephemeral-crab.js', '/game/summon-wave-card.js',
  '/game/summon_reveal.js', '/game/taller.js', '/game/army-wave-panel.js', '/game/ui-taller.js',
  '/game/combate_ticks.js', '/game/fog_of_war.js', '/game/isometric_floor_projection.js',
  '/game/world_camera.js', '/game/map_zoom.js', '/game/sea.js', '/game/crab_render_hd.js',
  '/game/local_app_bridge.js', '/game/sea-floor.js', '/game/node_reception_contract.js',
  '/game/node_trust_anchor.js', '/game/node_trust_manifest.js', '/game/node_signature_messages.js',
  '/game/node_signature_verify.js', '/game/node_bindings_messages.js', '/game/node_bindings.js',
  '/game/node_projection.js', '/game/nodos.js', '/game/cuenta.js', '/game/escuadron.js',
  '/game/wave_duel_scene.js', '/game/node_preview.js', '/game/node_file_receiver.js', '/game/bubble_editor.js',
  '/game/bubble_paint.js', '/game/creation_package.js', '/game/creation_feedback.js', '/game/creation_flow.js',
  '/game/comic_accents.js', '/game/bubble_language.js', '/game/bubble_light.js', '/game/bubble_bestiary.js',
  '/game/bubble_world.js', '/game/bubble_letters.js', '/game/bubble_icons.js', '/game/local_app_bridge.js',
  '/game/state_frames.js', '/game/hex_projection.js', '/game/colony_state.js', '/game/colonia_edificios.js',
  '/game/palette_cycle.js', '/game/openworld_state.js', '/game/colonia_pagina.js', '/game/colony_controls.js', '/game/hitl_walkers.js',
  '/game/tutorial-fases.css', '/face/', '/get-the-app/', '/aduana/', '/face/basic.html', '/face/atlantis.html',
  '/face/zombie.html', '/face/face_openworld_terminal.js', '/game/army.html', '/game/face_canon.css', '/game/face_terminal.js',
  '/game/map_carta.js', '/game/map_chunks.js', '/game/map_painter.js', '/map/carta.json', '/art/sea-palette.json',
  '/map/chunks/-17_8.533552f4.json', '/map/chunks/-8_-9.f441ec9b.json', '/map/chunks/-9_17.c34de2b7.json', '/map/chunks/0_0.1a4f24a6.json', '/map/chunks/17_-8.206414ba.json', '/map/chunks/8_9.8896dfe9.json', '/map/chunks/9_-17.b1b968aa.json'
];

const PORTADA = [
  '/assets/auth.js', '/assets/enviar.js', '/assets/pwa.js', '/assets/landing.css', '/assets/landing_doors.js',
  '/assets/intro.js', '/openworld/', '/assets/aduana_page.js', '/assets/get_app_gate.js',
  '/game/launch_gate.js', '/game/node_catalogue.js', '/assets/mark.svg', '/assets/icon-192.png',
  '/assets/icon-512.png', '/assets/icon-512-maskable.png'
]
  .concat(IDIOMAS.map(function (l) { return '/assets/enviar-' + l + '.js'; }));
const HUB = [...PORTADA, ...JUEGO];

const ATLAS = [];
const CONTENIDO_JSON = [];

const RED_PRIMERO = ['/manifest.webmanifest'];

