// Casos del QR puro (`public/game/qr.js`): el enlace de un duelo, cara a cara, sin traer codigo de fuera.
// Las huellas son de la libreria de referencia python-qrcode 8.2 (modo byte, misma version, nivel y
// mascara), generadas el 2026-09-28: el codificador de la web tiene que dar la MISMA matriz, bit a bit.
// En la nube se contrasto ademas en las 40 versiones, niveles L y M, y se leyo con zxing (80 de 80).
// Los ejecuta atlas/test_atlas.py:   node atlas/qr_casos.mjs -> [{caso, ok, detalle}]
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';

const require = createRequire(import.meta.url);
const Q = require('../public/game/qr.js');

const casos = [];
function caso(nombre, fn) {
  try { const d = fn(); casos.push({ caso: nombre, ok: d === true, detalle: d === true ? '' : String(d) }); }
  catch (e) { casos.push({ caso: nombre, ok: false, detalle: 'excepcion: ' + e.message }); }
}
const sha = (s) => createHash('sha256').update(s).digest('hex');
function texto(n) {
  let s = '';
  for (let i = 0; s.length < n; i++) { s += sha('atlas.qr/1:' + i); }
  return s.slice(0, n);
}
const huellaMatriz = (q) => sha(Array.from(q.m).join(''));

const REFERENCIA = [
  [11, 'L', 0, 1, 'a78cb2919e5d248787d9a4add166f49ed250bea9c984ac5f933e02f9353ed450'],
  [100, 'M', 3, 6, '147be67024ba7972b10e745153f78d2e7b6c6dc72395e1a5318ded29d9fed1b6'],
  [271, 'L', 5, 10, '6ad0e7959fa6623461b0c7caaddc2711774dd3b45bd6e5c336a1ba890d43a637'],
  [700, 'M', 7, 21, '7bbcf7a563119e8a3cc08bd2b577fe4f45df12310b49e53fcb3feef0bcec89a8'],
  [1273, 'L', 2, 25, '0abbd53195e8971f712cfeac7219219534e6370cdf4b095ac83652b4cfa48080'],
  [1465, 'L', 6, 27, '151b6e6fd23bd1c5c482c8bb29b344363e63b8fb7449325c023ee703c928af4f'],
  [2953, 'L', 1, 40, 'c1617b4c85660da6308f6e20fbead9de2abdd47d96bcfa15d23b01fb52f35a77']
];
for (const [n, nivel, mk, v, h] of REFERENCIA) {
  caso(`referencia: ${n} B, nivel ${nivel}, mascara ${mk} -> version ${v}, la misma matriz bit a bit`, () => {
    const q = Q.matriz(texto(n), nivel, mk);
    return q.version !== v ? `version ${q.version} != ${v}` : huellaMatriz(q) === h || 'la matriz difiere de la referencia';
  });
}
caso('capacidad: crece con la version y el nivel M guarda menos que el L', () => {
  for (let v = 2; v <= 40; v++) {
    if (Q.capacidad(v, 'L') <= Q.capacidad(v - 1, 'L')) { return 'L no crece en ' + v; }
    if (Q.capacidad(v, 'M') >= Q.capacidad(v, 'L')) { return 'M no guarda menos en ' + v; }
  }
  return Q.capacidad(40, 'L') === 2953 || 'la version 40-L no guarda 2953 B';
});
caso('determinista: el mismo enlace da la misma matriz, con la mascara que elige la penalizacion', () => {
  const a = Q.matriz('#thegame/duelo=z' + texto(900)), b = Q.matriz('#thegame/duelo=z' + texto(900));
  return huellaMatriz(a) === huellaMatriz(b) && a.mascara === b.mascara || 'no es determinista';
});
caso('los tres buscadores y la temporizacion estan donde dice la norma', () => {
  const q = Q.matriz(texto(500)), n = q.n, at = (x, y) => q.m[y * n + x];
  for (const [cx, cy] of [[3, 3], [n - 4, 3], [3, n - 4]]) {
    if (!at(cx, cy) || at(cx + 2, cy) || !at(cx + 3, cy)) { return 'buscador roto en ' + cx + ',' + cy; }
  }
  for (let i = 8; i < n - 8; i++) { if (at(i, 6) !== (i % 2 === 0 ? 1 : 0)) { return 'temporizacion rota en ' + i; } }
  return at(8, n - 8) === 1 || 'falta el modulo oscuro';
});
caso('lo que no cabe, fuera (y un nivel que no es L ni M)', () => {
  let a = 'cabe', b = 'acepta';
  try { Q.matriz(texto(2954)); } catch (e) { a = /no cabe/.test(e.message) || e.message; }
  try { Q.matriz('x', 'H'); } catch (e) { b = /nivel/.test(e.message) || e.message; }
  return a === true && b === true || `${a} · ${b}`;
});

process.stdout.write(JSON.stringify(casos) + '\n');
