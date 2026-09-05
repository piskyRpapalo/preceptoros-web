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
ok('precachea paginas y piezas del Hub', rutas.length === 97, rutas.length+' rutas');
ok('el shell trae las tres tiras de la cara',
   ['apertura', 'reposo', 'habla']
     .every(s => rutas.includes('/assets/caras/secuencia-' + s + '-256.webp')));
ok('el shell trae /fr/community.html', rutas.includes('/fr/community.html'));
ok('el shell trae hub.json', rutas.includes('/hub.json'));
// El catalogo de modelos viaja con el sitio igual que el de companeros: sin el,
// la app instalada abre y no sabe decir sobre que se entreno nada.
ok('el shell trae modelos.json', rutas.includes('/modelos.json'));
ok('el shell trae las cinco piezas del Hub',
   ['/assets/widget.css','/assets/panel.css','/assets/hub.js','/assets/hub-cola.js','/assets/chat-router.js']
     .every(r => rutas.includes(r)));
// Al reves que hasta el 2026-09-05: los ojos NO viajan. Los pintaba solo la
// portada de la raiz, que es ahora el despertar, y precachear arte que nadie
// mira son 48 KB en cada instalacion. Las esferas si viajan: esas se pintan en
// el panel de companeros.
ok('el shell NO trae los ojos, que no los pinta nadie',
   rutas.filter(r => r.startsWith('/assets/agente-ojo-')).length === 0);
ok('el shell trae las ocho esferas',
   rutas.filter(r => r.startsWith('/assets/agente-3d-')).length === 8);

// regla 1: otro origen
ok('otro origen pasa de largo',
   await pedir('https://esm.run/@mlc-ai/web-llm','no-cors') === 'PASA_DE_LARGO');
ok('la API del Agora pasa de largo',
   await pedir('https://api.preceptoros.org/api/v1/tasks','cors') === 'PASA_DE_LARGO');

// regla 2: una MEDIDA no se cachea; el CONTENIDO declarado si.
ok('counters.json no se cachea (es una medida)',
   await pedir(ORIGEN+'/counters.json','cors') === 'PASA_DE_LARGO');
ok('hub.json SI se sirve del cache (es contenido)',
   await pedir(ORIGEN+'/hub.json','cors') !== 'PASA_DE_LARGO');
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
const r1 = await pedir(ORIGEN+'/es/community.html','navigate');
ok('navegacion sale del shell aun sin red',
   r1 !== 'PASA_DE_LARGO' && r1.status === 200 && String(r1.cuerpo).includes('/es/community.html'),
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

let fallos=0;
for (const [e,n,d] of prueba){ if(e==='FALLA') fallos++; console.log(`${e==='PASA'?'  ok':'FALLA'}  ${n}${d?'  ('+d+')':''}`); }
console.log(fallos ? `\n${fallos} FALLOS` : `\n${prueba.length}/${prueba.length} en verde`);
process.exit(fallos?1:0);
