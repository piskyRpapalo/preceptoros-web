// atlas/descent_sound_casos.mjs · sonido procedural del fotograma de la lengua de burbuja (LOTE 6).
// Uso: node atlas/descent_sound_casos.mjs · rc 0 solo si todos los casos pasan. Node 22, ESM, sin dependencias.
import { readFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const req = createRequire(import.meta.url);
const ruta = (rel) => fileURLToPath(new URL(rel, import.meta.url));
const FUENTE = ruta('../public/game/descent_sound.js');
const SECCIONES = ['REFUGE', 'SUMMON', 'ARMY', 'BATTLE', 'RIFT'];
const PROHIBIDOS = [/Math\.random/, /\bDate\b/, /\bfetch\s*\(/, /localStorage/, /setTimeout/, /requestAnimationFrame/];
const COLOR = [/#[0-9a-fA-F]{3,8}\b/, /\brgba?\s*\(/, /\bhsla?\s*\(/];
const COMENTARIO = [/\/\//, /\/\*/];
const NUMERO_3 = /(?<![\w.])\d{3,}(\.\d+)?(?!\w)/g;
const casos = [];
const caso = (n, nombre, ok, medida) => casos.push(medida === undefined ? { caso: n, nombre, ok: !!ok } : { caso: n, nombre, ok: !!ok, medida });

function violaciones(texto) {
  const v = [];
  for (const re of PROHIBIDOS) if (re.test(texto)) v.push('prohibido ' + re.source);
  for (const re of COLOR) if (re.test(texto)) v.push('color ' + re.source);
  for (const re of COMENTARIO) if (re.test(texto)) v.push('comentario ' + re.source);
  const nums = texto.match(NUMERO_3);
  if (nums) v.push('literal numerico de 3+ cifras: ' + nums.join(' '));
  return v;
}

const causasCarga = [];
const cargar = (rel) => {
  const f = ruta(rel);
  if (!existsSync(f)) { causasCarga.push(rel + ' no existe'); return null; }
  try { return req(f); } catch (e) { causasCarga.push(rel + ' no carga: ' + e.message); return null; }
};
for (const rel of ['../public/game/tabla_semantica.js', '../public/game/comic_tokens.js', '../public/game/comic_accents.js',
  '../public/game/gacha.js', '../public/game/bubble_light.js', '../public/game/bubble_bestiary.js', '../public/game/bubble_world.js']) {
  cargar(rel);
}
const R = cargar('../public/game/aiact-art50-state-radio.js');
globalThis.AtlasBubble = cargar('../public/game/bubble_language.js') || undefined;
cargar('../public/game/bubble_game.js');
const S = cargar('../public/assets/codex_scene.js');

let DS = null, causaModulo = null;
if (existsSync(FUENTE)) {
  try { DS = req(FUENTE); } catch (e) { causaModulo = 'el modulo no carga: ' + e.message; }
} else causaModulo = 'public/game/descent_sound.js no existe todavia';
const causa = causaModulo || (causasCarga.length ? 'dependencias: ' + causasCarga.join('; ') : null);
const sinCausa = (n, nombre) => { if (causa) { caso(n, nombre, false, { causa }); return true; } return false; };

let fuente = null;
try { fuente = readFileSync(FUENTE, 'utf8'); } catch { fuente = null; }
const caso1Sobre = (texto) => texto !== null && Buffer.byteLength(texto) <= 16384 && violaciones(texto).length === 0;

caso(1, 'existe, <= 16384 B, sin comentarios, puro, sin colores ni literales de 3+ cifras (ni 110/220/440/880)',
  caso1Sobre(fuente), { bytes: fuente ? Buffer.byteLength(fuente) : null, violaciones: fuente ? violaciones(fuente) : ['no existe'] });

const framesDe = () => SECCIONES.map((id) => S.frame(id));

if (!sinCausa(2, 'determinismo: score de los 5 fotogramas dos veces, mismo JSON')) {
  const a = JSON.stringify(framesDe().map((f) => DS.score(f)));
  const b = JSON.stringify(framesDe().map((f) => DS.score(f)));
  caso(2, 'determinismo: score de los 5 fotogramas dos veces, mismo JSON', a === b, { bytes: a.length });
}

if (!sinCausa(3, 'cada hz es AtlasRadio.nota(grade, octave) de su voz')) {
  let total = 0, malas = [];
  for (const f of framesDe()) {
    for (const v of DS.score(f).voices) {
      if (v.src !== 'osc') continue;
      total++;
      if (v.hz !== R.nota(v.grade, v.octave)) malas.push(v.band + ':' + v.hz);
    }
  }
  caso(3, 'cada hz es AtlasRadio.nota(grade, octave) de su voz', total > 0 && malas.length === 0, { voces: total, malas });
}

if (!sinCausa(4, 'techos: gain <= 0.07, a >= 0.03, r >= 0.3, voces <= 6')) {
  let peor = { gain: 0, a: Infinity, r: Infinity, voces: 0 };
  let ok = true;
  for (const f of framesDe()) {
    const p = DS.score(f);
    peor.voces = Math.max(peor.voces, p.voices.length);
    if (p.voices.length > 6) ok = false;
    for (const v of p.voices) {
      peor.gain = Math.max(peor.gain, v.gain);
      peor.a = Math.min(peor.a, v.env.a);
      peor.r = Math.min(peor.r, v.env.r);
      if (!(v.gain <= 0.07 && v.env.a >= 0.03 && v.env.r >= 0.3)) ok = false;
    }
  }
  caso(4, 'techos: gain <= 0.07, a >= 0.03, r >= 0.3, voces <= 6', ok, peor);
}

if (!sinCausa(5, 'fotogramas distintos dan partituras distintas (al menos 4 de 5)')) {
  const distintas = new Set(framesDe().map((f) => JSON.stringify(DS.score(f)))).size;
  caso(5, 'fotogramas distintos dan partituras distintas (al menos 4 de 5)', distintas >= 4, { distintas });
}

if (!sinCausa(6, 'haptic: longitud par <= 6, suma <= 400, enteros >= 0, determinista')) {
  let ok = true;
  const patrones = [];
  for (const f of framesDe()) {
    const h = DS.haptic(f), h2 = DS.haptic(f);
    patrones.push(h);
    const suma = h.reduce((s, x) => s + x, 0);
    if (!Array.isArray(h) || h.length % 2 !== 0 || h.length > 6 || suma > 400) ok = false;
    if (!h.every((x) => Number.isInteger(x) && x >= 0)) ok = false;
    if (JSON.stringify(h) !== JSON.stringify(h2)) ok = false;
  }
  caso(6, 'haptic: longitud par <= 6, suma <= 400, enteros >= 0, determinista', ok, { patrones });
}

if (!sinCausa(7, 'play programa tantas voces como score devuelve (AudioContext falso)')) {
  const resultados = [];
  let ok = true;
  for (const id of SECCIONES) {
    const voces = DS.score(S.frame(id)).voices;
    const cuenta = { osc: 0, src: 0 };
    const param = () => ({ value: 0, setValueAtTime() {}, linearRampToValueAtTime() {}, setTargetAtTime() {} });
    const nodo = () => ({ connect() {} });
    const ctx = {
      currentTime: 0, sampleRate: 4.41e4, destination: {},
      createOscillator() { cuenta.osc++; return { ...nodo(), type: 'sine', frequency: param(), start() {}, stop() {} }; },
      createGain() { return { ...nodo(), gain: param() }; },
      createBuffer(canales, len) { return { getChannelData() { return new Float32Array(len); } }; },
      createBufferSource() { cuenta.src++; return { ...nodo(), buffer: null, start() {}, stop() {} }; },
    };
    const programadas = DS.play(ctx, voces, 0);
    const osc = voces.filter((v) => v.src === 'osc').length, noise = voces.length - osc;
    resultados.push({ id, voces: voces.length, programadas, osc: cuenta.osc, src: cuenta.src });
    if (programadas !== voces.length || cuenta.osc !== osc || cuenta.src !== noise) ok = false;
  }
  caso(7, 'play programa tantas voces como score devuelve (AudioContext falso)', ok, resultados);
}

if (!sinCausa(8, 'sabotaje: copia con Math.random insertado hace fallar el caso 1')) {
  const copia = fuente === null ? null : fuente.replace("'use strict';", "'use strict'; var sabotaje = Math.random();");
  const cambio = copia !== null && copia !== fuente;
  caso(8, 'sabotaje: copia con Math.random insertado hace fallar el caso 1', cambio && caso1Sobre(fuente) && !caso1Sobre(copia),
    { reemplazo: cambio, original_pasa: caso1Sobre(fuente), copia_pasa: caso1Sobre(copia), violaciones_copia: copia ? violaciones(copia) : null });
}

if (!sinCausa(9, 'describe: frase en ingles no vacia para los 5 fotogramas')) {
  const frases = SECCIONES.map((id) => DS.describe(DS.score(S.frame(id)).voices));
  const ok = frases.every((t) => typeof t === 'string' && t.length > 0 && /^[\x20-\x7e]+$/.test(t));
  caso(9, 'describe: frase en ingles no vacia para los 5 fotogramas', ok && typeof DS.describe([]) === 'string', { frases });
}

if (!sinCausa(10, 'play sin createOscillator devuelve 0')) {
  caso(10, 'play sin createOscillator devuelve 0', DS.play({}, DS.score(S.frame('REFUGE')).voices, 0) === 0);
}

if (!sinCausa(11, 'RIFT: cambiar la primera banda cambia su frecuencia según grado y octava')) {
  const original = S.frame('RIFT'), changed = JSON.parse(JSON.stringify(original));
  const beforeBand = original.bands[0], nextBand = beforeBand === 'cyan' ? 'paper' : 'cyan';
  const grade = { cyan: 2, paper: 3 };
  changed.bands[0] = nextBand;
  const before = DS.score(original).voices[0], after = DS.score(changed).voices[0];
  const expectedBefore = R.nota(grade[beforeBand], 0), expectedAfter = R.nota(grade[nextBand], 0);
  const valid = before.band === beforeBand && after.band === nextBand && before.octave === 0 && after.octave === 0 &&
    before.hz === expectedBefore && after.hz === expectedAfter && before.hz !== after.hz;
  caso(11, 'RIFT: cambiar la primera banda cambia su frecuencia según grado y octava', valid,
    { before: { band: before.band, grade: before.grade, octave: before.octave, hz: before.hz },
      after: { band: after.band, grade: after.grade, octave: after.octave, hz: after.hz } });
}

const ok = casos.every((c) => c.ok);
console.log(JSON.stringify({ ok, casos }));
process.exitCode = ok ? 0 : 1;
