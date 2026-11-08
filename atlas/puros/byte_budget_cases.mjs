// N7 · el techo de bytes vive EN el contrato (atlas.carta/1) y checkCarta lo hace cumplir.
// Lo servido cumple chunk_b por chunk y neighbourhood_b en suma. Uso: node --test atlas/puros/byte_budget_cases.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
const C = createRequire(import.meta.url)('../../public/game/map_chart.js');
const carta = JSON.parse(readFileSync(new URL('../../public/map/chart.json', import.meta.url), 'utf8'));
const dir = new URL('../../public/map/chunks/', import.meta.url);
const copia = () => JSON.parse(JSON.stringify(carta));

test('chart.json declara el presupuesto con sus dos números', () => {
  assert.equal(carta.budget.chunk_b, 8192);
  assert.equal(carta.budget.neighbourhood_b, 65536);
  assert.equal(C.checkCarta(carta), null);
});

test('cada chunk servido pesa lo que declara y cumple chunk_b', () => {
  for (const c of carta.chunks) {
    const file = readdirSync(dir).find((n) => n.startsWith(c.id + '.'));
    assert.ok(file, 'chunk servido ausente: ' + c.id);
    const real = statSync(new URL(file, dir)).size;
    assert.equal(real, c.bytes, 'bytes declarados != servidos: ' + c.id);
    assert.ok(real <= carta.budget.chunk_b, 'chunk over budget: ' + c.id);
  }
});

test('la suma de la vecindad cumple neighbourhood_b (imprime suma y margen)', () => {
  const suma = carta.chunks.reduce((a, c) => a + c.bytes, 0);
  const n = carta.budget.neighbourhood_b;
  console.log(`suma vecindad: ${suma} B de ${n} B · margen ${n - suma} B`);
  assert.equal(carta.chunks.length, 7);
  assert.ok(suma <= n, 'neighbourhood over budget: ' + suma + ' > ' + n);
});

test('un chunk de 9000 bytes da «chunk over budget»', () => {
  const c = copia();
  c.chunks[0].bytes = 9000;
  assert.equal(C.checkCarta(c), 'chunk over budget: 0_0 9000 > 8192');
});

test('una vecindad que pasa de 65536 da «neighbourhood over budget»', () => {
  const c = copia();
  c.budget.chunk_b = 10000;
  for (const k of c.chunks) k.bytes = 9500;
  assert.equal(C.checkCarta(c), 'neighbourhood over budget: 66500 > 65536');
});

test('sin budget, o con números que no son enteros > 0, da error', () => {
  const sin = copia(); delete sin.budget;
  assert.match(C.checkCarta(sin), /^budget missing/);
  const cero = copia(); cero.budget.chunk_b = 0;
  assert.match(C.checkCarta(cero), /^budget missing/);
  const frac = copia(); frac.budget.neighbourhood_b = 1.5;
  assert.match(C.checkCarta(frac), /^budget missing/);
});
