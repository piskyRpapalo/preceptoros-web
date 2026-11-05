// La sensación del mundo en Acho (BOLA DE LA NOCHE, punto 4). Cuatro leyes, cada una con su fotograma
// preceptoros.acho/1 y su prueba; ESTILO_SABOTAJE=<ley> rompe una para enseñar el rojo.
//   L1 el cielo es el entorno: la luz de cada fotograma sale del tic (palette_cycle), no se elige a mano.
//   L2 el sol nunca en el cénit: su ángulo vive en [90°+25,66°, 180°−25,66°], así que |luz.x| ≥ √3/4 siempre
//      y toda forma conserva una sombra legible. 25,66° = asin(√3/4) es la elevación del suelo (hex_projection).
//   L3 insignias de tamaño fijo en pantalla, y solo para lo urgente: PROPUESTA (espera tu firma) y ERROR.
//   L4 billboards: el rótulo se ancla a su celda proyectada pero no gira ni se escala con el suelo.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const B = require('../public/game/acho_language.js');
const P = require('../public/game/palette_cycle.js');
const hex = require('../public/game/hex_projection.js');
const SAB = process.env.ESTILO_SABOTAJE || '';

const S = Math.sqrt(3) / 4, ELEV = Math.asin(S) * 180 / Math.PI;          // 0,4330 · 25,66°
const ALTO = 90 + ELEV, BAJO = 180 - ELEV;                                 // 115,66° a mediodía · 154,34° a medianoche
const URGENTE = ['PROPUESTA', 'ERROR'], INSIGNIA = 44;                     // 44 px: la diana de J1
const r3 = (v) => Math.round(v * 1000) / 1000;

// L1 + L2 · luz(t): el ángulo baja de ALTO (día pleno) a BAJO (noche) con la fracción de día de palette_cycle.
function luz(t) {
  const dia = P.palette(t).dia;                                            // 0..256, entero
  const g = SAB === 'cenit' ? 90 : ALTO + (BAJO - ALTO) * (256 - dia) / 256;
  const a = g * Math.PI / 180;
  return { g, v: [r3(Math.cos(a)), r3(-Math.sin(a))] };
}

// Fotograma del cielo: una franja de 320×96 con el horizonte y el sol (de día) o la luna (de noche) donde dice la luz.
function cielo(t) {
  const L = luz(t), dia = P.palette(t).dia, noche = dia < 128;
  const x = Math.round(160 + 150 * L.v[0]), y = Math.round(92 + 80 * L.v[1]);
  return { v: 'preceptoros.acho/1', id: 'sky-' + t, t, cv: [320, 96], light: L.v, style: 'clear',
    atoms: [
      { k: 'horizon', r: 'the sea line under the sky', i: [{ o: 'ribbon', pts: [[0, 92], [160, 88], [320, 92]], f: null, s: 'ink', lw: 2 }] },
      { k: noche ? 'moon' : 'sun', r: (noche ? 'the moon' : 'the sun') + ' at ' + Math.round(L.g) + ' degrees, never overhead',
        i: [{ o: 'blob', x, y, rx: 9, ry: 9, seed: 'sun', f: noche ? 'paper' : 'comic yellow.base', s: 'ink', lw: 2 }] }],
    bands: noche ? ['ink', 'paper'] : ['ink', 'comic yellow.base'],
    change: ['the light turns with the tick: ' + Math.round(L.g) + ' deg at tick ' + t],
    sound: 'none', motion: 'tick' };
}

// L3 · insignia(sello, zoom): una losa vista a 25,66° y, solo si el sello es urgente, su insignia de 44 px.
// La losa escala con el zoom; la insignia NO: se dibuja en píxeles de pantalla después de la cámara.
function placa(sello, zoom, q, r) {
  const p = hex(q, r), cx = 160 + p.x * zoom, cy = 120 + p.y * zoom, w = 48 * zoom, h = Math.round(w * S * 2);
  const items = [{ o: 'blob', x: cx, y: cy, rx: Math.round(w / 2), ry: Math.round(h / 2), seed: 'slab', f: 'paper', s: 'ink', lw: 2 }];
  const lado = SAB === 'insignia' ? Math.round(INSIGNIA * zoom) : INSIGNIA;
  if (URGENTE.includes(sello) || SAB === 'todo-insignia') {
    items.push({ o: 'blob', x: cx, y: Math.round(cy - h / 2 - lado / 2), rx: lado / 2, ry: lado / 2, seed: 'badge', f: sello + '.base', s: sello + '.contorno', lw: 2 });
  }
  return { k: 'node.' + sello.toLowerCase(), r: 'a ' + sello + ' node' + (URGENTE.includes(sello) ? ' with its badge: it needs you' : ''), i: items };
}
function insignias(zoom) {
  const atoms = [placa('LIVE', zoom, -1, 0), placa('PROPUESTA', zoom, 0, 0), placa('STALE', zoom, 1, 0)];
  return { v: 'preceptoros.acho/1', id: 'badges-z' + zoom, t: 0, cv: [320, 240], style: 'clear', atoms,
    bands: ['paper', 'ink', 'PROPUESTA.base', 'PROPUESTA.contorno'],
    change: ['zoom ' + zoom + ': the floor scales, the badge keeps 44 px'], sound: 'none', motion: 'none' };
}

// L4 · billboard(giro): el rótulo sigue a su celda girada, pero su texto no gira (rot 0) ni cambia de tamaño.
function billboard(giro) {
  const p = hex(2, -1), a = giro * Math.PI / 180;
  const x = Math.round(160 + p.x * Math.cos(a) - p.y * Math.sin(a)), y = Math.round(120 + p.x * Math.sin(a) + p.y * Math.cos(a));
  return { v: 'preceptoros.acho/1', id: 'label-' + giro, t: 0, cv: [320, 240], style: 'clear',
    atoms: [{ k: 'label', r: 'Reef, standing up whatever the turn', i: [
      { o: 'ribbon', pts: [[x, y], [x, y - 30]], f: null, s: 'ink', lw: 2 },
      { o: 'text', x, y: y - 38, tx: 'Reef', sz: 16, rot: SAB === 'billboard' ? giro : 0, f: 'ink', s: null }] }],
    bands: ['ink'], change: ['the map turns ' + giro + ' deg; the label stays upright'], sound: 'none', motion: 'none' };
}

const frames = [0, 30, 60, 120, 180, 210].map(cielo).concat([1, 2].map(insignias), [0, 60].map(billboard));

// Medidas comunes: ≤ 1.024 B, compila, y solo bandas que existen.
for (const f of frames) {
  const n = Buffer.byteLength(JSON.stringify(f), 'utf8');
  assert.ok(n <= 1024, f.id + ' pesa ' + n + ' B');
  assert.ok(B.compile(f).length > 0, f.id + ' no compila');
  f.bands.forEach((b) => B.band(b));
}
// L2: en los 240 tics, |luz.x| ≥ √3/4 y el ángulo dentro de [ALTO, BAJO].
for (let t = 0; t < 240; t++) {
  const L = luz(t);
  assert.ok(L.g >= ALTO - 1e-9 && L.g <= BAJO + 1e-9, 'tic ' + t + ': el sol a ' + L.g.toFixed(2) + '°');
  assert.ok(Math.abs(L.v[0]) >= r3(S), 'tic ' + t + ': luz casi vertical ' + L.v);
}
// L3: la insignia mide lo mismo a zoom 1 y 2; solo la llevan los sellos urgentes.
const badge = (f) => f.atoms.flatMap((a) => a.i.filter((i) => i.seed === 'badge').map((i) => [a.k, i.rx]));
const b1 = badge(frames.find((f) => f.id === 'badges-z1')), b2 = badge(frames.find((f) => f.id === 'badges-z2'));
assert.deepEqual(b1.map((x) => x[1]), b2.map((x) => x[1]), 'la insignia cambia con el zoom');
assert.deepEqual(b1.map((x) => x[0]), ['node.propuesta'], 'insignias fuera de lo urgente: ' + b1.map((x) => x[0]));
// L4: el texto del rótulo no gira con el mapa.
for (const f of frames.filter((x) => x.id.startsWith('label-'))) {
  const t = f.atoms[0].i.find((i) => i.o === 'text');
  assert.equal(t.rot, 0, f.id + ': el rótulo gira con el suelo');
}
if (process.argv.includes('--frames')) { frames.forEach((f) => console.log(JSON.stringify(f))); }
const m = luz(120), n = luz(0);
console.log('acho_estilo: ' + frames.length + ' fotogramas ≤ 1.024 B · sol ' + m.g.toFixed(2) + '°..' + n.g.toFixed(2) + '° · luz mediodía ' + m.v + ' · medianoche ' + n.v + ' · insignia 44 px fija · VERDE');
