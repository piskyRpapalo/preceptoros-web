// Shell Schematics: import/export same building contract, preview only.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const S = require('../public/game/shell_schematics.js');
const base = { esquema: 'preceptoros.edificio/1', id: 'boya-estado', tipo: 'boya', col: 100, fila: -100,
  huella: 1, nace_tic: 0, madura_tics: 3, desgaste_por_tic: 8, carga: 300, escudo: 0, emboscable: false };
let total = 0;
function caso(nombre, f) { f(); total++; console.log('ok ' + nombre); }
if (process.argv.includes('--sabotage-accept')) {
  const real = S.importa;
  S.importa = (texto, tipo) => texto === '{}' ? { ok: true, valor: {}, tipo } : real(texto, tipo);
}
caso('exporta la estructura medida en forma JSON de máquina', () => {
  const e = S.exporta(base); assert.equal(e.ok, true); assert.deepEqual(JSON.parse(e.texto), base);
});
caso('replay de exportación: misma estructura produce los mismos bytes', () => {
  assert.equal(S.exporta(base).texto, S.exporta({ ...base }).texto);
});
caso('importa la misma forma y conserva campos opcionales', () => {
  const e = S.importa(S.exporta(base).texto, 'boya'); assert.equal(e.ok, true); assert.deepEqual(e.valor, base);
});
caso('rechaza JSON inválido con causa', () => {
  const e = S.importa('{', 'boya'); assert.equal(e.ok, false); assert.match(e.causa, /JSON/);
});
caso('rechaza un objeto vacío aunque el importador reciba JSON válido', () => {
  const e = S.importa('{}', 'boya'); assert.equal(e.ok, false); assert.match(e.causa, /required/);
});
caso('rechaza datos de otro tipo de edificio', () => {
  const e = S.importa(JSON.stringify({ ...base, tipo: 'cristal' }), 'boya'); assert.equal(e.ok, false); assert.match(e.causa, /type/);
});
caso('rechaza campos no pertenecientes al esquema', () => {
  const e = S.importa(JSON.stringify({ ...base, html: '<img src=x>' }), 'boya'); assert.equal(e.ok, false); assert.match(e.causa, /field/);
});
caso('rechaza manifiesto con ciclo fraccionario', () => {
  const e = S.importa(JSON.stringify({ ...base, nace_tic: 1.5 }), 'boya'); assert.equal(e.ok, false); assert.match(e.causa, /NO_DATA/);
});
caso('rechaza ficheros de más de 16 KiB antes de parsear', () => {
  const e = S.importa(' '.repeat(16385), 'boya'); assert.equal(e.ok, false); assert.match(e.causa, /16 KiB/);
});
console.log(total + ' casos verdes');
