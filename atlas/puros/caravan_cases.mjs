// Caravan contract cases (E2). Offline, synthetic.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync as rd } from 'node:fs';
const require = createRequire(import.meta.url);
const C = require('./caravan.js');
const S = JSON.parse(rd(new URL('../../data/caravana_schema.json', import.meta.url), 'utf8'));
const base = () => ({ route: { from_place: 'puerto_a', to_place: 'puerto_b' }, state: 'PROPOSED', cargo: [{ resource: 'cobre', amount: 40 }], cycle_proposed: 10, cycle_expires: 14, signature: { state: 'REQUIRED' } });

test('schema matches the module', () => {
  assert.equal(S.$id, 'preceptoros:caravana/1');
  assert.equal(S.additionalProperties, false);
  assert.deepEqual(S.properties.state.enum, C.ESTADOS);
  assert.deepEqual(S.properties.cargo.items.properties.resource.enum, C.RECURSOS);
});

test('well-formed: no failures', () => {
  assert.deepEqual(C.valida(base()), []);
});

test('valid transitions', () => {
  assert.equal(C.transicion('PROPOSED', 'accept'), 'ACTIVE');
  assert.equal(C.transicion('PROPOSED', 'expire'), 'EXPIRED');
  assert.equal(C.transicion('PROPOSED', 'no_data'), 'NO_DATA');
  assert.equal(C.transicion('ACTIVE', 'intercept'), 'INTERCEPTED');
  assert.equal(C.transicion('INTERCEPTED', 'flee'), 'FLED');
  assert.equal(C.transicion('INTERCEPTED', 'expire'), 'EXPIRED');
  assert.equal(C.transicion('ACTIVE', { tipo: 'complete', firma: 'SIGNED' }), 'COMPLETED');
});

test('invalid transitions: NO_DATA', () => {
  assert.equal(C.transicion('PROPOSED', 'complete'), 'NO_DATA');
  assert.equal(C.transicion('PROPOSED', 'intercept'), 'NO_DATA');
  assert.equal(C.transicion('COMPLETED', 'accept'), 'NO_DATA');
  assert.equal(C.transicion('ACTIVE', 'mirar_reloj'), 'NO_DATA');
  assert.equal(C.transicion('ACTIVE', 'flee'), 'NO_DATA'); // fleeing needs an interception first
  assert.equal(C.transicion('INTERCEPTED', { tipo: 'complete', firma: 'SIGNED' }), 'NO_DATA');
  assert.equal(C.transicion('NO_DATA', 'accept'), 'NO_DATA');
});

test('unsigned complete: EMULATED', () => {
  assert.equal(C.transicion('ACTIVE', { tipo: 'complete', firma: 'REQUIRED' }), 'EMULATED');
  assert.equal(C.transicion('ACTIVE', 'complete'), 'EMULATED');
});

test('COMPLETED needs SIGNED', () => {
  const c = { ...base(), state: 'COMPLETED' };
  assert.ok(C.valida(c).some((f) => /signature/.test(f)));
  assert.deepEqual(C.valida({ ...c, state: 'EMULATED' }), []);
  assert.deepEqual(C.valida({ ...c, signature: { state: 'SIGNED' } }), []);
});

test('bad amount fails', () => {
  for (const amount of [1.5, 0, -3, '3', NaN, 1000001]) {
    const c = base(); c.cargo[0].amount = amount;
    assert.ok(C.valida(c).length > 0, String(amount));
  }
});

test('extra field fails', () => {
  const route = base(); route.route.extra = 'x';
  const cargo = base(); cargo.cargo[0].extra = 1;
  const sig = base(); sig.signature.extra = true;
  for (const c of [{ ...base(), extra: 1 }, route, cargo, sig]) assert.ok(C.valida(c).length > 0);
});

test('bad route or cargo fails', () => {
  const same = base(); same.route.to_place = 'puerto_a';
  const res = base(); res.cargo[0].resource = 'oro';
  const vacio = base(); vacio.cargo = [];
  const cuenta = base(); cuenta.route.from_place = 'Cuenta 42';
  for (const c of [same, res, vacio, cuenta]) assert.ok(C.valida(c).length > 0);
});

test('public event is small and bare', () => {
  const c = { ...base(), state: 'ACTIVE' };
  const ev = C.evento_publico(c), json = JSON.stringify(ev);
  assert.doesNotMatch(json, /signature|cargo|cycle|resource|amount|account|user/);
  assert.ok(Buffer.byteLength(json) < 1024);
  assert.equal(ev.state, 'ACTIVE');
  assert.deepEqual(ev.route, c.route);
});

test('invalid public event: NO_DATA', () => {
  const ev = C.evento_publico({});
  assert.equal(ev.state, 'NO_DATA');
  assert.doesNotMatch(JSON.stringify(ev), /signature/);
});

test('no random, clock or network', () => {
  const src = rd(new URL('./caravan.js', import.meta.url), 'utf8');
  assert.doesNotMatch(src, /Math\.random|\bDate\b|performance|fetch\(|XMLHttpRequest|require\(|https?:/);
});
