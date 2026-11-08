
const IDIOMAS = ['es', 'en', 'fr', 'pt', 'it', 'de', 'ru', 'el', 'ar'];
const PAGINAS = [''];

// P2/P3 (2026-11-01): the map chunks are precached by exact name; atlas/bake_chunks.mjs --check keeps them equal to the baked files.
const JUEGO = [
  '/creation.html', '/assets/atlas-coord.js', '/assets/radio_message_log.js', '/assets/worm_transition.js',
  '/game/values.js', '/game/gacha.js', '/game/db.js', '/game/core.js', '/game/canon.js',
  '/game/semantic_table.js', '/game/comic_tokens.js', '/game/comic_atoms.js', '/game/wave_render.js',
  '/game/scene.js', '/game/gdpr-art25-ephemeral-crab.js', '/game/summon-wave-card.js',
  '/game/summon_reveal.js', '/game/workshop.js', '/game/army-wave-panel.js', '/game/ui-workshop.js',
  '/game/combat_ticks.js', '/game/fog_of_war.js', '/game/isometric_floor_projection.js',
  '/game/world_camera.js', '/game/map_zoom.js', '/game/map_drag.js', '/game/map_view_joystick.js', '/game/gamepad.js', '/game/building_sheet.js', '/game/building_interiors.json', '/game/type_scale.js', '/game/map_wide.js', '/game/sea.js',
  '/game/crab_render_hd.js',
  '/game/local_app_bridge.js', '/game/sea-floor.js', '/game/node_reception_contract.js',
  '/game/node_trust_anchor.js', '/game/node_trust_manifest.js', '/game/node_signature_messages.js',
  '/game/node_signature_verify.js', '/game/node_bindings_messages.js', '/game/node_bindings.js',
  '/game/node_projection.js', '/game/nodes.js', '/game/account.js', '/game/squadron.js',
  '/game/wave_duel_scene.js', '/game/node_preview.js', '/game/node_file_receiver.js', '/game/acho_editor.js',
  '/game/acho_paint.js', '/game/creation_package.js', '/game/creation_feedback.js', '/game/creation_flow.js',
  '/game/comic_accents.js', '/game/acho_language.js', '/game/acho_light.js', '/game/acho_bestiary.js',
  '/game/acho_world.js', '/game/acho_letters.js', '/game/acho_icons.js', '/game/local_app_bridge.js',
  '/game/state_frames.js', '/game/brain_frame.js', '/game/brain_panel.js', '/game/hex_projection.js', '/game/colony_state.js', '/game/colony_buildings.js',
  '/assets/openworld.css',
  '/game/palette_cycle.js', '/game/openworld_state.js', '/game/colony_page.js', '/game/colony_controls.js', '/game/hitl_walkers.js',
  '/game/tutorial-phases.css', '/face/', '/get-the-app/', '/aduana/', '/face/basic.html',
  '/face/face_openworld_terminal.js', '/game/army.html', '/game/face_canon.css', '/game/face_terminal.js',
  '/game/map_chart.js', '/game/map_chunks.js', '/game/place_name.js', '/game/map_painter.js', '/game/terminal_panel.js', '/game/map_focus.js', '/game/visitor_walk.js', '/game/welcome_card.js', '/game/web_node_brain.js', '/map/chart.json', '/art/sea-palette.json',
  '/map/chunks/-17_8.4f6b2fb7.json', '/map/chunks/-8_-9.2952fe44.json', '/map/chunks/-9_17.73887b02.json', '/map/chunks/0_0.3a4eaa1f.json', '/map/chunks/17_-8.7eb13144.json', '/map/chunks/8_9.ad8fef77.json', '/map/chunks/9_-17.aeed1d05.json'
];

const PORTADA = [
  '/assets/auth.js', '/assets/send.js', '/assets/pwa.js', '/assets/landing.css', '/assets/landing_doors.js',
  '/assets/intro.js', '/assets/landing_world.js', '/openworld/', '/assets/aduana_page.js', '/assets/get_app_gate.js',
  '/game/launch_gate.js', '/game/node_catalogue.js', '/assets/mark.svg', '/assets/icon-192.png',
  '/assets/icon-512.png', '/assets/icon-512-maskable.png'
]
  .concat(IDIOMAS.map(function (l) { return '/assets/send-' + l + '.js'; }));
const HUB = [...PORTADA, ...JUEGO];

const ATLAS = [];
const CONTENIDO_JSON = [];
// Modo avion (2026-11-01): la carta, la paleta y los chunks horneados (inmutables, con hash) salen del cache sin red.
const MAPA_JSON = JUEGO.filter(function (r) { return r.endsWith('.json'); });

// Modo avion (2026-11-01): el estado del tutorial va a red primero y, sin red, sale de la ultima copia.
const RED_PRIMERO = ['/manifest.webmanifest', '/openworld/state.json'];

