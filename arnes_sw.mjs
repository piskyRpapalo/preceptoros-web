// arnes_sw.mjs · comprueba la LOGICA de public/sw.js fuera de un navegador.
//
// POR QUE EXISTE
// --------------
// Un service worker es la pieza mas dificil de comprobar del sitio: solo vive
// en un contexto seguro, dentro de un navegador, y el panel de vista previa de
// esta maquina bloquea su registro -- comprobado el 2026-08-30 con un control,
// registrar CUALQUIER script falla ahi con el mismo error. Sin arnes, la unica
// forma de saber si el worker enruta bien era desplegarlo y mirar.
//
// LO QUE ESTE ARNES SI PRUEBA: las cuatro reglas de enrutado, el precache del
// shell, la sintesis de la pagina sin red en los tres idiomas y la limpieza de
// caches viejos al activar.
// LO QUE NO PRUEBA, Y NO PRETENDE: que el navegador lo instale, que respete
// los encabezados reales o que el ciclo de vida se comporte igual. Eso solo lo
// dice un navegador, y aqui se declara en vez de suponerse.
//
//     node arnes_sw.mjs        -> sale 0 si todo pasa
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Ruta relativa al propio fichero: nada de rutas absolutas, que solo
// funcionan en la maquina donde se escribieron.
const AQUI = path.dirname(fileURLToPath(import.meta.url));
const codigo = fs.readFileSync(path.join(AQUI, 'public', 'sw.js'), 'utf8');
const ORIGEN = 'https://preceptoros.org';

class CacheFalso {
  constructor(){ this.m = new Map(); }
  async match(req){ const k = typeof req==='string'?req:req.url; 
    for (const [u,v] of this.m) if (u===k || u===new URL(k).pathname) return v;
    return undefined; }
  async put(req,res){ this.m.set(typeof req==='string'?req:req.url, res); }
  async add(u){ const r = await entorno.fetch(new URL(u,ORIGEN).href); 
    if(!r.ok) throw new Error('404 '+u); this.m.set(u, r); }
  async keys(){ return [...this.m.keys()]; }
}
const almacen = new Map();
const registro = { pedidasARed: [], cacheadas: [] };

const entorno = {
  console,
  URL, Response, Promise, Error,
  handlers: {},
  fetch: async (req) => {
    const u = typeof req==='string'?req:req.url;
    registro.pedidasARed.push(new URL(u,ORIGEN).pathname);
    if (u.includes('/no-existe')) return { ok:false, status:404, clone(){return this} };
    if (entorno.SIN_RED) throw new Error('sin red');
    /* CLOUDFLARE PAGES REDIRIGE TODO `.html` A SU RUTA SIN EXTENSION (307), y
       `fetch` sigue el salto: lo que vuelve trae `redirected: true`. Sin esto
       el arnes no podia ver la averia del 2026-09-08 -- daba 21/21 con el
       worker roto en produccion. Se modela la red que hay, no la comoda. */
    if (entorno.REDIRIGE && new URL(u,ORIGEN).pathname.endsWith('.html'))
      return { ok:true, status:200, statusText:'', redirected:true, headers:{},
               cuerpo:'red:'+u, blob: async()=>'red:'+u, clone(){ return this } };
    return { ok:true, status:200, cuerpo:'red:'+u, clone(){ return this } };
  },
  caches: {
    open: async n => { if(!almacen.has(n)) almacen.set(n,new CacheFalso()); return almacen.get(n); },
    keys: async () => [...almacen.keys()],
    delete: async n => almacen.delete(n),
  },
};
entorno.self = entorno;
entorno.location = { origin: ORIGEN };
entorno.addEventListener = (t,f) => { entorno.handlers[t]=f; };
entorno.clients = { claim: async()=>{} };
/* `skipWaiting` entro el 2026-09-05 con el worker. El arnes tiene que modelar
   la API que el worker USA, no la que usaba: sin esta linea el `install`
   revienta aqui y el fallo se lee como si el worker estuviera roto -- lo que
   estaba roto era el doble. Se cuenta cuantas veces se llama para poder
   comprobarlo abajo. */
entorno.saltosDeEspera = 0;
entorno.skipWaiting = async () => { entorno.saltosDeEspera++; };

/* `importScripts` de verdad, no un simulacro. El 2026-09-19 las listas de QUE
   se cachea salieron de `sw.js` a `sw-listas.js` --- el fichero se habia
   quedado a 266 B del tope ---, y este arnes corre `sw.js` en un `vm` sin
   navegador detras. Fingir la funcion habria dejado el arnes verde sin haber
   cargado una sola lista: se LEE el fichero de `public/` y se ejecuta en el
   MISMO contexto, que es lo que hace un worker de verdad.
   Se le quita el `?v=VERSION` porque aqui no hay caches que engañar. */
entorno.importScripts = (...urls) => {
  for (const u of urls) {
    const rel = String(u).split('?')[0].replace(/^\//, '');
    vm.runInContext(fs.readFileSync(path.join(AQUI, 'public', rel), 'utf8'),
                    entorno);
  }
};

vm.createContext(entorno);
vm.runInContext(codigo, entorno);

function evento(url, mode='no-cors', method='GET'){
  let respuesta = null;
  return { e: { request: { url, mode, method }, respondWith: p => { respuesta = p; },
                waitUntil: p => p },
           leer: () => respuesta };
}
async function pedir(url, mode='navigate', method='GET'){
  const {e, leer} = evento(url, mode, method);
  entorno.handlers.fetch(e);
  const p = leer();
  return p === null ? 'PASA_DE_LARGO' : await p;
}

const prueba = [];
const ok = (n,c,d='') => prueba.push([c?'PASA':'FALLA', n, d]);

// instalar
let esperas=[];
entorno.handlers.install({ waitUntil: p => esperas.push(p) });
await Promise.all(esperas);
const shell = almacen.get([...almacen.keys()].find(k=>k.startsWith('shell-')));
const rutas = await shell.keys();
// 24 paginas + 3 catalogos + 7 piezas + 8 ojos + 8 esferas = 50.
// Las paginas son 3 sueltas ('/', hitos, manifiesto) + 7 por idioma x 3. Eran
// 21 hasta el 2026-09-02: `profile.html` entro en PAGINAS y sumo tres.
// 53 y no 50 desde el 2026-09-03: entran las tres tiras de la cara.
// 54 desde el 2026-09-05: entra `cabezal.css`, la maqueta de movil que salio de
// `widget.css` al pasar aquella de 16.724 B sobre un tope de 16.384. Sin ella
// en el shell, la pagina sin red se veria con la maqueta de escritorio en un
// telefono -- que es peor que no verse, porque parece que funciona.
// 61 el mismo dia: entra el PORTUGUES, siete paginas mas; 68 con el ITALIANO y 75 con el ALEMAN y 82 con el RUSO. Y 84 sin lengua nueva: el 2026-09-05 entraron
// `/instalar.json` y su guion al shell, porque la pagina Instalar dejo de ser
// prosa y paso a derivar el catalogo de modelos -- sin ellos, sin red, esa
// pagina abre sin la mitad de lo que ahora promete. La cifra sube de
// siete en siete con cada lengua completa, que es la forma que tiene este arnes
// de decir que una lengua a medias no existe: o entran sus siete o no entra.
// La cifra va a mano a proposito: si alguien anade una ruta al shell sin
// pensarlo, esto se pone rojo y le obliga a decir por que.
// 99 desde el 2026-09-06: entra `esquina-cuenta.css`, la mitad de
// `esquina.css` que se partio por asunto al llegar la hoja al tope. El
// numero se sube A MANO a proposito -- si se calculara del propio fichero
// no vigilaria nada: una ruta que se cuela sin querer pasaria igual.
// 110 desde el 2026-09-08: entran `cabezal.js` y `cabezal-rotulos.js`, que son
// el cabezal comun que estrenan hoy las veinticuatro paginas interiores. Sin
// ellos en el shell, la segunda visita sin red monta el mueble y se queda SIN
// ROTULOS: cuatro puertas en blanco, que es peor que no tener puertas.
// Y `nav.js` SE VA: `onboarding`, `playground` y `profile` migraron tambien,
// asi que las CUARENTA Y OCHO paginas interiores montan ya el mismo cabezal
// que la portada y no queda quien lo cargue. Entran dos y sale uno: 109.
// Se comprobo pidiendo los ficheros, no leyendo el codigo -- un primer intento
// lo borro con tres paginas todavia usandolo.
// 110 desde el 2026-09-08 (segunda vez el mismo dia): entra `esquina-par.css`,
// la pareja de mandos del cabezal. Se partio de `esquina-cuenta.css` al llegar
// esa hoja al tope, y tiene hoja propia por cuenta de CICATRICES mas que por
// bytes: los dos botones han estado mal seis veces en dos dias, siempre por
// una regla que sobrevivio a la mudanza de la pieza que colocaba.
// 118 desde el 2026-09-08: entran los ocho `/agentes-<lengua>.json`, los
// nombres de los companeros que salieron del bloque i18n de las portadas.
// 120 desde el 2026-09-13: entran `/assets/aprender.js` y
// `/assets/elegir.js`, las puertas segunda y tercera de feedback. El numero se sube
// a mano A PROPOSITO -- si se dedujese de la lista del worker, el test
// diria siempre que si y dejaria de avisar el dia que una pieza se caiga
// del precache sin que nadie lo decida.
// 145 desde el 2026-09-23: entra el arabe, la novena lengua. Seis paginas
// suyas en el shell y sus cuatro familias precacheadas (agentes, duelos,
// herramientas, caminos): seis y cuatro, diez.
// 91 desde la mudanza bloque 3 (2026-10-11): la web es SOLO el juego. Cayeron las paginas del hub,
// sus familias de JSON y sus piezas (archivadas con su sha256 en no-publicar/). Quedan: la raiz, el
// manifiesto, las 9 portadas, la portada (identidad, canal, PWA, hojas) y el juego entero.
// 92 desde J6 (plan «el refresco», 2026-10-11): `mar-fondo.js`, el pintor de teselas del mapa y del fondo.
// 93 desde R3: `tubo.css`, los tubos del juego.
// 95 desde P9: `taller.js` y `ui-taller.js`, el Polvo de Taller.
// 96 desde P10: `mar-anclas.js` (las anclas salen de `mar.js`, que estaba en su techo).
// 97 desde P6: `escuadron.js`.
// 98 desde P11: `primer_eco.js`.
// 101 desde U0 («el mapa unico»): `casa-medidas.js`, `casa-personaliza.js` y `ui-arena-comun.js` (troceos).
// U1 cambia uno por otro (entra `casa-lateral.js`, sale `home_base_scene.js`): siguen 101.
// 102 desde U2: `mar-cangrejos.js`, los cangrejos en el mapa.
// 103 desde T: `ui-ficha.js` (la ficha de la tropa sale de `ui.js`).
// 105 desde la LEY DEL SUELO, paso 2: `isometric_floor_projection.js` y `map_pointer_input.js`.
// 108 desde la TERMINAL CHATBOT: `radio_message_log.js`, `terminal_menu_shell.js` y `terminal_menu_shell.css` (en la puerta).
// 110 desde LOS 9 OBJETOS: `reef_building_lifecycle.js` (con la casa) y `reef_buildings_layer.js` (con la arena), a demanda.
// 111 con `latency_crystal.js` (el cuarto objeto, con la arena).
// 112 con `piece_inspector.js` (lote 0d, el inspector honesto).
// 113 con `place_telemetry.js` (∇C de los lugares, opcion A).
// 114 con `crab_free_move.js` (B: el cangrejo funcional).
// 115 con `genesis_tutorial.js` (E: el tutorial es el contrato de genesis).
// 116 con `reef_corals.js` (A: los corales del rack).
// 117 con `crab_render_hd.js` (R1: el cangrejo toon).
// 118 con `terminal_window_frame.js` (PR-1: la ventana como una conversacion).
// 120 con `worm_transition.js` (PR-2) y `state_vector.js` (el vector del juego).
// 121 con `map_nodes_layer.js` (split de mar.js: los nodos del rack salen del mapa).
// 122 con `map_zoom.js` (zoom del mapa: pellizco y rueda).
// 123 con `buildings_toon.js` (ronda 2: edificios en toon).
// 124 con `hexelion_bench.js` (ronda 3: payload de Hexelion con su fuente).
// 125 con `ui-invoca.js` (FIRMO M1, 2026-10-13: la invocacion sale de ui.js al satelite).
// 138 con `semiotic_glyph.js` (P2: glyphs for the honest inspector).
// 129 con `army-wave-panel.js` (Q1: la ficha grande del Army se precachea sin red).
// 130 con `summon-wave-card.js` (Q2: el espectro medido llega al reveal sin red).
// 131 con `summon-access.js` (Q3: la puerta de summon en Base también queda offline).
// 132-134 con los tres modulos de ocupacion NPC; 135 añade Shell Schematics.
// 158 con `comic_tokens.js` (W1, tokens comic: neutros y tonos sobre AtlasSemantica); 159 con `comic_atoms.js` (W2, atomos comic sobre los tokens).
// 167 con el descenso (obra abku): comic_accents, los cuatro bubble_*, descent_scene, descent_view y descent.css; 168 con bubble_letters (V7); 170 con bubble_game y codex_scene (V9, el Codex); 171 con bout_scene (viabilidad); 174 con mar_rift, bubble_icons y descent_sound (estilo rift); 173 sin descent_scene (2026-10-19: el descenso sale de la presentación).
// 174 con z_cutoff (T_CRT, 2026-10-19): la regla de la rueda Z se pide en la puerta (173 tras retirar descent_scene, +1).
// 176 con combate_ticks (VT3, 2026-10-19): el paso a paso del combate, extraido de arena.js (+1 ruta).
// G3 adds the front door composition, view, and stylesheet to the offline shell.
// 217 with the game face (2026-10-25): three skins in /face/ and their fifteen face files (+18).
// 218 con en301_tutorial_copy.js (2026-10-25: textos del tutorial /en/ aparte, el modelo no cabe en 16 KiB).
// 219 con face_world_terrain.js (2026-10-25, ronda R2 de web#312: el terreno sale de face_world.js).
// 220 con /face/ (2026-10-25, hub de los mundos: public/face/index.html, sirve el directorio).
// 220 -> 213 el 2026-10-25 (recencia + canon ingles): salen las nueve portadas de lengua (301 a `/`)
// y los cinco iconos viejos; entran /play/, landing.css, mark.svg y los tres iconos nuevos.
// 213 -> 215 el 2026-10-26 (P2): entran map_integrity.js y combat_screen.js.
// 215 -> 216 el 2026-10-26 (P3 1b): entra face_fight_stage.js.
// 216 -> 217 el 2026-10-26 (P3 1d sobre 1b): entra landing_doors.js.
// 217 -> 218 el 2026-10-26 (Norte D1): entra /get-the-app/.
// 218 -> 220 el 2026-10-26 (Norte N2): entran /aduana/ y aduana_page.js.
// 220 -> 221 el 2026-10-26 (Norte N3): entra node_catalogue.js.
// 221 -> 219 el 2026-10-27 ([W] O1b): salen battle_replay.js, bout_scene.js y battle_choreography.js (este queda en PUROS, sin
// cargar); entra wave_duel_scene.js, la UNA cara de combate.
// 219 -> 221 el 2026-10-27 (NORTE 5 a1): entran get_app_gate.js y launch_gate.js, la compuerta de /get-the-app/.
// 221 -> 222 el 2026-10-28 (NORTE 7 PR 1): entra intro.js, el boton Tools y la lectura de release.json, sin red.
// 222 -> 223 el 2026-10-28 (NORTE 7 PR 2): entra /openworld/ (ficha unica: el script va inline).
// 223 -> 224 el 2026-10-27 (NORTE 5 [2]): entra face/face_terminal.js, el terminal de chat en los mundos.
// 224 -> 221 el 2026-10-28 (Norte 7 pieza C): salen /play/, assets/thegame.js y assets/thegame.css (theGame sale del shell).
// 221 -> 106 el 2026-10-28 (Norte 7 pieza D): sale el juego borrado (manifiesto medido: 134 ficheros, enviar.js y enviar-*.js se quedan).
// 107 -> 116 el 2026-10-30: the shared-map neutral terminal and its renderer chain join the shell cache.
// 113 -> 114 el 2026-11-01 (terminal): entra /game/terminal_tabs.js.
// 112 -> 113 el 2026-11-01 (P5a, tras P4): entra /game/hitl_walkers.js.
// 111 -> 112 el 2026-11-01 (P4): entra /game/map_painter.js, el suelo 2.5D.
// 100 -> 111 el 2026-11-01 (P2/P3): entran map_carta.js, map_chunks.js, la carta, la paleta del mar y los 7 chunks.
// 116 -> 100 el 2026-11-01 (H2): salen los dieciseis modulos de las pieles retiradas (retirados/face/); army.html,
// face_canon.css y face_terminal.js se mudan a /game/; atlantis y zombie quedan como lapidas que siguen offline.
ok('precachea las portadas, su superficie y el juego', rutas.length === 115 && rutas.includes('/game/army.html') && rutas.includes('/map/carta.json'), rutas.length+' rutas');
ok('el shell NO trae el juego retirado (corte Norte 7 D)',
   !(['/assets/thegame.js', '/game/ui-arena.js', '/assets/atlas-motor.js'].some(r => rutas.includes(r))));
ok('el shell trae la puerta y NO trae /play/ (corte Norte 7 C)', rutas.includes('/') && !rutas.includes('/play/') && !rutas.includes('/assets/thegame.js'));
ok('el shell YA NO trae portadas de lengua (301 a `/`)', !rutas.some(r => /^\/(ar|de|el|en|es|fr|it|pt|ru)\/$/.test(r)));
ok('el shell trae la identidad y el canal', ['/assets/auth.js', '/assets/enviar.js', '/assets/pwa.js'].every(r => rutas.includes(r)));
ok('page-comment.js sale del shell (retirada con /play/, corte Norte 7 D)', !rutas.includes('/assets/page-comment.js'));
ok('el shell YA NO trae nada del hub', !rutas.some(r => /community|benchmark|playground|onboarding|profile|instalar|hub\.json|hitos|chat|caras\//.test(r)));
// NINGUNA DE LAS DOS FAMILIAS VIAJA YA, y la segunda cayo el 2026-09-20.
//
// Los ojos se fueron el 2026-09-05 --los pintaba solo la portada de la raiz,
// que es ahora el despertar-- y esa linea ya estaba aqui. Las esferas
// aguantaron quince dias mas con este mismo arnes exigiendo que viajaran:
// 108.582 B que todo visitante descargaba y guardaba para un panel de
// companeros que ya no se pintaba. Cuando el Soberano retiro los companeros
// del catalogo, se cayeron con ellos.
//
// De 120 rutas a 112: las ocho que sobraban. Y a 114 el mismo dia, cuando
// entran los dos guiones de la Torre --- que SI se pintan, y que ademas
// sostienen el companero por defecto del chat desde que los ocho se fueron.
// El saldo del dia: -8 ficheros de arte muerto, +2 de codigo vivo, y 157 KB
// menos en cada instalacion.
// Y a 124 al entrar el duelo de LoRAtelier: `duelo.js`, `rack.js` y los ocho
// `duelos-<lengua>.json`, que entre todos pesan 12,4 KB --- menos de la octava
// parte de lo que ocupaban las esferas que salieron esta manana.
// Y a 135 con el indice de Herramientas y sus ocho ficheros de rotulos: 45
// claves que llevaban traducidas desde la Fase 1 sin que nadie las pintara.
ok('el shell NO trae ninguna de las dos familias de iconos de companero',
   rutas.filter(r => r.startsWith('/assets/agente-')).length === 0);

// regla 1: otro origen
ok('otro origen pasa de largo',
   await pedir('https://esm.run/@mlc-ai/web-llm','no-cors') === 'PASA_DE_LARGO');
ok('la API del Agora pasa de largo',
   await pedir('https://api.preceptoros.org/api/v1/tasks','cors') === 'PASA_DE_LARGO');

// regla 2: una MEDIDA no se cachea; el CONTENIDO declarado si.
ok('counters.json no se cachea (es una medida)',
   await pedir(ORIGEN+'/counters.json','cors') === 'PASA_DE_LARGO');
ok('atlas-en.json YA NO se sirve del cache (lexicon de theGame retirado, corte Norte 7 D)',
   await pedir(ORIGEN+'/atlas-en.json','cors') === 'PASA_DE_LARGO');
{
  // El manifiesto va a red primero: con red responde la red, no el cache.
  const r = await pedir(ORIGEN+'/manifest.webmanifest','cors');
  ok('el manifiesto va a red primero',
     r !== 'PASA_DE_LARGO' && String(r.cuerpo).startsWith('red:'),
     'cuerpo ' + (r && r.cuerpo));
}

// regla 3: navegacion cacheada, comprobada SIN RED para que no haya duda de
// que sale del shell y no de la red.
entorno.SIN_RED = true;
const r1 = await pedir(ORIGEN+'/openworld/','navigate');
ok('navegacion sale del shell aun sin red',
   r1 !== 'PASA_DE_LARGO' && r1.status === 200 && String(r1.cuerpo).includes('/openworld/'),
   'status '+(r1 && r1.status));
const r2 = await pedir(ORIGEN+'/fr/nueva.html','navigate');
const txt = await r2.text();
ok('sin red sintetiza pagina', r2.status === 503, 'status '+r2.status);
ok('la respeta el idioma de la ruta', txt.includes('Hors ligne'), txt.slice(0,0));
ok('la pagina sin red mete el texto en un panel', txt.includes('class="panel"'));
ok('declara --panel-bg y --panel-fg', txt.includes('--panel-bg') && txt.includes('--panel-fg'));

// POST nunca se toca
ok('un POST pasa de largo',
   await pedir(ORIGEN+'/api','cors','POST') === 'PASA_DE_LARGO');

// activate limpia versiones viejas
almacen.set('shell-viejo', new CacheFalso());
esperas=[]; entorno.handlers.activate({ waitUntil: p => esperas.push(p) });
await Promise.all(esperas);
ok('install no deja al worker nuevo esperando a que cierren las pestanas',
   entorno.saltosDeEspera === 1, entorno.saltosDeEspera + ' llamadas a skipWaiting');
ok('activate borra el cache de la version anterior', !almacen.has('shell-viejo'));

/* LA AVERIA DEL 2026-09-08 · el sitio entero caido en Chrome con ERR_FAILED.
   Un worker no puede responder a una NAVEGACION con una respuesta que lleve la
   marca de redirigida: el navegador la rechaza en seco. Como Cloudflare sirve
   `/es/benchmark.html` con un 307, todo lo precacheado con `.html` llegaba
   marcado, y solo se salvaban `/` y `/es/` -- las unicas rutas sin extension.
   Se comprueban los TRES caminos por los que la marca entra o sale, porque
   arreglar uno solo deja el sitio roto igual. */
/* La red vuelve: el bloque de arriba la dejo apagada para la pagina sin red,
   y un precache sin red guarda cero cosas y da un verde vacio. */
entorno.SIN_RED = false;
entorno.REDIRIGE = true;
almacen.clear();
esperas=[]; entorno.handlers.install({ waitUntil: p => esperas.push(p) });
await Promise.all(esperas);
const sh2 = almacen.get([...almacen.keys()].find(k=>k.startsWith('shell-')));
const guardadas = [...sh2.m.values()];
ok('el precache no guarda respuestas redirigidas',
   guardadas.length > 0 && guardadas.every(r => !r.redirected),
   guardadas.filter(r=>r.redirected).length + ' de ' + guardadas.length + ' marcadas');

const nav = await pedir(ORIGEN+'/es/benchmark.html','navigate');
ok('la navegacion no devuelve una respuesta redirigida',
   nav !== 'PASA_DE_LARGO' && !nav.redirected, 'redirected=' + (nav && nav.redirected));

/* Y el refresco por detras, que es el que RE-envenena: aunque se suba la
   version y se tire el cache viejo, la primera visita volveria a guardar la
   respuesta marcada si no se limpiara tambien aqui. */
const sh3 = almacen.get([...almacen.keys()].find(k=>k.startsWith('shell-')));
ok('el refresco por detras tampoco guarda la marca',
   [...sh3.m.values()].every(r => !r.redirected));
entorno.REDIRIGE = false;

let fallos=0;
for (const [e,n,d] of prueba){ if(e==='FALLA') fallos++; console.log(`${e==='PASA'?'  ok':'FALLA'}  ${n}${d?'  ('+d+')':''}`); }
console.log(fallos ? `\n${fallos} FALLOS` : `\n${prueba.length}/${prueba.length} en verde`);
process.exit(fallos?1:0);
