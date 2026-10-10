// preceptoros.org · theGame v1.5 · casos del GACHA, el ARMY y la SINTESIS.
//
//     node atlas/gacha_casos.mjs     # imprime [{caso, ok, detalle}, ...]
//
// Los ejecuta `test_web.py` (la directiva v1.5 pide sus pruebas alli). Como
// los otros corredores: deterministas y diciendo por que fallan. Los dos que
// mas importan: una tropa NO entra en el Army con una firma falsa ni con la
// tropa tocada despues de firmar, y el piloto NO puede invocar.
import { createRequire } from 'node:module';
import { createHash, createPublicKey, generateKeyPairSync, sign, verify } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { verifica } from './verifica_partida.mjs';

const require = createRequire(import.meta.url);
const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const M = require(join(RAIZ, 'public/assets/atlas-motor.js'));
const P = require(join(RAIZ, 'public/assets/atlas-piloto.js'));
const G = require(join(RAIZ, 'public/game/gacha.js'));
const A = require(join(RAIZ, 'public/game/db.js'));
const S = require(join(RAIZ, 'public/game/core.js'));

const casos = [];
async function caso(nombre, f) {
  let ok = false, detalle = '';
  try { const r = await f(); ok = r === true; if (!ok) { detalle = JSON.stringify(r); } }
  catch (e) { detalle = e.message; }
  casos.push({ caso: nombre, ok, detalle });
}
const sha = (t) => createHash('sha256').update(String(t)).digest('hex');
const LEY = M.leyes({ pruebas_web: 171, arnes_sw: '24/24', gzip_juego_b: 95000 });

/* --- gacha ---------------------------------------------------------------- */
// 300 semillas y las cuatro TC: con una sola, un azar escondido puede
// coincidir por suerte (medido: el sabotaje con Math.random paso con una).
await caso('gacha: misma semilla, misma tropa (300 semillas x 4 TC)', () => {
  for (let i = 0; i < 300; i++) {
    const tc = 'tc' + (1 + i % 4), a = G.tirada(sha('a' + i), tc), b = G.tirada(sha('a' + i), tc);
    if (JSON.stringify(a) !== JSON.stringify(b)) { return i; }
  }
  return true;
});
await caso('gacha: semilla o TC invalidas -> error, nunca una tropa inventada', () => {
  let n = 0;
  for (const f of [() => G.tirada('xyz', 'tc1'), () => G.tirada(sha('a'), 'tc9')]) { try { f(); } catch (e) { n++; } }
  return n === 2 || n;
});
function reparto(tc, n) {
  const r = { normal: 0, magico: 0, raro: 0, unico: 0 };
  for (let i = 0; i < n; i++) { r[G.tirada(sha(tc + i), tc).rareza]++; }
  return r;
}
await caso('gacha: el reparto de rareza sigue la tabla de la TC (10 000 tiradas)', () => {
  const r = reparto('tc1', 10000), q = G.TCS.tc1.calidad;
  const cerca = (x, esperado) => Math.abs(x - esperado * 10) <= Math.max(25, esperado * 10 * 0.15);
  return (cerca(r.unico, q[0]) && cerca(r.raro, q[1]) && cerca(r.magico, q[2])) || r;
});
await caso('gacha: el Abismo da mejor loot que el Arrecife', () => {
  const a = reparto('tc1', 4000), b = reparto('tc4', 4000);
  return (b.unico > a.unico && b.raro > a.raro) || { tc1: a, tc4: b };
});
await caso('gacha: cada tropa cabe en menos de 200 B', () => {
  let peor = 0;
  for (let i = 0; i < 3000; i++) { peor = Math.max(peor, G.compacta(G.tirada(sha('b' + i), 'tc' + (1 + i % 4))).length); }
  return peor < 200 || peor;
});
await caso('gacha: la rareza pone la simetria (k = 1 mod s)', () => {
  const s = { normal: 2, magico: 3, raro: 5, unico: 7 };
  for (let i = 0; i < 400; i++) {
    const t = G.tirada(sha('c' + i), 'tc4');
    if (!t.armonicos.every((h) => (((h[0] - 1) % s[t.rareza]) + s[t.rareza]) % s[t.rareza] === 0)) { return t; }
  }
  return true;
});
await caso('gacha: unico = Atlante Legendario, con sus dos afijos', () => {
  for (let i = 0; i < 5000; i++) {
    const t = G.tirada(sha('d' + i), 'tc4');
    if (t.rareza === 'unico') { return (t.prefijo === 'atlante' && t.sufijo === 'abismo') || t; }
  }
  return 'ningun unico en 5000';
});
await caso('morfismo: mezcla(a, b, 0) es a y mezcla(a, b, 1) es b', () => {
  const t = G.tirada(sha('e'), 'tc3');
  const cero = G.mezcla(G.HUEVO, t.armonicos, 0), uno = G.mezcla(G.HUEVO, t.armonicos, 1);
  const p = (arm) => G.punto(arm, 1.234).map((x) => x.toFixed(9)).join();
  return (p(cero) === p(G.HUEVO) && p(uno) === p(t.armonicos)) || { cero: p(cero), huevo: p(G.HUEVO) };
});

/* --- motor: invocar -------------------------------------------------------- */
await caso('motor: invocar sin recursos -> fallo y nada cambia', () => {
  const e = M.inicial(LEY), d = M.invocar(e, G.TCS.tc1.coste);
  return (d.cobre === e.cobre && d.eventos.at(-1).tipo === 'invocar' && d.eventos.at(-1).resultado === 'fallo') || d.eventos.at(-1);
});
await caso('motor: invocar con recursos -> paga Cobre y Luz', () => {
  const e = M.inicial(LEY); e.cobre = 700; e.luz = 400;
  const d = M.invocar(e, G.TCS.tc3.coste);
  return (d.cobre === 100 && d.luz === 100 && d.eventos.at(-1).resultado === 'ok') || { cobre: d.cobre, luz: d.luz };
});
await caso('motor: coste invalido -> error, nunca un gasto raro', () => {
  try { M.invocar(M.inicial(LEY), { cobre: -1, luz: 0 }); return 'paso'; } catch (e) { return true; }
});
await caso('piloto: no puede invocar (fuera del enum)', () =>
  !P.valida({ esquema: 'atlas.accion/1', accion: 'invocar', origen: 'piloto_base' }));

/* --- partida con invocacion: se graba, se reproduce y se verifica ---------- */
const { publicKey, privateKey } = generateKeyPairSync('ed25519');
const pub = publicKey.export({ format: 'der', type: 'spki' }).subarray(12).toString('hex');
const firmaDe = (texto, clave = privateKey) => 'ed25519:' + sign(null, Buffer.from(texto), clave).toString('hex');
await caso('partida: una invocacion se graba y la partida verifica', () => {
  const w = {}; vm.createContext(w);
  vm.runInContext(readFileSync(join(RAIZ, 'public/assets/atlas-motor.js'), 'utf8'), w);
  vm.runInContext(readFileSync(join(RAIZ, 'public/assets/atlas-partida.js'), 'utf8'), w);
  let E = w.AtlasMotor.inicial(LEY);
  for (let i = 0; i < 200; i++) { E = w.AtlasMotor.ciclo(E, LEY); }
  E = w.AtlasMotor.invocar(E, G.TCS.tc1.coste);
  for (let i = 0; i < 5; i++) { E = w.AtlasMotor.ciclo(E, LEY); }
  const p = w.AtlasPartida.partida(E, w.AtlasMotor);
  const inv = p.pasos.find((s) => s.accion === 'invocar');
  const r = verifica({ esquema: 'atlas.partida.firmada/1', partida: p, algoritmo: 'Ed25519',
    firma: firmaDe(JSON.stringify(p)), pseudonimo: 'caso', clave_publica: pub });
  return (inv && inv.coste.cobre === 50 && inv.origen === 'humano' && r.ok) || { inv, r };
});

/* --- army: sin firma verificada no entra nada ------------------------------- */
function verificaNode(texto, firmaHex, claveHex) {
  const k = createPublicKey({ key: Buffer.concat([Buffer.from('302a300506032b6570032100', 'hex'), Buffer.from(claveHex, 'hex')]), format: 'der', type: 'spki' });
  return verify(null, Buffer.from(texto), k, Buffer.from(firmaHex, 'hex'));
}
const tropa = G.tirada(sha('army'), 'tc2');
await caso('army: con firma verificada, entra', async () => {
  const army = A.crea(verificaNode), ad = A.adopcion(tropa, 'caso', pub);
  const u = await army.adopta(ad, firmaDe(JSON.stringify(ad)));
  return (army.lista().length === 1 && u.adopcion.tropa.semilla === tropa.semilla) || army.lista();
});
async function rechazo(f) { try { await f(); return 'entro'; } catch (e) { return e.message; } }
await caso('army: sin firma -> fuera', async () => {
  const army = A.crea(verificaNode);
  const m = await rechazo(() => army.adopta(A.adopcion(tropa, 'caso', pub), undefined));
  return (m === 'sin firma' && army.lista().length === 0) || m;
});
await caso('army: firma de OTRA clave -> fuera (no basta con que haya firma)', async () => {
  const otra = generateKeyPairSync('ed25519').privateKey, army = A.crea(verificaNode);
  const ad = A.adopcion(tropa, 'caso', pub);
  const m = await rechazo(() => army.adopta(ad, firmaDe(JSON.stringify(ad), otra)));
  return (m === 'firma: no verifica' && army.lista().length === 0) || m;
});
await caso('army: tropa tocada despues de firmar -> fuera', async () => {
  const army = A.crea(verificaNode), ad = A.adopcion(JSON.parse(JSON.stringify(tropa)), 'caso', pub);
  const f = firmaDe(JSON.stringify(ad)); ad.tropa.rareza = 'unico';
  const m = await rechazo(() => army.adopta(ad, f));
  return (m === 'firma: no verifica' && army.lista().length === 0) || m;
});
await caso('army: la misma tropa no entra dos veces', async () => {
  const army = A.crea(verificaNode), ad = A.adopcion(tropa, 'caso', pub), f = firmaDe(JSON.stringify(ad));
  await army.adopta(ad, f);
  const m = await rechazo(() => army.adopta(ad, f));
  return (m === 'ya adoptada' && army.lista().length === 1) || m;
});

/* --- sintesis --------------------------------------------------------------- */
await caso('sintesis: receta determinista y sin ficheros', () =>
  JSON.stringify(S.receta('pop', 0.3)) === JSON.stringify(S.receta('pop', 0.3)) && S.receta('mp3', 0) === null);
await caso('sintesis: el calor del Nucleo hace el sonido mas grave y aspero', () => {
  const f = S.receta('eclosion', 0), c = S.receta('eclosion', 1);
  return (c.portadora < f.portadora && c.indice > f.indice) || { frio: f, caliente: c };
});
await caso('sintesis: el calor sale de la instantanea (presion del Nucleo), no se inventa', () =>
  S.calorDe({ integridad: 50, integridad_max: 100 }) === 0.5 && S.calorDe(null) === 0);

// M17-bis (firma F-A, 2026-10-10): el color dice vida (H) y escudo (L); el pulso del golpe sigue la
// MISMA curva que el sonido del golpe. Se carga wave_render.js en un contexto sin DOM (no dibuja).
const ONDA = (() => {
  const V = require(join(RAIZ, 'public/game/valores.js'));
  const ctx = { AtlasValores: V, AtlasGacha: require(join(RAIZ, 'public/game/gacha.js')), Math };
  vm.runInNewContext(readFileSync(join(RAIZ, 'public/game/wave_render.js'), 'utf-8'), ctx);
  return { O: ctx.AtlasOnda, V };
})();
await caso('M17-bis 2: L sale del escudo, no de la vida', () => {
  const { O } = ONDA;
  const sana = O.colorVida(1, null, 24), herida = O.colorVida(0.2, null, 24), sinEscudo = O.colorVida(1, null, 2);
  return (sana[2] === herida[2] && sana[0] !== herida[0] && sinEscudo[2] < sana[2]) ||
    { sana, herida, sinEscudo };
});
await caso('M17-bis 2: el escudo medido mas alto (24) da la L maxima', () => {
  const { O, V } = ONDA;
  return O.colorVida(1, null, 24)[2] === V.fluidez.escudo_lightness_base || O.colorVida(1, null, 24);
});
await caso('M17-bis 1: el pulso del golpe dura lo que suena el pop y nace en pulso_brillo_max', () => {
  const { O, V } = ONDA, pop = V.sonidos.pop, max = V.fluidez.pulso_brillo_max;
  const ini = O.pulso(0), fin = O.pulso(pop.dur * 1000), medio = O.pulso(pop.dur * 500);
  return (Math.abs(ini - max) < 1e-12 && fin === 0 && medio > 0 && medio < ini) || { ini, medio, fin };
});
await caso('M17-bis 1: coherencia, la curva visual es la rampa de ganancia del sonido', () => {
  const { O, V } = ONDA, pop = V.sonidos.pop, max = V.fluidez.pulso_brillo_max, t = pop.dur * 1000 * 0.37;
  const sonido = pop.gan * Math.pow(0.0001 / pop.gan, 0.37);
  return Math.abs(O.pulso(t) / max - sonido / pop.gan) < 1e-12 || { visual: O.pulso(t) / max, sonido: sonido / pop.gan };
});

// M17-bis 5: una fila de la tabla semantica por cada parametro visual y sonoro, y el lector existe.
await caso('M17-bis 5: cada clave de fluidez y de las recetas tiene su fila semantica', () => {
  const { V } = ONDA, tabla = V.semantica || {};
  const claves = Object.keys(V.fluidez).concat(Object.keys(V.sonidos.pop), Object.keys(V.sintesis));
  const faltan = claves.filter((k) => !tabla[k]);
  const sobran = Object.keys(tabla).filter((k) => !claves.includes(k));
  return (!faltan.length && !sobran.length) || { faltan, sobran };
});
await caso('M17-bis 5: el lector nombrado lee de verdad su parametro', () => {
  const { V } = ONDA, mal = [];
  Object.entries(V.semantica).forEach(([k, [, , clase, lector]]) => {
    if (clase === 'SIN_LECTOR') { return; }
    const t = readFileSync(join(RAIZ, 'public/game', lector), 'utf-8');
    const lee = lector === 'core.js' ? /\b[br]\.(f|m|indice|dur|gan)\b/.test(t) && t.includes(k) : t.includes(k);
    if (!lee) { mal.push(k + ' -> ' + lector); }
  });
  return !mal.length || mal;
});
await caso('M17-bis 5: el lector declara el objeto del que lee (F sin declarar rompio el MAP)', () => {
  const { V } = ONDA, mal = [];
  Object.entries(V.semantica).forEach(([k, [, , clase, lector]]) => {
    if (clase === 'SIN_LECTOR' || lector === 'core.js') { return; }
    const t = readFileSync(join(RAIZ, 'public/game', lector), 'utf-8');
    for (const m of t.matchAll(new RegExp('\\b([A-Za-z_$][\\w$]*)\\.' + k + '\\b', 'g'))) {
      if (!new RegExp('(^|[\\s,(;])' + m[1].replace('$', '\\$') + '\\s*=[^=]', 'm').test(t)) { mal.push(k + ' -> ' + lector + ' lee ' + m[1] + ' sin declararlo'); }
    }
  });
  return !mal.length || [...new Set(mal)];
});
await caso('M17-bis 5: la deuda SIN_LECTOR es exactamente la medida (nadie mas la lee)', () => {
  const { V } = ONDA;
  const deuda = Object.entries(V.semantica).filter(([, f]) => f[2] === 'SIN_LECTOR').map(([k]) => k).sort();
  const fuentes = ['wave_render.js', 'escena.js', 'mar.js', 'home_base_scene.js', 'summon_reveal.js', 'battle_replay.js']
    .map((f) => readFileSync(join(RAIZ, 'public/game', f), 'utf-8')).join('\n');
  const leidos = deuda.filter((k) => fuentes.includes(k));
  return (!leidos.length && deuda.length === 7) || { deuda, leidos_aunque_dice_sin_lector: leidos };
});

// M17-bis 3 (EN_CURSO_hasta_escucha): ADSR + FM de tres senos detras de valores.sintesis.modo.
function cargaSintesis(modo) {
  const V = JSON.parse(JSON.stringify(require(join(RAIZ, 'public/game/valores.js'))));
  V.sintesis.modo = modo;
  const conexiones = [];
  class Nodo { constructor(n) { this.n = n; this.frequency = { value: 0, n: n + '.frequency' };
    this.gain = { value: 0, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} }; }
    connect(d) { conexiones.push([this.n, d.n || d]); } start() {} stop() {} }
  let k = 0;
  class Ctx { constructor() { this.currentTime = 0; this.destination = 'destino'; this.state = 'running'; }
    createOscillator() { return new Nodo('osc' + (k++)); } createGain() { return new Nodo('gan' + (k++)); } }
  const ctx = { AtlasValores: V, AudioContext: Ctx, Math };
  vm.runInNewContext(readFileSync(join(RAIZ, 'public/game/core.js'), 'utf-8'), ctx);
  ctx.AtlasGacha = require(join(RAIZ, 'public/game/gacha.js'));
  vm.runInNewContext(readFileSync(join(RAIZ, 'public/game/wave_render.js'), 'utf-8'), ctx);
  return { S: ctx.AtlasSintesis, O: ctx.AtlasOnda, V, conexiones };
}
await caso('M17-bis 3: en modo fm2 (el de siempre) la receta y la envolvente no cambian', () => {
  const { S } = cargaSintesis('fm2'), r = S.receta('pop', 0);
  const exp = r.gan * Math.pow(0.0001 / r.gan, 0.4);
  return (!r.adsr && !r.moduladora2 && Math.abs(S.envolvente(r, r.dur * 0.4) - exp) < 1e-12) || r;
});
await caso('M17-bis 3: en modo fm3_adsr la envolvente es ataque-caida-sostenido-relajacion', () => {
  const { S } = cargaSintesis('fm3_adsr'), r = S.receta('pop', 0), [a, d, s] = r.adsr;
  const e0 = S.envolvente(r, 0), ea = S.envolvente(r, a), es = S.envolvente(r, a + d + 0.001), efin = S.envolvente(r, r.dur);
  return (e0 === 0 && Math.abs(ea - r.gan) < 1e-12 && Math.abs(es - r.gan * s) < 1e-12 && efin === 0) || { e0, ea, es, efin };
});
await caso('M17-bis 3: las DOS moduladoras quedan conectadas a la portadora (la joya rota, reparada)', () => {
  const { S, conexiones } = cargaSintesis('fm3_adsr');
  S.activa(true); S.suena('pop', 0);
  const a_frecuencia = conexiones.filter(([, d]) => String(d).endsWith('.frequency'));
  return a_frecuencia.length === 2 || conexiones;
});
await caso('M17-bis 3: coherencia en fm3_adsr, el pulso del golpe es la envolvente del sonido', () => {
  const { S, O, V } = cargaSintesis('fm3_adsr'), r = S.receta('pop', 0), max = V.fluidez.pulso_brillo_max;
  const ts = [0, 0.002, 0.01, 0.05, 0.1];
  const mal = ts.filter((t) => Math.abs(O.pulso(t * 1000) - max * S.envolvente(r, t) / r.gan) > 1e-12);
  return !mal.length || mal;
});

// M17-bis 4: lo que espera firma vibra; lo firmado suena quieto. La urgencia sale del sello.
await caso('M17-bis 4: la eclosion (espera firma) vibra; la adopcion (firmada) y el golpe no', () => {
  const { S } = cargaSintesis('fm2'), e = S.receta('eclosion', 0), a = S.receta('adopcion', 0), p = S.receta('pop', 0);
  return (e.vibrato && e.vibrato.prof > 0 && !a.vibrato && !p.vibrato) || { e: e.vibrato, a: a.vibrato, p: p.vibrato };
});
await caso('M17-bis 4: el vibrato llega de verdad a la portadora solo cuando hay urgencia', () => {
  const uno = cargaSintesis('fm2'); uno.S.activa(true); uno.S.suena('eclosion', 0);
  const dos = cargaSintesis('fm2'); dos.S.activa(true); dos.S.suena('adopcion', 0);
  const n = (c) => c.conexiones.filter(([, d]) => String(d).endsWith('.frequency')).length;
  return (n(uno) === 2 && n(dos) === 1) || { eclosion: uno.conexiones, adopcion: dos.conexiones };
});

process.stdout.write(JSON.stringify(casos));
