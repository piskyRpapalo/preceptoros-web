// [W] O1a (2026-10-27) · the wave duel scene, judged in node. The real modules run in a vm with a canvas that RECORDS every
// drawing call; the draw list is hashed. Each case runs on the real source (must be green) and on a sabotaged twin (must
// be red). The fight comes from the real engine (combate_ticks) on seeded troops.
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { runInNewContext } from 'node:vm';

const leer = (r) => readFileSync(new URL('../public/' + r, import.meta.url), 'utf8');
const BASE = ['game/tabla_semantica.js', 'game/comic_tokens.js', 'game/valores.js', 'game/gacha.js', 'assets/atlas-coord.js', 'game/canon.js',
  'game/taller.js', 'game/combate_ticks.js', 'game/wave_render.js', 'game/escuadron.js', 'game/escena.js'];
const DUELO = leer('game/wave_duel_scene.js');

function lienzo(w) {
  const lista = [], r = (v) => (typeof v === 'number' ? Math.round(v * 100) / 100 : typeof v === 'string' ? v : typeof v);
  const ctx = new Proxy({}, {
    get: (o, k) => (k in o ? o[k] : (...a) => { lista.push(k + '(' + a.map(r).join(',') + ')'); if (k === 'measureText') { return { width: 10 }; } }),
    set: (o, k, v) => { lista.push(k + '=' + r(v)); o[k] = v; return true; } });
  const atributos = {};
  return { lista, atributos, el: { clientWidth: w, width: 0, height: 0, style: {}, offsetParent: {}, getContext: () => ctx,
    setAttribute: (k, v) => { atributos[k] = v; } } };
}
function monta(fuente) {
  const cola = [], doc = { hidden: false, createElement: () => lienzo(10).el, documentElement: { lang: 'en' } };
  const g = { console, document: doc, devicePixelRatio: 1, requestAnimationFrame: (cb) => { cola.push(cb); return cola.length; },
    cancelAnimationFrame: () => {}, matchMedia: () => ({ matches: false }) };
  g.window = g; g.globalThis = g;
  for (const f of BASE) { runInNewContext(leer(f), g, { filename: f }); }
  if (fuente) { runInNewContext(fuente, g, { filename: 'wave_duel_scene.js' }); }
  return { g, cola };
}
function pelea(g, n) {
  const K = g.AtlasCanon, tropas = (p, k) => Array.from({ length: k }, (_, i) => ({ tc: 'tc1', semilla: K.sha(p + i) }));
  const def = tropas('w-def-' + n + '-', 2), asa = tropas('w-asa-' + n + '-', 3), semilla = K.sha('w-semilla-' + n);
  return { def, asa, semilla, c: g.AtlasCombateTicks.combate(def, asa, semilla) };
}
// Plays `cuadros` frames 16 ms apart (or with `paso`) and returns the hash of the draw list plus what the canvas said.
function juega(fuente, n, op, cuadros = 120, paso = 16) {
  const { g, cola } = monta(fuente), p = pelea(g, n), L = lienzo(800);
  const s = g.AtlasEscena.escena(L.el, p.def, p.asa, p.c, Object.assign({ semilla: p.semilla, ronda: 'Round {r}', colores: {} }, op || {}));
  for (let i = 0, ts = 0; i < cuadros && cola.length; i++) { ts += paso; cola.shift()(ts); }
  return { s, L, hash: createHash('sha256').update(L.lista.join('\n')).digest('hex').slice(0, 16), g };
}

const casos = [];
function caso(nombre, prueba, sab) {
  let real, rojo;
  try { real = prueba(DUELO); } catch (e) { real = 'error: ' + e.message; }
  try { rojo = prueba(sab); } catch (e) { rojo = 'error: ' + e.message; }
  casos.push({ caso: nombre, ok: real === 'OK' && rojo !== 'OK', detalle: real + ' | sab ' + (rojo !== 'OK' ? 'ROJO' : 'VERDE?!') });
}

caso('same contract as AtlasReplay: velocidad, salta, otra, para', (src) => {
  const k = Object.keys(juega(src, 1, {}, 2).s).sort().join();
  return k === 'otra,para,salta,velocidad' ? 'OK' : 'contract: ' + k;
}, DUELO.replace('      otra: reinicia,\n', ''));

caso('determinism: the same fight and seed draw the identical list', (src) => {
  const a = juega(src, 1).hash, b = juega(src, 1).hash;
  return a === b ? 'OK' : 'two runs differ: ' + a + ' ' + b;
}, DUELO.replace("var s = (parseInt(String(semilla || '0').slice(0, 8), 16) >>> 0) || 0x9e3779b9", "var s = (Math.floor(Math.random() * 4294967296) >>> 0) || 1"));

caso('anti-slop: two different fights never draw the same list', (src) => {
  const a = juega(src, 1).hash, b = juega(src, src === DUELO ? 2 : 1).hash;
  return a !== b ? 'OK' : 'two fights drew the same list';
}, 'SLOP');

caso('jewel 1: terms per seal come from the table (NO_DATA 1 · SIMULATED 2 · STALE 2 · PROPUESTA 4 · ERROR 4 · FIRMADO 5)', (src) => {
  const T = monta(src).g.AtlasWaveDuel.TERMINOS, want = { LIVE: null, PROPUESTA: 4, FIRMADO: 5, ERROR: 4, NO_DATA: 1, SIMULATED: 2, STALE: 2 };
  return JSON.stringify(T) === JSON.stringify(want) ? 'OK' : 'table: ' + JSON.stringify(T);
}, DUELO.replace('SIMULATED: 2, STALE: 2 }', 'SIMULATED: 3, STALE: 2 }'));

caso('jewel 1+4: an emulated side rings in its seal hue from AtlasSemantica, never a literal', (src) => {
  const r = juega(src, 1, { emulado: 0 }, 200), hue = r.g.AtlasSemantica.de('SIMULATED').bandas.base, vivo = r.g.AtlasSemantica.de('LIVE').bandas.base;
  const anillos = r.L.lista.filter((x) => x === 'strokeStyle=' + hue).length, rojos = r.L.lista.filter((x) => x === 'strokeStyle=' + vivo).length;
  return anillos > 0 && rojos > 0 ? 'OK' : 'seal hues on the rings: SIMULATED ' + anillos + ' · LIVE ' + rojos;
}, DUELO.replace("return d ? d.bandas.base : texto;", "return texto;"));

caso('jewel 4: each hit draws a ring and 12 radials', (src) => {
  const l = juega(src, 1, {}, 200).L.lista, i = l.findIndex((x) => x.startsWith('arc('));
  const radiales = i < 0 ? 0 : l.slice(i, i + 40).filter((x) => x.startsWith('moveTo(')).length;
  return radiales >= 12 ? 'OK' : 'radials after the first ring: ' + radiales;
}, DUELO.replace('for (var i = 0; i < 12; i++) {', 'for (var i = 0; i < 0; i++) {'));

caso('v1.1 layout: five sea lines and one life bar per troop on every frame', (src) => {
  const l = juega(src, 1, {}, 1).L.lista, lineas = l.filter((x) => x === 'stroke()').length, barras = l.filter((x) => x.startsWith('fillRect(')).length;
  return lineas >= 5 && barras >= 10 ? 'OK' : 'sea lines ' + lineas + ' · bar rects ' + barras;
}, DUELO.replace('        if (m === 1) { barra(u); }\n', ''));

caso('prefers-reduced-motion: still frames, independent of the clock', (src) => {
  const a = juega(src, 1, { quieto: true }, 3, 16).hash, b = juega(src, 1, { quieto: true }, 3, 997).hash;
  return a === b ? 'OK' : 'reduced motion moved with the clock';
}, DUELO.replace("var col = op.colores || {}, quieto = !!op.quieto", "var col = op.colores || {}, quieto = false"));

caso('the screen reader reads the fight as text: round, alive troops, harmonics and seals', (src) => {
  const a = juega(src, 1, { emulado: 0 }, 200).L.atributos;
  return a.role === 'img' && /Round \d+ · left \d\/3 · right \d\/2 alive · [\d/]+ harmonics · .*EMULADO/.test(a['aria-label'] || '') ? 'OK' : 'aria-label: ' + a['aria-label'];
}, DUELO.replace('      anuncia();\n', ''));

caso('pure: no system randomness, clock with authority, network or raw colour in the module', (src) => {
  const malo = /Math\.random|Date\.now|fetch\(|hsla?\(|rgba?\(|#[0-9a-fA-F]{3,6}\b/.exec(src);
  return malo ? 'found: ' + malo[0] : 'OK';
}, DUELO + '\nvar x = Math.random();');

// Without the wave duel, escena.js answers with an inert scene (the old fallback threw on every frame).
caso('escena.js without the wave duel: an inert scene, never a throw', (src) => {
  const { g } = monta(src), p = pelea(g, 1), s = g.AtlasEscena.escena(lienzo(800).el, p.def, p.asa, p.c, {});
  return src === null && Object.keys(s).sort().join() === 'otra,para,salta,velocidad' && !g.AtlasWaveDuel ? 'OK' : 'escena() without module: ' + Object.keys(s).join();
}, DUELO);
casos[casos.length - 1] = (() => { // this case judges escena.js alone: the real run has NO module, the twin loads it.
  const sin = (() => { try { const { g } = monta(null), p = pelea(g, 1), s = g.AtlasEscena.escena(lienzo(800).el, p.def, p.asa, p.c, {}); s.salta(); s.para();
    return Object.keys(s).sort().join() === 'otra,para,salta,velocidad' && !g.AtlasWaveDuel ? 'OK' : 'keys'; } catch (e) { return 'threw: ' + e.message; } })();
  const con = (() => { const { g } = monta(DUELO); return g.AtlasWaveDuel ? 'module present' : 'OK'; })();
  return { caso: 'escena.js without the wave duel: an inert scene, never a throw', ok: sin === 'OK' && con !== 'OK', detalle: sin + ' | sab ' + (con !== 'OK' ? 'ROJO' : 'VERDE?!') };
})();

// [W] O1b: LIVE fights (practice, worlds) grow their log tick by tick; the scene ends only once a winner exists.
caso('live mode: a growing fight does not end before its winner, and ends after it', (src) => {
  const { g, cola } = monta(src), p = pelea(g, 1), L = lienzo(800), todo = p.c.registro, vivo = { registro: todo.slice(0, 3), gana: null };
  let fin = 0;
  g.AtlasEscena.escena(L.el, p.def, p.asa, vivo, { semilla: p.semilla, vivo: true, alFin: () => { fin++; } });
  const corre = (n) => { for (let i = 0, ts = 0; i < n && cola.length; i++) { ts += 16; cola.shift()(ts); } };
  corre(400);
  if (fin) { return 'ended before the winner'; }
  vivo.registro = todo; vivo.gana = p.c.gana; corre(4000);
  return fin === 1 ? 'OK' : 'did not end after the winner (' + fin + ')';
}, DUELO.replace('(!op.vivo || combate.gana != null) && ', '').replace('if (op.vivo && combate.gana == null) { vt = Math.min(vt, ev.length * EV + EV * 0.99); }', ''));

// [W] O2 (2026-10-27) · the duel's voice (core.js). A fake AudioContext records every oscillator: frequency and start time.
const CORE = leer('game/core.js');
function oido(core, duelo) {
  const sonidos = [], g = monta(null).g;
  class Nodo { constructor(n) { this.n = n; this.frequency = { value: 0, n: n + '.f' }; this.gain = { value: 0, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} }; }
    connect() {} start(t) { if (this.n === 'osc') { sonidos.push({ f: this.frequency.value, t }); } } stop() {} }
  g.AudioContext = class { constructor() { this.currentTime = 0; this.destination = {}; this.state = 'running'; } createOscillator() { return new Nodo('osc'); } createGain() { return new Nodo('gain'); } };
  runInNewContext(core, g, { filename: 'core.js' });
  if (duelo) { runInNewContext(duelo, g, { filename: 'wave_duel_scene.js' }); }
  g.AtlasSintesis.activa(true);
  return { g, S: g.AtlasSintesis, sonidos };
}
function caso2(nombre, prueba, sabCore, sabDuelo) {
  let real, rojo;
  try { real = prueba(CORE, DUELO); } catch (e) { real = 'error: ' + e.message; }
  try { rojo = prueba(sabCore || CORE, sabDuelo || DUELO); } catch (e) { rojo = 'error: ' + e.message; }
  casos.push({ caso: nombre, ok: real === 'OK' && rojo !== 'OK', detalle: real + ' | sab ' + (rojo !== 'OK' ? 'ROJO' : 'VERDE?!') });
}
caso2('O2 jewel 3: a hit sounds at its seal pitch, f = 220 + hue/360*660 from the table (LIVE 440 · SIMULATED 275)', (core) => {
  const { S, g, sonidos } = oido(core), V = g.AtlasValores.sintesis.voz_hz, M = g.AtlasSemantica;
  S.suenaDuelo('golpe', 'LIVE', 0); S.suenaDuelo('golpe', 'SIMULATED', 0);
  const want = ['LIVE', 'SIMULATED'].map((x) => Math.round(V[0] + M.hueDe(x) / 360 * (V[1] - V[0])));
  const car = sonidos.filter((_, i) => i % 2 === 0).map((x) => x.f);
  return JSON.stringify(car) === JSON.stringify(want) && want.join() === '440,275' ? 'OK' : 'carriers ' + car + ' want ' + want;
}, CORE.replace('return h == null ? r : afina(', 'return h == null || 1 ? r : afina('));
caso2('O2 jewel 3: the timbre is kept (modulator / carrier ratio of the event recipe)', (core) => {
  const { S } = oido(core), base = S.receta('pop', 0), r = S.duelo('golpe', 'STALE', 0);
  return Math.abs(r.moduladora / r.portadora - base.moduladora / base.portadora) < 0.01 && r.portadora === 330 ? 'OK' : JSON.stringify(r);
}, CORE.replace('r.moduladora = Math.round(r.moduladora * k);', ''));
caso2('O2 honest sensor: a NO_DATA hit is silence', (core) => {
  const { S, sonidos } = oido(core); S.suenaDuelo('golpe', 'NO_DATA', 0);
  return sonidos.length === 0 ? 'OK' : 'NO_DATA sounded: ' + sonidos.length;
}, CORE.replace("if (sello === 'NO_DATA' || !DUELO[tipo]) { return null; }", 'if (!DUELO[tipo]) { return null; }'));
caso2('O2 jewel 5: a win resolves in a 4:5:6 chord, voices 0.1 s apart, still (no vibrato: what is signed sounds still)', (core) => {
  const { S, sonidos } = oido(core), r = S.duelo('gana', null, 0); S.suenaDuelo('gana', null, 0);
  const car = sonidos.filter((_, i) => i % 2 === 0), f0 = car[0] && car[0].f;
  const ok = car.length === 3 && car.every((x, i) => Math.abs(x.f / f0 - [1, 1.25, 1.5][i]) < 0.01 && Math.abs(x.t - i * 0.1) < 1e-9) && r.every((x) => !x.vibrato);
  return ok ? 'OK' : JSON.stringify(car);
}, CORE.replace('var t = ctx.currentTime + (r.retardo || 0);', 'var t = ctx.currentTime;'));
caso2('O2 wiring: the scene hands the hitter seal to its host on every hit (LIVE and SIMULATED in an emulated fight)', (core, duelo) => {
  const oye = [], { g } = oido(core, duelo), p = pelea(g, 1), L = lienzo(800), cola = [];
  g.requestAnimationFrame = (cb) => { cola.push(cb); return cola.length; };
  g.AtlasWaveDuel.escena(L.el, p.def, p.asa, p.c, { semilla: p.semilla, emulado: 0, sonido: (tipo, t, sello) => oye.push(tipo + ':' + sello) });
  for (let i = 0, ts = 0; i < 400 && cola.length; i++) { ts += 16; cola.shift()(ts); }
  const sellos = new Set(oye.filter((x) => /^(golpe|cae):/.test(x)).map((x) => x.split(':')[1]));
  return sellos.has('LIVE') && sellos.has('SIMULATED') ? 'OK' : 'heard ' + [...sellos];
}, null, DUELO.replace("op.sonido(t.vida ? 'golpe' : 'cae', a.t, sello);", "op.sonido(t.vida ? 'golpe' : 'cae', a.t);"));
{ // O2 D5: a pin on the Sovereign's pending listening (M17BIS_ESCUCHA_AB, EN_CURSO_hasta_escucha); the twin flips the mode.
  const VAL = leer('game/valores.js'), modo = (src) => { const g = {}; runInNewContext(src, g); return g.AtlasValores.sintesis.modo === 'fm2' ? 'OK' : 'modo ' + g.AtlasValores.sintesis.modo; };
  const real = modo(VAL), rojo = modo(VAL.replace("modo: 'fm2'", "modo: 'fm3_adsr'"));
  casos.push({ caso: 'O2 D5: the default stays fm2 until the Sovereign listens (nothing changes by ear meanwhile)', ok: real === 'OK' && rojo !== 'OK', detalle: real + ' | sab ' + (rojo !== 'OK' ? 'ROJO' : 'VERDE?!') });
}
caso2('O2 pure voice: no Date.now, no Math.random, no network in core.js', (core) => {
  const malo = /Date\.now|Math\.random|fetch\(|XMLHttpRequest/.exec(core);
  return malo ? 'found: ' + malo[0] : 'OK';
}, CORE + '\nvar id = Date.now();');
// [W] O3 (2026-10-27) · the ring is the f(t) of its hit's sound. core.js is loaded (receta + envolvente); a value is changed
// after load and the draw list must change with it. The twin cuts the reader, so the change goes unseen (red).
function juegaO3(src, muta, cuadros = 400) {
  const cola = [], doc = { hidden: false, createElement: () => lienzo(10).el, documentElement: { lang: 'en' } };
  const g = { console, document: doc, devicePixelRatio: 1, requestAnimationFrame: (cb) => { cola.push(cb); return cola.length; },
    cancelAnimationFrame: () => {}, matchMedia: () => ({ matches: false }) };
  g.window = g; g.globalThis = g;
  for (const f of BASE) { runInNewContext(leer(f), g, { filename: f }); if (f === 'game/gacha.js') { runInNewContext(leer('game/core.js'), g, { filename: 'core.js' }); } }
  runInNewContext(src, g, { filename: 'wave_duel_scene.js' });
  muta(g.AtlasValores);
  const p = pelea(g, 1), L = lienzo(800);
  g.AtlasEscena.escena(L.el, p.def, p.asa, p.c, { semilla: p.semilla, ronda: 'Round {r}', colores: {} });
  for (let i = 0, ts = 0; i < cuadros && cola.length; i++) { ts += 16; cola.shift()(ts); }
  return createHash('sha256').update(L.lista.join('\n')).digest('hex').slice(0, 16);
}
caso('O3: the ring width follows the envelope of its own hit sound (pulso_grosor_max has a reader)', (src) => {
  const a = juegaO3(src, () => {}), b = juegaO3(src, (V) => { V.fluidez.pulso_grosor_max = 0; });
  return a !== b ? 'OK' : 'pulso_grosor_max changed nothing';
}, DUELO.replace('(1 + (F.pulso_grosor_max || 0) * e)', '(1 + 0 * e)'));
caso('O3: the ring beats at the pitch of the sound that is heard (the seal pitch range re-tuned, O2 voz_hz, moves the rings)', (src) => {
  const a = juegaO3(src, () => {}), b = juegaO3(src, (V) => { V.sintesis.voz_hz = [110, 1760]; });
  return a !== b ? 'OK' : 'the seal pitch changed nothing';
}, DUELO.replace('O.pulsoNota(n.portadora)', '4'));

console.log(JSON.stringify({ v: 'preceptoros.wave_duel/1', casos }, null, 1));
process.exitCode = casos.every((c) => c.ok) ? 0 : 1;
