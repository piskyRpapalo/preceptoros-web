// Radio del Estado · fase 1 (bb_radio.js): sonido desde el frame, sincronia audio-pulso y gemelo estatico.
// Uso: node atlas/bb_radio_cases.mjs -> [{caso, ok, detalle}] ; exit 0 solo si todos pasan.
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

const require = createRequire(import.meta.url);
const R = require('../public/game/bb_radio.js');
const T = require('../public/game/semantic_table.js');
const casos = [];
function caso(nombre, fn) {
  try { const d = fn(); casos.push({ caso: nombre, ok: d === true, detalle: d === true ? '' : String(d) }); }
  catch (e) { casos.push({ caso: nombre, ok: false, detalle: 'excepcion: ' + e.message }); }
}

const FRAME = { sello: 'ERROR', terminos: [[1, 0.5, 0], [2, 0.25, 1.1], [3, 0.8, 2.0]] };
const sha = (f32) => createHash('sha256').update(Buffer.from(f32.buffer)).digest('hex');

// Error de sincronia: pico por tick del audio (amplitud 0.3) frente a pulso(t) del mismo sello y tick.
// Con >= 3 ciclos por tick el pico es casi exacto; un tick de desfase separa el error por encima del 3%.
function errorSincronia(pcm, sello, saltoTicks) {
  const n = Math.floor(pcm.length / R.MUESTRAS_TICK);
  let peor = 0;
  for (let k = 0; k < n; k++) {
    let pico = 0;
    for (let i = 0; i < R.MUESTRAS_TICK; i++) { const v = Math.abs(pcm[k * R.MUESTRAS_TICK + i]); if (v > pico) pico = v; }
    const esperado = R.pulso(sello, (k + saltoTicks) / R.TICK_HZ);
    peor = Math.max(peor, Math.abs(pico / 0.3 - esperado));
  }
  return peor;
}
function desfase(pcm, sello) { return { error: errorSincronia(pcm, sello, 0) }; }

// Sabotaje: el mismo audio con el pulso desplazado un tick (lo que el canon declara rojo).
function pcmDesplazado(frame, saltoTicks) {
  const notas = R.notas(frame.terminos), total = notas.length * R.NOTA_TICKS * R.MUESTRAS_TICK;
  const out = new Float32Array(total);
  for (let n = 0; n < total; n++) {
    const tick = Math.floor(n / R.MUESTRAS_TICK), nota = notas[Math.floor(tick / R.NOTA_TICKS)];
    out[n] = 0.3 * R.pulso(frame.sello, (tick + saltoTicks) / R.TICK_HZ) * Math.sin(2 * Math.PI * nota.hz * (n / R.SR));
  }
  return out;
}

caso('la longitud del audio es notas x 15 ticks x 150 muestras', () => {
  const pcm = R.pcm(FRAME), esperado = R.notas(FRAME.terminos).length * R.NOTA_TICKS * R.MUESTRAS_TICK;
  return pcm.length === esperado || `${pcm.length} != ${esperado}`;
});

caso('el mismo frame da el mismo audio (determinismo, sha256 igual)', () => {
  return sha(R.pcm(FRAME)) === sha(R.pcm(FRAME)) || 'el audio cambia entre dos llamadas';
});

caso('frames distintos dan audios distintos (anti-slop del sonido)', () => {
  const otro = { sello: 'ERROR', terminos: [[1, 0.9, 0], [2, 0.1, 1.1], [3, 0.3, 2.0]] };
  return sha(R.pcm(FRAME)) !== sha(R.pcm(otro)) || 'dos frames distintos suenan igual';
});

caso('las notas son los armonicos k >= 2 de la forma, en el orden de su fase (k = 1 es el suelo comun)', () => {
  const n = R.notas([[1, 1, 0], [4, 0.4, 2], [2, 0.5, 1], [3, 0.3, 3]]);
  return (n.map((x) => x.k).join() === '2,4,3' && n[0].hz === 440 && n[1].hz === 880) || JSON.stringify(n);
});

const SEIS = ['LIVE', 'PROPUESTA', 'FIRMADO', 'ERROR', 'SIMULATED', 'STALE'];
const terms = (s) => T.visual(s).fourierTerms.map((t) => [t.k, t.a, t.phi]);
caso('seis sellos con melodia: el aviso de dos notas de la radio es distinto en los seis (antes 1 de 6)', () => {
  const avisos = SEIS.map((s) => sha(R.pcm({ sello: s, terminos: terms(s) }).slice(0, 2 * R.NOTA_TICKS * R.MUESTRAS_TICK)));
  return new Set(avisos).size === 6 || 'distintos: ' + new Set(avisos).size;
});

caso('sabotaje: cantar el fundamental comun (k = 1) vuelve a igualar los avisos', () => {
  const conSuelo = (s) => [{ k: 1 }].concat(R.notas(terms(s))).slice(0, 2).map((x) => x.k).join();
  return new Set(SEIS.map(conSuelo)).size < 6 || 'el sabotaje no iguala';
});

// La palabra y la huella dicen la misma melodia: el contorno se reconstruye desde las marcas dibujadas.
function cantoDesdeHuella(s) {
  const h = R.huella(s), reg = (k) => (k <= 2 ? 'low' : k <= 4 ? 'middle' : 'high'), mov = [];
  for (let i = 1; i < h.length; i++) { const m = h[i].y < h[i - 1].y ? 'rises' : 'falls'; if (mov[mov.length - 1] !== m) mov.push(m); }
  return h.length === 1 ? 'One ' + reg(h[0].k) + ' note' : 'From ' + reg(h[0].k) + ', ' + mov.join(', then ');
}
caso('ojo = lector: la huella dibujada y las palabras del canto describen la misma melodia en los seis', () => {
  for (const s of SEIS) { if (!R.canto(s).startsWith(cantoDesdeHuella(s) + ' · ')) return s + ': ' + R.canto(s) + ' / ' + cantoDesdeHuella(s); }
  return true;
});

caso('cada sello tiene un canto propio y su gemelo lo lleva; NO_DATA no canta (sin canto ni huella)', () => {
  const c = SEIS.map((s) => R.canto(s));
  if (new Set(c).size !== 6) return 'cantos repetidos: ' + c.join(' | ');
  if (SEIS.some((s) => R.gemelo(s).canto !== R.canto(s))) return 'el gemelo no lleva el canto';
  return (R.canto('NO_DATA') === null && R.huella('NO_DATA').length === 0 && R.gemelo('NO_DATA').canto === null) || 'NO_DATA canta';
});

caso('sabotaje: una huella con dos notas cambiadas de orden ya no dice el canto', () => {
  const h = R.huella('FIRMADO'), swap = [h[1], h[0]].concat(h.slice(2)), reg = (k) => (k <= 2 ? 'low' : k <= 4 ? 'middle' : 'high');
  return !R.canto('FIRMADO').startsWith('From ' + reg(swap[0].k) + ', rises, then falls, then rises') || 'el sabotaje pasa';
});

caso('NO_DATA es silencio: sin muestras', () => {
  return R.pcm({ sello: 'NO_DATA', terminos: FRAME.terminos }).length === 0 || 'NO_DATA suena';
});

caso('un sello desconocido no suena (nunca se inventa)', () => {
  return R.pcm({ sello: 'INVENTADO', terminos: FRAME.terminos }).length === 0 || 'un sello desconocido suena';
});

caso('sincronia: el pulso del audio sale de la misma f(t) (error <= 3% frente a pulso(t))', () => {
  const e = desfase(R.pcm(FRAME), FRAME.sello).error;
  return e <= 0.03 || `error ${e.toFixed(4)}`;
});

caso('sabotaje: el pulso desplazado un tick sale en rojo (error > 3%)', () => {
  const e = errorSincronia(pcmDesplazado(FRAME, 1), FRAME.sello, 0);
  return e > 0.03 || `el sabotaje de un tick pasa (error ${e.toFixed(4)})`;
});

caso('el gemelo estatico cubre los siete estados, cada uno con texto y forma', () => {
  for (const s of ['LIVE', 'PROPUESTA', 'FIRMADO', 'ERROR', 'NO_DATA', 'SIMULATED', 'STALE']) {
    const g = R.gemelo(s);
    if (!g || !g.texto || !g.forma) return `${s} sin gemelo estatico`;
  }
  return true;
});

caso('cada estado tiene una forma estatica distinta (anti-slop visual)', () => {
  const formas = ['LIVE', 'PROPUESTA', 'FIRMADO', 'ERROR', 'NO_DATA', 'SIMULATED', 'STALE'].map((s) => R.gemelo(s).forma);
  return new Set(formas).size === 7 || 'formas repetidas: ' + formas.join(',');
});

caso('NO_DATA se lee como texto: su gemelo dice NO DATA', () => {
  return R.gemelo('NO_DATA').texto === 'NO DATA' || 'texto distinto';
});

caso('un sello fuera de la tabla no tiene gemelo', () => {
  return R.gemelo('INVENTADO') === null || 'gemelo inventado';
});

caso('la radio no usa Math.random, Date.now ni performance.now', () => {
  const t = readFileSync(new URL('../public/game/bb_radio.js', import.meta.url), 'utf8');
  return !/Math\.random|Date\.now|performance\.now/.test(t) || 'usa azar o reloj';
});

caso('la pieza de la radio pesa menos que el tope vigente de 25 MiB por bloque', () => {
  const n = readFileSync(new URL('../public/game/bb_radio.js', import.meta.url)).byteLength;
  return n < 25 * 1024 * 1024 || 'pesa ' + n;
});

console.log(JSON.stringify(casos, null, 1));
process.exitCode = casos.every((c) => c.ok) ? 0 : 1;
