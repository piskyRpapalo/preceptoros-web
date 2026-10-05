// Casos del MAPA MOVIBLE: la camara (`world_camera.js`) y la niebla (`fog_of_war.js`). La camara es
// determinista, nunca entra en la niebla y empieza en la casa de la cuenta. Los ejecuta test_atlas.py:
//   node atlas/camara_casos.mjs -> [{caso, ok, detalle}]
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const K = require('../public/game/canon.js');
const A = require('../public/game/arena.js');
const C = require(process.env.CAMARA || '../public/game/world_camera.js');
const N = require('../public/game/fog_of_war.js');
const Ce = require('../public/game/nodos-cedulas.js');

const casos = [];
function caso(nombre, fn) {
  try { const d = fn(); casos.push({ caso: nombre, ok: d === true, detalle: d === true ? '' : String(d) }); }
  catch (e) { casos.push({ caso: nombre, ok: false, detalle: 'excepcion: ' + e.message }); }
}
const PUB = K.sha('una-cuenta-de-prueba'), OTRA = K.sha('otra-cuenta');
const lugares = A.lugares().map((l, i) => ({ npc: true, id: l.id, clave: 'npc:' + l.id, orden: i, tc: l.tc }));
const circ = (pub, luchados) => N.despejado({ pub, sha: K.sha, nodos: Ce.nodos, lugares, luchados: luchados || {} });
// Un generador fijo para los paseos: misma prueba, mismos pasos.
function lcg(s) { return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; }
function paseo(c0, cs, n, semilla, quieto) {
  const g = lcg(semilla), cam = C.crea(c0), traza = [];
  for (let i = 0; i < n; i++) {
    const r = g();
    if (r < 0.4) { C.arrastra(cam, (g() - 0.5) * 400, (g() - 0.5) * 400, cs, quieto); }
    else if (r < 0.7) { C.empuja(cam, (g() - 0.5) * 900, (g() - 0.5) * 900, cs, quieto); }
    else { C.paso(cam, 1 + g() * 3, cs); }
    traza.push(Math.round(cam.x * 100), Math.round(cam.y * 100));
  }
  return { cam, traza };
}
const dentro = (cam, cs) => cs.some((c) => Math.hypot(cam.x - c.x, cam.y - c.y) <= c.r - C.MARGEN + 1e-6);

caso('la camara es determinista: mismo estado y mismos pasos, misma vista', () => {
  const cs = circ(PUB), a = paseo(N.sitioCasa(PUB, K.sha), cs, 800, 7), b = paseo(N.sitioCasa(PUB, K.sha), cs, 800, 7);
  const va = JSON.stringify(C.vista(a.cam, 400, 600, 0.5)), vb = JSON.stringify(C.vista(b.cam, 400, 600, 0.5));
  return (a.traza.join() === b.traza.join() && va === vb) || 'dos paseos iguales dieron vistas distintas';
});
caso('la camara nunca entra en la niebla (2400 pasos, con y sin inercia)', () => {
  const cs = circ(PUB), malos = [];
  [[3, false], [11, true], [29, false]].forEach(([s, q]) => {
    const g = lcg(s), cam = C.crea(N.sitioCasa(PUB, K.sha));
    for (let i = 0; i < 800; i++) {
      const r = g();
      if (r < 0.4) { C.arrastra(cam, (g() - 0.5) * 600, (g() - 0.5) * 600, cs, q); }
      else if (r < 0.7) { C.empuja(cam, (g() - 0.5) * 1400, (g() - 0.5) * 1400, cs, q); }
      else { C.paso(cam, 1 + g() * 5, cs); }
      if (!dentro(cam, cs)) { malos.push(`semilla ${s} paso ${i}: (${cam.x.toFixed(0)}, ${cam.y.toFixed(0)})`); break; }
    }
  });
  return !malos.length || malos.join('; ');
});
caso('chocar con la niebla se nota (para avisarlo) y rebota hacia dentro', () => {
  const cs = circ(PUB), cam = C.crea(N.sitioCasa(PUB, K.sha));
  const choco = C.arrastra(cam, -5000, 0, cs, false);
  return (choco && cam.choco > 0 && dentro(cam, cs)) || 'un arrastre enorme no choco';
});
caso('con clave, el mapa empieza en TU casa; sin clave, en Hexelion', () => {
  const casa = N.sitioCasa(PUB, K.sha), cs = circ(PUB), sin = circ(null);
  const tieneCasa = cs.some((c) => c.que === 'casa' && c.x === casa.x && c.y === casa.y);
  return (tieneCasa && dentro(C.crea(casa), cs) && N.sitioCasa(null, K.sha) === null && !sin.some((c) => c.que === 'casa') &&
          dentro(C.crea(N.HEX), sin)) || 'la casa no es el punto de partida';
});
caso('la niebla sale de lo medido: Hexelion despejado, Doogee (sin medidas) en niebla', () => {
  const cs = circ(PUB);
  return (N.niebla(N.HEX.x, N.HEX.y, cs) === 0 && N.niebla(N.DOOGEE.x, N.DOOGEE.y, cs) === 1 &&
          !cs.some((c) => c.que === 'nodo.1.doogee')) || 'la niebla no sigue a las medidas';
});
caso('misma cuenta, misma niebla; otra cuenta, otra casa', () => {
  return (N.huella(circ(PUB)) === N.huella(circ(PUB)) && N.huella(circ(PUB)) !== N.huella(circ(OTRA))) || 'la niebla no depende solo de la cuenta y lo medido';
});
caso('luchar en un lugar lo despeja', () => {
  const l = lugares[5], antes = circ(PUB).length, despues = circ(PUB, { [l.clave]: true });
  return (despues.length === antes + 1 && despues.some((c) => c.que === l.clave)) || 'el lugar luchado sigue en niebla';
});

console.log(JSON.stringify(casos, null, 1));
process.exitCode = casos.every((c) => c.ok) ? 0 : 1;
