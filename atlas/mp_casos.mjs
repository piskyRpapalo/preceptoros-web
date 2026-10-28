// Casos deterministas del MULTIJUGADOR de theGame (auditoria MGNO §3). Los ejecuta atlas/test_atlas.py:
//     node atlas/mp_casos.mjs              -> una linea JSON: [{caso, ok, detalle}]
//     node atlas/mp_casos.mjs --muestras   -> objetos de muestra para validarlos contra data/*.json
// Sin red, sin reloj, sin azar del sistema: identidades de prueba deterministas (mp_firma.mjs).
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { identidad, verificador, cadena, azar } from './mp_firma.mjs';

const require = createRequire(import.meta.url);
const K = require('../public/game/canon.js');




const V = require('../public/game/valores.js');

const casos = [];
async function caso(nombre, fn) {
  try { const d = await fn(); casos.push({ caso: nombre, ok: d === true, detalle: d === true ? '' : String(d) }); }
  catch (e) { casos.push({ caso: nombre, ok: false, detalle: 'excepcion: ' + e.message }); }
}
const igual = (a, b) => a === b || `${JSON.stringify(a)} != ${JSON.stringify(b)}`;
const lanza = (fn) => { try { fn(); return 'no lanzo'; } catch (e) { return true; } };
const todas = (...xs) => xs.find((x) => x !== true) ?? true;
const copia = (x) => JSON.parse(JSON.stringify(x));

const ANA = identidad('ana'), BEA = identidad('bea'), CRIS = identidad('cris');
const pares = (...ids) => ids.map((i) => i.pub).sort();
const politica = (modo, ids, extra = {}) => ({
  esquema: 'atlas.mp_sesion/1', modo, pares: pares(...ids), quorum: extra.quorum ?? ids.length,
  max_bytes: extra.max_bytes ?? 8192, max_ops: extra.max_ops ?? 200, semilla: 'commit_reveal',
  conflicto: 'poda_gana', contenido_v: '2026-10-14.2', nonce: extra.nonce ?? '0'.repeat(31) + '1'
});
const muestras = {};

// ---------------------------------------------------------------- canonico, huella, PRNG, loteria
await caso('canon: mismo objeto con otro orden de claves, mismos bytes', () =>
  igual(K.canon({ b: 1, a: { d: [1, 2], c: 'x' } }), K.canon({ a: { c: 'x', d: [1, 2] }, b: 1 })));
await caso('canon: sin espacios y lo no ASCII escapado', () =>
  igual(K.canon({ t: 'ñandú ✦', n: -3 }), '{"n":-3,"t":"\\u00f1and\\u00fa \\u2726"}'));
await caso('canon: rechaza decimales, NaN y undefined', () =>
  todas(lanza(() => K.canon({ x: 0.5 })), lanza(() => K.canon({ x: NaN })), lanza(() => K.canon({ x: undefined }))));
await caso('huella: el SHA-256 puro coincide con el de node', () => {
  const t = K.canon({ a: 1, b: ['x', 2] });
  return igual(K.huella({ b: ['x', 2], a: 1 }), createHash('sha256').update(t).digest('hex'));
});
await caso('PRNG: misma semilla, misma secuencia; fijada para cualquier motor', () => {
  const g = K.generador('ab'.repeat(32)), h = K.generador('ab'.repeat(32));
  const a = [0, 1, 2, 3, 4, 5].map(() => g.u32()), b = [0, 1, 2, 3, 4, 5].map(() => h.u32());
  return todas(igual(a.join(), b.join()), igual(K.generador('0'.repeat(64)).u32(), 1144304738));
});
await caso('PRNG: uniforme siempre dentro del rango (con rechazo)', () => {
  const g = K.generador('cd'.repeat(32));
  for (const n of [1, 2, 3, 7, 1000, 3 * 2 ** 30, 2 ** 32]) {
    for (let i = 0; i < 200; i++) { const x = g.uniforme(n); if (!(x >= 0 && x < n && Number.isInteger(x))) { return 'fuera: ' + n; } }
  }
  return true;
});
await caso('loteria: frecuencias pegadas a los pesos enteros (20 000 sorteos)', () => {
  const g = K.generador('ef'.repeat(32)), p = [1, 3, 6], c = [0, 0, 0];
  for (let i = 0; i < 20000; i++) { c[K.loteria(p, g)]++; }
  const ok = c.every((x, i) => Math.abs(x - 20000 * p[i] / 10) < 400);
  return ok || c.join();
});
await caso('odds en puntos basicos: exactas y el resto se dice', () => {
  const o = K.puntosBasicos([5, 40, 250, 705]);
  return todas(igual(o.pb.join(), '50,400,2500,7050'), igual(o.resto, 0), igual(K.puntosBasicos([1, 1, 1]).resto, 1));
});

// ---------------------------------------------------------------- sobres y libro
const PD = politica('duelo', [ANA, BEA]);









// ---------------------------------------------------------------- commit-reveal









// ---------------------------------------------------------------- arena: duelo fantasma

const tropasAna = [0, 1, 2].map((i) => ({ tc: 'tc2', semilla: azar('tropa-ana-' + i) }));
const tropasBea = [0, 1, 2].map((i) => ({ tc: 'tc2', semilla: azar('tropa-bea-' + i) }));
const PT = politica('tablon', [BEA], { quorum: 1 });













// ---------------------------------------------------------------- mercado A2A
const PM = politica('mercado', [ANA, BEA]);
const oferta = (extra = {}) => ({ esquema: 'atlas.oferta/1', da: { cobre: 50 }, pide: { luz: 20 }, expira_ciclo: 300,
                                   nonce: '1'.repeat(32), para: 'cualquiera', procedencia: 'humano', ...extra });









// ---------------------------------------------------------------- narragrafo (MGNO)
const PN = politica('cooperativo', [ANA, BEA, CRIS], { quorum: 3 });
const nodo = (texto, af) => ({ esquema: 'atlas.mgno_nodo/1', texto, etiquetas: ['bosque'], afinidad: af });
const n0 = nodo('The Core hums under the ruins.', [100, 20, 90, 40, 60, 50, 80, 70]);
const n1 = nodo('A patrol of glass eels circles the rift.', [30, 200, 60, 180, 90, 70, 40, 60]);
const n2 = nodo('An old Atlantean map glows in the silt.', [150, 10, 220, 60, 40, 90, 120, 230]);
const id = (n) => K.huella(n);









// ---------------------------------------------------------------- aislamiento y privacidad
// Corte D: sobres, arena, mercado y narragrafo se retiraron con el juego; canon sigue vivo y su pureza se mantiene.
const MODULOS = ['canon'];
const sinComentarios = (t) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"\\])\/\/.*$/gm, '$1');
await caso('pureza: los modulos del multijugador no tocan red, reloj, azar, DOM ni el motor', () => {
  const malos = ['fetch(', 'XMLHttpRequest', 'WebSocket', 'RTCPeerConnection', 'sendBeacon', 'Date', 'performance.',
                 'Math.random', 'document.', 'localStorage', 'indexedDB', 'eval(', 'Function(', 'AtlasMotor', 'AtlasJuego', 'innerHTML'];
  for (const m of MODULOS) {
    const cod = sinComentarios(readFileSync(new URL(`../public/game/${m}.js`, import.meta.url), 'utf8'));
    const hay = malos.filter((x) => cod.includes(x));
    if (hay.length) { return m + ': ' + hay.join(', '); }
  }
  return true;
});



if (process.argv.includes('--muestras')) {
  muestras.mp_sesion = PD;
  process.stdout.write(JSON.stringify(muestras) + '\n');
} else {
  process.stdout.write(JSON.stringify(casos) + '\n');
}
