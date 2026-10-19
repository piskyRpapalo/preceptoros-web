import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const B = require('../public/game/en301_tutorial_building.js');
const D = require('../public/game/deploy_building.js');
const E = require('../public/game/etiqueta.js');
const T = require('../public/game/tutorial_fases.js');
const U = require('../public/game/ui-tutorial-fases.js');
test('real source builds a deterministic canonical label without deployment authority', () => {
  const a = B.measure('radio');
  assert.deepEqual(a, B.measure('radio'));
  assert.equal(a.dato, 'medido');
  const label = JSON.parse(a.etiqueta);
  assert.equal(E.etiqueta(label).texto, a.etiqueta);
  assert.deepEqual(label.mesuras.tiles, D.measurements('radio').tiles);
  assert.equal(label.mesuras.touch_px, 44);
  assert.equal(label.deployment, 'PROPOSED');
  assert.equal(label.authority, false);
  assert.ok(E.bytes(a.etiqueta) < 1024);
  assert.equal(label.ram.sello, 'NO_DATA');
});
test('missing and unsupported sources remain blocked', () => {
  assert.equal(B.measure('tv').dato, 'NO_DATA');
  assert.equal(B.measure('radio', {measurements: () => null}).dato, 'NO_DATA');
  assert.equal(B.measure('radio', {}).dato, 'NO_DATA');
  assert.equal(B.measure('radio', {measurements: () => ({base:'radio',tiles:[1,4],touch_px:0,piece_ceiling_b:16384})}).dato,'NO_DATA');
});
test('tutorial reaches cards using the same source label, without opening network', () => {
  const m = B.measure('radio');
  let s = T.elige(T.inicia(), 'niebla').estado;
  for (const name of ['pulso','disipa','arena101','recompensa','campamento','primer_edificio']) {
    const v = U.vista(s, m);
    const action = v.acciones.find(a => a.evento === name);
    assert.ok(action);
    const next = U.alPulsar(s, action);
    assert.equal(next.ok, true);
    s = next.estado;
  }
  assert.equal(s.paso,'cartas');
  assert.equal(s.red,false);
  assert.equal(s.primer_edificio.etiqueta,m.etiqueta);
});
test('oversize UTF-8 and failing source never create a partial label', () => {
  const sample = D.measurements('radio');
  assert.equal(B.measure('radio', {measurements:()=>({...sample,base:'é'.repeat(1024)})}).dato,'NO_DATA');
  assert.equal(B.measure('radio', {measurements:()=>{throw Error('unavailable');}}).dato,'NO_DATA');
});
test('strict byte boundary accepts 1023 and rejects 1024', () => {
  const sample = D.measurements('radio');
  let atLimit;
  for (let n=1;n<1024;n++) {
    const found=B.measure('radio',{measurements:()=>({...sample,base:'a'.repeat(n)})});
    if(found.bytes===1023){atLimit=n;break;}
  }
  assert.ok(atLimit);
  assert.equal(B.measure('radio',{measurements:()=>({...sample,base:'a'.repeat(atLimit+1)})}).dato,'NO_DATA');
});
