// NORTE 5 [3] (2026-10-27, decree ·6452880777): "play the game" left. These lists are exactly what the surviving pages
// load (the landing, /face/ and its three worlds, /get-the-app/, /aduana/), measured by resource loads, not by hand.
// Conserved pieces that no page loads yet stay in the tree, out of the precache, until their port (docs/NORTE5_LISTA_CONSERVACION.md).
const IDIOMAS = ['en'];
const PAGINAS = [''];

const JUEGO = [
  '/face/atlantis.html',
  '/face/basic.html',
  '/face/face.css',
  '/face/face.js',
  '/face/face_army.js',
  '/face/face_battle.js',
  '/face/face_canon.css',
  '/face/face_eggs.js',
  '/face/face_fight.js',
  '/face/face_fight_stage.js',
  '/face/face_hero.js',
  '/face/face_hud.js',
  '/face/face_paint.js',
  '/face/face_panel.js',
  '/face/face_tutorial.js',
  '/face/face_views.css',
  '/face/face_workshop.js',
  '/face/face_world.js',
  '/face/face_world_terrain.js',
  '/face/',
  '/face/zombie.html',
  '/game/army-wave-panel.js',
  '/game/bubble_bestiary.js',
  '/game/bubble_icons.js',
  '/game/bubble_language.js',
  '/game/bubble_letters.js',
  '/game/bubble_light.js',
  '/game/bubble_world.js',
  '/game/canon.js',
  '/game/combate_ticks.js',
  '/game/comic_accents.js',
  '/game/comic_atoms.js',
  '/game/comic_tokens.js',
  '/game/core.js',
  '/game/crab_render_hd.js',
  '/game/db.js',
  '/game/escena.js',
  '/game/escuadron.js',
  '/game/fog_of_war.js',
  '/game/gacha.js',
  '/game/gdpr-art25-ephemeral-crab.js',
  '/game/isometric_floor_projection.js',
  '/game/map_zoom.js',
  '/game/node_bindings.js',
  '/game/node_bindings_messages.js',
  '/game/node_file_receiver.js',
  '/game/node_preview.js',
  '/game/node_projection.js',
  '/game/node_reception_contract.js',
  '/game/node_signature_messages.js',
  '/game/node_signature_verify.js',
  '/game/node_trust_anchor.js',
  '/game/node_trust_manifest.js',
  '/game/sea-floor.js',
  '/game/summon-wave-card.js',
  '/game/summon_reveal.js',
  '/game/tabla_semantica.js',
  '/game/taller.js',
  '/game/valores.js',
  '/game/wave_duel_scene.js',
  '/game/wave_render.js',
  '/game/world_camera.js'
];

const PORTADA = [
  '/aduana/',
  '/assets/aduana_page.js',
  '/assets/atlas-coord.js',
  '/assets/auth.js',
  '/assets/get_app_gate.js',
  '/assets/icon-192.png',
  '/assets/icon-512-maskable.png',
  '/assets/icon-512.png',
  '/assets/landing.css',
  '/assets/landing_doors.js',
  '/assets/mark.svg',
  '/assets/pwa.js',
  '/assets/worm_transition.js',
  '/game/launch_gate.js',
  '/game/node_catalogue.js',
  '/get-the-app/'
];
const HUB = [...PORTADA, ...JUEGO];

const CONTENIDO_JSON = [];

const RED_PRIMERO = ['/manifest.webmanifest'];
