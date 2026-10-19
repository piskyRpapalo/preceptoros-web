// C1-C4 del cangrejo (decision mia, sin firma): el cangrejo se lee como CANGREJO, nunca como medusa.
// Criatura: public/game/bubble_bestiary.js (crabWord). Salida: una linea JSON {ok, casos}; rc=0 solo si todos pasan.
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const BESTIARY_PATH = fileURLToPath(new URL('../public/game/bubble_bestiary.js', import.meta.url));
const P = { x: 300, y: 440, rr: 50, dir: 1, eye: 'up' };
const MIRROR_X = 2 * P.x;
const EPS = 1e-9;
const cases = [];

let mod = null, loadError = '';
try { mod = require(BESTIARY_PATH); } catch (e) { loadError = 'no carga bubble_bestiary.js: ' + e.message; }
const crab = mod && mod.WORDS ? mod.WORDS.crab : null;
if (!crab && !loadError) { loadError = 'bubble_bestiary.js sin WORDS.crab'; }

const clone = (value) => JSON.parse(JSON.stringify(value));
const centroid = (pts) => [
  pts.reduce((acc, q) => acc + q[0], 0) / pts.length,
  pts.reduce((acc, q) => acc + q[1], 0) / pts.length,
];

function check(name, fn) {
  let result;
  try { result = fn(); } catch (e) { result = { ok: false, detail: 'excepcion: ' + (e && e.message ? e.message : String(e)) }; }
  cases.push({ caso: name, ok: result.ok === true, detalle: result.detail === undefined ? '' : result.detail });
}

check('C1 · defaults intactos: crab({x:190,y:282}) === crab({x:190,y:282,rr:40,dir:1,eye:"open"})', () => {
  if (!crab) return { ok: false, detail: loadError };
  const implicit = JSON.stringify(crab({ x: 190, y: 282 }));
  const explicit = JSON.stringify(crab({ x: 190, y: 282, rr: 40, dir: 1, eye: 'open' }));
  return { ok: implicit === explicit, detail: implicit === explicit ? 'iguales' : 'distintos' };
});

check('C2 · se lee como cangrejo: pinzas con muesca, ojos en pedunculo, patas abiertas, cuerpo unico', () => {
  if (!crab) return { ok: false, detail: loadError };
  const items = crab(clone(P));
  const claws = items.filter((q) => q.o === 'ribbon' && q.closed === true && q.f === 'cyan' && q.pts.length === 20);
  const eyes = items.filter((q) => q.o === 'wave' && q.f === 'paper');
  const legs = items.filter((q) => q.o === 'ribbon' && q.closed === false && q.s === 'ink' && q.lw === 4.6);
  const bodies = items.filter((q) => q.o === 'wave' && q.f === 'cyan');
  const clawOk = claws.length === 2 && claws.every((q) => {
    const c = centroid(q.pts);
    return c[1] < P.y - 0.44 * P.rr && Math.abs(c[0] - P.x) > 0.85 * P.rr;
  });
  const eyeOk = eyes.length === 2 && eyes.every((q) => q.y < P.y - 0.6 * P.rr);
  const legOk = legs.length === 6 && legs.every((q) => Math.abs(q.pts[q.pts.length - 1][0] - P.x) > 0.82 * P.rr);
  const bodyOk = bodies.length === 1 && bodies[0].h[0][1] === 0.82 * P.rr && bodies[0].h[0][2] === 0.46 * P.rr;
  const ok = clawOk && eyeOk && legOk && bodyOk;
  return { ok, detail: { pinzas: claws.length, ojos: eyes.length, patas: legs.length, cuerpos: bodies.length, clawOk, eyeOk, legOk, bodyOk } };
});

check('C3 · espejo: dir -1 refleja cada punto y cada centro de wave respecto a x = 300', () => {
  if (!crab) return { ok: false, detail: loadError };
  const a = crab(clone(P));
  const b = crab(clone({ ...P, dir: -1 }));
  if (a.length !== b.length) return { ok: false, detail: { itemsP: a.length, itemsEspejo: b.length } };
  const bad = [];
  a.forEach((item, i) => {
    const other = b[i];
    if (other.o !== item.o) { bad.push(i + ': primitiva'); return; }
    if (item.o === 'ribbon') {
      if (other.pts.length !== item.pts.length) { bad.push(i + ': puntos'); return; }
      item.pts.forEach((q, k) => {
        if (Math.abs(other.pts[k][0] - (MIRROR_X - q[0])) > EPS || Math.abs(other.pts[k][1] - q[1]) > EPS) { bad.push(i + '.' + k); }
      });
    }
    if (item.o === 'wave' && Math.abs(other.x - (MIRROR_X - item.x)) > EPS) { bad.push(i + ': x'); }
  });
  return { ok: bad.length === 0, detail: bad.length ? bad.slice(0, 8) : 'espejo exacto de ' + a.length + ' items' };
});

check('C4 · caja: todo punto de ribbon y todo centro de wave dentro de x [300 +- 1.45 rr], y [440 - 1.3 rr, 440 + 0.5 rr]', () => {
  if (!crab) return { ok: false, detail: loadError };
  const xLo = P.x - 1.45 * P.rr, xHi = P.x + 1.45 * P.rr;
  const yLo = P.y - 1.3 * P.rr, yHi = P.y + 0.5 * P.rr;
  const fuera = [];
  crab(clone(P)).forEach((item, i) => {
    const pts = item.o === 'ribbon' ? item.pts : item.o === 'wave' ? [[item.x, item.y]] : [];
    pts.forEach((q) => {
      if (q[0] < xLo || q[0] > xHi || q[1] < yLo || q[1] > yHi) { fuera.push(i + ':' + q[0].toFixed(2) + ',' + q[1].toFixed(2)); }
    });
  });
  return { ok: fuera.length === 0, detail: fuera.length ? fuera.slice(0, 8) : 'dentro de la caja' };
});

const ok = cases.every((c) => c.ok);
console.log(JSON.stringify({ ok, casos: cases }));
process.exitCode = ok ? 0 : 1;
