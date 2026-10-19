// VT4 · taller de siluetas matriciales: silhouette_hex 64..256 caracteres, solo [0-9a-f], esquema preceptoros.silueta/1.
// Se ejecuta con: node atlas/silueta_casos.mjs  -> [{caso, ok, detalle}]  (sale != 0 si alguno falla)
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';

const require = createRequire(import.meta.url);
const S = require('../public/game/silueta.js');
const esquema = JSON.parse(readFileSync(new URL('../data/atlas_siluetas_schema.json', import.meta.url), 'utf8'));

const casos = [];
function caso(nombre, fn) {
  try {
    const d = fn();
    casos.push({ caso: nombre, ok: d === true, detalle: d === true ? '' : String(d) });
  } catch (e) {
    casos.push({ caso: nombre, ok: false, detalle: 'excepcion: ' + e.message });
  }
}
const rechaza = (r, re) => (r.ok === false && re.test(r.motivo)) || `no rechazo con ${re}: ${JSON.stringify(r)}`;
const sil = (h) => ({ esquema: S.ESQUEMA, silhouette_hex: h });
const buena = 'ab'.repeat(40);   // 80 caracteres, solo [0-9a-f]

caso('valido: 80 caracteres hex, esquema correcto', () => {
  const r = S.valida(sil(buena));
  return r.ok && r.longitud === 80 ? true : 'rechazo una silueta valida: ' + JSON.stringify(r);
});

caso('violacion: caracter fuera de [0-9a-f] (mayuscula)', () => rechaza(S.valida(sil(buena + 'F')), /fuera de \[0-9a-f\]/));

caso('violacion: menos de 64 caracteres', () => rechaza(S.valida(sil('a'.repeat(63))), /menos de 64/));

caso('violacion: mas de 256 caracteres', () => rechaza(S.valida(sil('a'.repeat(257))), /mas de 256/));

caso('violacion: inyeccion HTML/SVG en el hex', () => rechaza(S.valida(sil(buena + '<svg onload=1>')), /inyeccion HTML\/SVG\/URL/));

caso('violacion: inyeccion por URL', () => rechaza(S.valida(sil('javascript:' + buena)), /inyeccion HTML\/SVG\/URL/));

caso('violacion: campo extra o esquema ajeno', () => {
  const a = rechaza(S.valida({ ...sil(buena), extra: 1 }), /campos distintos/);
  const b = rechaza(S.valida({ esquema: 'otro/1', silhouette_hex: buena }), /esquema distinto/);
  return a === true && b === true ? true : a !== true ? a : b;
});

caso('esquema JSON y validador coinciden en el patron y en el esquema', () => {
  const re = new RegExp(esquema.properties.silhouette_hex.pattern);
  const muestras = ['a'.repeat(64), 'a'.repeat(256), 'a'.repeat(63), 'a'.repeat(257), 'A'.repeat(64), buena + 'g'];
  const malas = muestras.filter((h) => re.test(h) !== S.valida(sil(h)).ok);
  return malas.length === 0 || 'divergen en: ' + malas.map((h) => h.length + '/' + h.slice(-1)).join(' ');
});

caso('NO_DATA declarado: contraste, consentimiento y correspondencia no se miden en este modulo', () => {
  const ks = ['contraste', 'consentimiento', 'correspondencia'];
  return ks.every((k) => /^NO_DATA \(/.test(S.NO_DATA[k])) || 'falta una causa NO_DATA';
});

const fallos = casos.filter((c) => !c.ok).length;
console.log(JSON.stringify(casos, null, 2));
if (fallos) process.exitCode = 1;
