import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync, statSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { gzipSync } from 'node:zlib';

const require = createRequire(import.meta.url);
const K = require('../public/game/canon.js');
const N = require('../public/game/nodos.js');
const C = require('../public/game/nodos-cedulas.js');
const path = new URL('../public/game/node_reception_contract.js', import.meta.url);
const contract = () => require(path.pathname);
const copy = x => JSON.parse(JSON.stringify(x));
const seal = c => { delete c.sha256; c.sha256 = K.huella(c); return c; };
function credential() {
  return seal({ esquema: 'preceptoros.cedula-nodo/1', nodo: 'nodo.1.example', admin: 'a1'.repeat(32),
    dispositivos: [{ clave: 'b2'.repeat(32), estado: 'solicitado' }], plan_sha256: 'c3'.repeat(32),
    firma_ssh: '-----BEGIN SSH SIGNATURE-----\nAAAA\n-----END SSH SIGNATURE-----\n', autenticidad: 'SIGNED' });
}
const packet = c => ({ esquema: 'preceptoros/cedula-nodo/1', pares: [c || credential()], firma: null });

test('signed declaration no longer fails the legacy game authenticity predicate', () => {
  const catalog = copy(C), c = catalog.nodos[0];
  c.firma_ssh = credential().firma_ssh; c.autenticidad = 'SIGNED'; seal(c);
  assert.equal(N.validaCedulas(catalog), '');
});
test('the definitive route is isolated from the existing Agora transport', () => {
  assert.equal(contract().ENDPOINT, 'https://api.preceptoros.org/aduana/cedulas');
  assert.equal(contract().METHOD, 'POST');
  const src = readFileSync(new URL('../public/assets/enviar.js', import.meta.url), 'utf8');
  assert.match(src, /API \+ '\/reto'/); assert.match(src, /API \+ '\/paquetes'/);
});
test('valid shape remains unverified, unsigned by silicon, and without authority', () => {
  assert.deepEqual(contract().packet(packet()), {
    valid: true, code: 'pending', estado: 'NO_DATA', autenticidad: 'NO_DATA', firma: null, authority: false
  });
});
test('wire authenticity is SIGNED, NO_DATA or absent; a verified claim is rejected', () => {
  const R = contract();
  assert.deepEqual(R.AUTHENTICITY, ['SIGNED', 'NO_DATA']);
  for (const value of ['SIGNED', 'NO_DATA', undefined]) {
    const c = credential(); if (value === undefined) delete c.autenticidad; else c.autenticidad = value;
    assert.equal(R.credential(seal(c)).valid, true);
  }
  for (const value of ['VERIFIED', 'OK', 'SIGNED by someone', null, true]) {
    const c = credential(); c.autenticidad = value;
    assert.equal(R.credential(seal(c)).code, 'authenticity');
  }
});
test('required credential fields are checked individually', () => {
  for (const field of ['esquema', 'nodo', 'admin', 'dispositivos', 'plan_sha256', 'firma_ssh', 'sha256']) {
    const c = credential(); delete c[field];
    assert.equal(contract().credential(c).valid, false, field);
  }
});
test('field types, allowed keys and device states fail closed', () => {
  for (const change of [{ esquema: 'other' }, { nodo: 'nodo.invalid' }, { admin: null },
    { plan_sha256: 'bad' }, { dispositivos: {} }, { extra: true },
    { dispositivos: [{ clave: 'bad', estado: 'linkeado' }] },
    { dispositivos: [{ clave: 'b2'.repeat(32), estado: 'unknown' }] },
    { dispositivos: [{ clave: 'b2'.repeat(32), estado: 'linkeado', extra: true }] }]) {
    assert.equal(contract().credential(seal({ ...credential(), ...change })).valid, false);
  }
});
test('legacy delegation fields survive unchanged without granting capabilities', () => {
  const c = credential(); Object.assign(c.dispositivos[0], { tipo: 'agente',
    ambito: ['herramientas'], caduca: '2026-10-16T23:00:00Z' }); seal(c);
  const before = JSON.stringify(c), R = contract();
  assert.equal(R.credential(c).valid, true); assert.equal(R.credential(c).authority, false);
  assert.equal(JSON.stringify(c), before);
  c.dispositivos[0].ambito = ['unknown']; assert.equal(R.credential(seal(c)).valid, false);
});
test('missing or malformed SSH armor is not a signed candidate', () => {
  for (const signature of [null, '', 'ed25519:invented', {}, '-----BEGIN SSH SIGNATURE-----']) {
    assert.equal(contract().credential(seal({ ...credential(), firma_ssh: signature })).valid, false);
  }
});
test('human signature and outer null signature are distinct fields', () => {
  for (const value of ['invented', true, {}]) {
    assert.equal(contract().packet({ ...packet(), firma: value }).valid, false);
    assert.equal(contract().credential(seal({ ...credential(), firma: value })).valid, false);
  }
  const c = credential(); c.firma = null; assert.equal(contract().credential(seal(c)).valid, true);
});
test('the packet contains exactly one credential under the measured schema', () => {
  for (const value of [null, [], {}, { ...packet(), esquema: 'other' }, { ...packet(), pares: [] },
    { ...packet(), pares: [credential(), credential()] }, { ...packet(), extra: true }]) {
    assert.equal(contract().packet(value).valid, false);
  }
});
test('SHA-256 covers the complete original credential except sha256 itself', () => {
  const c = credential(); c.admin = 'd4'.repeat(32);
  assert.equal(contract().credential(c).code, 'integrity');
  assert.equal(contract().credential(seal(c)).valid, true);
});
test('the signed body inherits the app exclusions without rewriting the document', () => {
  const c = credential(), R = contract(), body = JSON.parse(R.signedBody(c));
  for (const field of ['sha256', 'firma_ssh', 'firma', 'autenticidad']) assert.equal(field in body, false);
  assert.equal(body.plan_sha256, c.plan_sha256); assert.deepEqual(body.dispositivos, c.dispositivos);
  assert.equal(R.signedBody(c), JSON.stringify(K.ordena(body)));
});
test('the ecosystem packet stays strictly below 1 KiB, measured as UTF-8', () => {
  const R = contract(), raw = JSON.stringify(packet());
  assert.equal(R.MAX_BYTES, 1024); assert.equal(R.read(raw).valid, true);
  assert.equal(R.read(raw + ' '.repeat(1024 - Buffer.byteLength(raw))).code, 'size');
  assert.equal(R.read(' '.repeat(1024) + raw).code, 'size');
  assert.equal(R.read('é'.repeat(512)).code, 'size');
  assert.equal(R.read('é'.repeat(511)).code, 'shape');
  assert.equal(R.read('{').code, 'shape'); assert.equal(R.read(null).code, 'shape');
});
test('validation is deterministic and does not mutate a frozen packet', () => {
  const p = packet(), before = JSON.stringify(p);
  function freeze(x) { if (x && typeof x === 'object') { Object.values(x).forEach(freeze); Object.freeze(x); } }
  freeze(p); assert.deepEqual(contract().packet(p), contract().packet(p));
  assert.equal(JSON.stringify(p), before);
  const c = p.pares[0], reversed = Object.fromEntries(Object.entries(c).reverse());
  assert.deepEqual(contract().credential(reversed), contract().credential(c));
});
test('sparse or duplicate devices and trailing line breaks are rejected', () => {
  for (const change of [{ dispositivos: Array(1) }, { dispositivos: [credential().dispositivos[0], credential().dispositivos[0]] },
    { admin: 'a1'.repeat(32) + '\n' }, { nodo: 'nodo.1.example\n' }]) {
    assert.equal(contract().credential(seal({ ...credential(), ...change })).valid, false);
  }
});
test('a valid pending result cannot be promoted by editing its returned fields', () => {
  const r = contract().packet(packet()); assert.equal(Object.isFrozen(r), true);
  assert.throws(() => { r.authority = true; }, TypeError);
});
test('all causes have text in nine languages without exposing machine absence labels', () => {
  const R = contract(), codes = ['shape', 'size', 'signature', 'authenticity', 'integrity', 'pending'];
  assert.deepEqual(Object.keys(R.MESSAGES).sort(), ['ar','de','el','en','es','fr','it','pt','ru']);
  for (const lang of Object.keys(R.MESSAGES)) for (const code of codes) {
    assert.equal(Object.hasOwn(R.MESSAGES[lang], code), true);
    const text = R.message(code, lang); assert.equal(typeof text, 'string'); assert.ok(text.length);
    assert.equal(text, R.MESSAGES[lang][code]);
    assert.doesNotMatch(text, /NO_DATA|undefined|NaN/);
  }
});
test('loading and using the browser contract performs no network, DOM, storage or clock access', () => {
  const context = { AtlasCanon: K, TextEncoder };
  for (const name of ['fetch', 'document', 'localStorage', 'sessionStorage', 'Date', 'WebSocket']) {
    Object.defineProperty(context, name, { get() { throw Error('unexpected effect: ' + name); } });
  }
  runInNewContext(readFileSync(path, 'utf8'), context);
  assert.equal(context.AtlasNodeReception.packet(packet()).authority, false);
});
test('the seven semantic seals remain frozen; STATIC has no invented color', () => {
  const S = require('../public/game/tabla_semantica.js');
  assert.equal(Object.keys(S.TABLA).length, 7); assert.equal(S.de('STATIC'), null);
});
test('the new served module stays below both source and gzip ceilings', () => {
  assert.ok(statSync(path).size < 16384);
  assert.ok(gzipSync(readFileSync(path), { level: 9 }).length <= 7168);
});
