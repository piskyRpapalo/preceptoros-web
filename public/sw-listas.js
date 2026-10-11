/* preceptoros.org · QUE se cachea. El COMO vive en `sw.js`.
 *
 * POR QUE ESTAN SEPARADOS, medido el 2026-09-19. `sw.js` llego a 16.118 B de
 * los 16.384 que deja el gate: 266 libres. Meter en el precache los tres
 * registros nuevos (`caminos`, `duelos`, `herramientas`) y sus 24 ficheros por
 * lengua cuesta 298 B contados uno a uno --- 110 de los registros en las dos
 * listas, 162 del bucle sobre IDIOMAS y 26 de las referencias ---. No cabia
 * por 32 B, y retirando las tres paginas que mueren quedaba un margen de 22 B,
 * que en un fichero cuya regla es «jamas se recorta un comentario» no es
 * margen: es la trampa de la siguiente sesion.
 *
 * Asi que se parte POR ASUNTO, como ya se hizo siete veces en este arbol: aqui
 * los datos --- que lenguas, que paginas, que assets --- y alli la logica de
 * instalar, servir y refrescar. Los comentarios viajan CON su asunto; no se ha
 * recortado ninguno.
 *
 * Se carga con `importScripts` desde `sw.js`, que lo trae con `?v=VERSION`
 * pegado: sin ese sufijo un navegador puede servir una copia vieja de este
 * fichero mientras `sw.js` ya es nuevo, y las listas mandan sobre lo que se
 * guarda. Seria la misma averia que la version de cache sin subir, una capa
 * mas abajo.
 *
 * `const` en un guion traido por `importScripts` entra en el ambito global del
 * worker, asi que `sw.js` ve estas listas sin exportar nada.
 */

const IDIOMAS = ['es', 'en', 'fr', 'pt', 'it', 'de', 'ru', 'el', 'ar'];
/* LA WEB ES SOLO EL JUEGO (mudanza firmada, bloque 3, 2026-10-11). Cada lengua tiene UNA pagina, su
   portada, y la portada es el juego. Las paginas del hub (instalar, comunidad, benchmark, playground,
   onboarding, perfil) cayeron con su lista y su sha256 en no-publicar/; sus familias de JSON y sus
   piezas, tambien. Lo que queda en el shell es lo que la portada PIDE, medido recorriendola. */
const PAGINAS = [''];

/* EL JUEGO, AL PRECACHE (mudanza firmada, bloque 2, firma D7 del 2026-10-11). Hasta hoy theGame iba
   FUERA del precache (firma del 2026-09-26: la puerta no pesaba en la primera visita). La mudanza lo
   invierte porque la portada YA ES el juego: sin el en el shell, sin red no se juega. La lista es TODO
   lo que `thegame.js` carga (sus listas y lo que pide a demanda); `atlas/test_atlas.py` la compara con
   la puerta, asi que no puede quedarse atras. Lo que es MEDIDA (`atlas-mundo.json`, `atlas-record.json`)
   sigue fuera: sin red, NO_DATA, nunca una cifra vieja. Los textos del juego (atlas-*.json, tambien los
   de la casa) van en CONTENIDO_JSON, abajo. */
const JUEGO = [
  '/assets/thegame.js', '/assets/thegame.css', '/assets/atlas.css', '/assets/atlas-mapa.css',
  '/assets/atlas-arte.js', '/assets/atlas-coord.js', '/assets/atlas-carta.js', '/assets/atlas-ondas.js',
  '/assets/atlas-obra.js', '/assets/atlas-gesto.js', '/assets/atlas-mapa.js', '/assets/atlas-dialogo.js',
  '/assets/atlas-motor.js', '/assets/atlas-piso.js', '/assets/atlas-piloto.js', '/assets/atlas-partida.js',
  '/assets/atlas-piloto-capa.js', '/assets/atlas-guardado.js', '/assets/atlas-hud.js',
  '/assets/atlas-opina.js', '/assets/atlas-voz.js', '/game/juez.js', '/game/valores.js', '/game/gacha.js',
  '/game/db.js', '/game/core.js', '/game/ui.js', '/game/canon.js', '/game/wave_render.js', '/game/escena.js',
  '/game/gdpr-art25-ephemeral-crab.js', '/game/aiact-art50-crab-terminal.js', '/game/gdpr-art7-entry-choice.js', '/game/aiact-art50-state-radio.js', '/game/home_base_scene.js', '/game/home_buildings.js',
  '/game/summon_reveal.js', '/game/home.css', '/game/sobres.js', '/game/rating.js', '/game/arena.js',
  '/game/duelo.js', '/game/fog_of_war.js', '/game/world_camera.js', '/game/mar.js', '/game/nodos-pesos.js',
  '/game/nodos-cedulas.js', '/game/nodos.js', '/game/cuenta.js', '/game/ui-nodos.js', '/game/ui-rack.js',
  '/game/battle_choreography.js', '/game/battle_replay.js', '/game/ui-arena.js', '/game/ui-duelo.js',
  '/assets/eaa-art12-local-first-surface.js', '/assets/eaa-art12-local-first-surface.css'
];

/* LA PORTADA, ademas del juego: la identidad (auth.js), el canal para comentar y firmar (enviar,
   consiento, page-comment), la PWA, y las tres hojas con sus variables (base, canon con el contraste
   R-WIDGET, soberano). Los textos del canal van en las nueve lenguas: la portada de cada una pide el suyo. */
const PORTADA = ['/assets/base.css', '/assets/canon.css', '/assets/soberano.css', '/assets/consiento.css', '/assets/consiento.js',
                 '/assets/auth.js', '/assets/enviar.js', '/assets/page-comment.js', '/assets/page-comment.css', '/assets/pwa.js',
                 '/assets/favicon.svg', '/assets/icon-pwa-192.png', '/assets/icon-pwa-512.png', '/assets/icon-pwa-512-maskable.png']
  .concat(IDIOMAS.map(function (l) { return '/assets/enviar-' + l + '.js'; }));
/* Lo que viaja en el shell: la portada y el juego. (Antes se llamaba HUB; el nombre se queda en sw.js
   para no tocar su logica de instalar, servir y refrescar, que es la que sobrevivio al 2026-09-08.) */
const HUB = [...PORTADA, ...JUEGO];

/* Los TEXTOS del juego son contenido (se sirven del cache); `atlas-mundo.json` y `atlas-record.json`
   son MEDIDAS y siguen fuera: sin red, NO_DATA, nunca una cifra vieja con cara de fresca. */
const ATLAS = ['ar', 'de', 'el', 'en', 'es', 'fr', 'it', 'pt', 'ru']
  .map(function (l) { return '/atlas-' + l + '.json'; })
  /* Y los textos de opinar firmado (su guion se carga al pulsar), por el mismo criterio. */
  .concat(['/atlas-opina-en.json'])   // solo existe en ingles (el juego habla ingles): pedir las otras ocho era pedir 404
  /* Y los de la Arena (2026-09-28): rotulos, no medidas; sin ellos la Arena no abre sin red. */
  .concat(['/atlas-arena-en.json'])   // idem
  /* D7: los textos de la casa faltaban; sin ellos la casa abria sin rotulos sin red. */
  .concat(['/atlas-casa-en.json']);
const CONTENIDO_JSON = [...ATLAS];

const RED_PRIMERO = ['/manifest.webmanifest'];

