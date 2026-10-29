
const IDIOMAS = ['es', 'en', 'fr', 'pt', 'it', 'de', 'ru', 'el', 'ar'];
const PAGINAS = [''];

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
  '/game/tutorial-fases.css', '/face/', '/get-the-app/', '/aduana/', '/face/basic.html', '/face/atlantis.html',
  '/face/zombie.html', '/face/army.html', '/face/face.css', '/face/face.js', '/face/face_army.js', '/face/face_battle.js',
  '/face/face_canon.css', '/face/face_eggs.js', '/face/face_fight.js', '/face/face_fight_stage.js',
  '/face/face_hero.js', '/face/face_hud.js', '/face/face_paint.js', '/face/face_panel.js',
  '/face/face_terminal.js', '/face/face_tutorial.js', '/face/face_views.css', '/face/face_workshop.js',
  '/face/face_world.js', '/face/face_world_terrain.js'
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

