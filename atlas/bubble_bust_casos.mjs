// Casos de la cabeza del Preceptor (busto): palabra bust de public/game/bubble_bestiary.js (decision mia, sin firma).
// Salida: una linea JSON {ok, casos}; rc=0 solo si todos los casos pasan.
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { WORDS } = require(fileURLToPath(new URL('../public/game/bubble_bestiary.js', import.meta.url)));
const bust = WORDS.bust;
const C = { x: 192, y: 214 };
const EYE = [192 + 0.33 * 64, 214 - 0.35 * 64];
const cases = [];
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const mean = (pts) => ({ x: pts.reduce((s, q) => s + q[0], 0) / pts.length, y: pts.reduce((s, q) => s + q[1], 0) / pts.length });
const lid = (q) => q.o === 'ribbon' && q.closed === true && q.f === 'paper' && q.pts.length === 4 &&
  Math.hypot(mean(q.pts).x - EYE[0], mean(q.pts).y - EYE[1]) < 0.05 * 64;

function check(name, fn) {
  let r;
  try { r = fn(); } catch (e) { r = { ok: false, detail: 'excepcion: ' + e.message }; }
  cases.push({ caso: name, ok: r.ok === true, detalle: r.detail === undefined ? '' : r.detail });
}

check('B1 · defaults intactos: bust(C) igual que con todos los valores por defecto explicitos', () => {
  const explicit = bust({ x: 192, y: 214, r: 64, rot: 0, sq: [1, 1], eye: 'shut', cybEye: 'shut', mEye: 'shut', mouth: 'closed' });
  return { ok: same(bust(C), explicit) };
});

check('B2a · los 5 primeros ribbons cerrados con f son cara, placa, barba, bigote y pelo', () => {
  const firsts = bust(C).filter((q) => q.o === 'ribbon' && q.closed && q.f != null).slice(0, 5).map((q) => q.f);
  return { ok: same(firsts, ['paper', 'ink', 'paper', 'paper', 'paper']), detail: firsts };
});

check('B2b · la placa (unico ribbon cerrado con f ink) tiene centroide con x > 192', () => {
  const plates = bust(C).filter((q) => q.o === 'ribbon' && q.closed && q.f === 'ink');
  return { ok: plates.length === 1 && mean(plates[0].pts).x > 192, detail: plates.length };
});

check('B2c · al menos 18 rizos (ribbons abiertos de 8 puntos), todos con y < 214 - 0.25*64', () => {
  const curls = bust(C).filter((q) => q.o === 'ribbon' && !q.closed && q.pts.length === 8);
  const high = curls.every((q) => q.pts.every((p) => p[1] < 214 - 0.25 * 64));
  return { ok: curls.length >= 18 && high, detail: { rizos: curls.length, high } };
});

check('B2d · silueta de huevo: alto/ancho >= 1.2', () => {
  const xs = [], ys = [];
  for (const q of bust(C)) {
    if (q.o === 'ribbon') { for (const p of q.pts) { xs.push(p[0]); ys.push(p[1]); } }
    else { xs.push(q.x - q.h[0][1], q.x + q.h[0][1]); ys.push(q.y - q.h[0][2], q.y + q.h[0][2]); }
  }
  const alto = Math.max(...ys) - Math.min(...ys), ancho = Math.max(...xs) - Math.min(...xs);
  return { ok: alto / ancho >= 1.2, detail: { alto: Math.round(alto * 10) / 10, ancho: Math.round(ancho * 10) / 10 } };
});

check('B2e · nariz: un ribbon abierto de 5 puntos con x medio a menos de 0.1*64 de 192', () => {
  const nose = bust(C).filter((q) => q.o === 'ribbon' && !q.closed && q.pts.length === 5 && Math.abs(mean(q.pts).x - 192) < 0.1 * 64);
  return { ok: nose.length >= 1, detail: nose.length };
});

check('B3 · ojo de la roca: shut = parpado paper de 4 puntos sin FIRMADO.base; violet = iris FIRMADO.base sin parpado', () => {
  const shut = bust({ ...C, cybEye: 'shut' }), violet = bust({ ...C, cybEye: 'violet' });
  const signed = shut.filter((q) => q.f === 'FIRMADO.base' || q.s === 'FIRMADO.base');
  const iris = violet.filter((q) => q.o === 'wave' && q.f === 'FIRMADO.base' &&
    Math.abs(q.x - EYE[0]) <= 1e-9 && Math.abs(q.y - EYE[1]) <= 1e-9);
  const ok = shut.filter(lid).length >= 1 && signed.length === 0 && iris.length >= 1 && violet.filter(lid).length === 0;
  return { ok, detail: { parpado: shut.filter(lid).length, signed: signed.length, iris: iris.length, lidVioleta: violet.filter(lid).length } };
});

check('B4 · caja: todo punto de ribbon y todo centro de wave en x 192±64 e y en [214-1.6*64, 214+64]', () => {
  const pts = bust(C).flatMap((q) => (q.o === 'ribbon' ? q.pts : [[q.x, q.y]]));
  const ok = pts.every((p) => p[0] >= 192 - 64 && p[0] <= 192 + 64 && p[1] >= 214 - 1.6 * 64 && p[1] <= 214 + 64);
  return { ok, detail: { puntos: pts.length } };
});

check('B5 · sq y rot siguen moviendo el dibujo', () => {
  const base = JSON.stringify(bust(C));
  const ok = JSON.stringify(bust({ ...C, sq: [1.12, 0.88] })) !== base && JSON.stringify(bust({ ...C, rot: 12 })) !== base;
  return { ok };
});

const ok = cases.every((c) => c.ok);
console.log(JSON.stringify({ ok, casos: cases }));
process.exitCode = ok ? 0 : 1;
