// Cases for shared crab presence (Seam A, pure core, not served). Uso: node --test atlas/puros/crab_presence_cases.mjs
// Real Ed25519 keys and signatures (WebCrypto, the same primitive visitor_account.js uses), one authority, two
// visitors. What this proves is the LAW in one process; it is not transport, not a server, not multiplayer in production.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { webcrypto as wc } from 'node:crypto';
const require = createRequire(import.meta.url);
const P = require('./crab_presence.js'), WALK = require('../../public/game/visitor_walk.js');

const enc = new TextEncoder();
const hex = (b) => Array.from(new Uint8Array(b), (v) => v.toString(16).padStart(2, '0')).join('');
const unhex = (h) => Uint8Array.from(h.match(/../g), (x) => parseInt(x, 16));
const digest = async (t) => hex(await wc.subtle.digest('SHA-256', enc.encode(t)));
async function verify(keyHex, text, signature) {
  try {
    const k = await wc.subtle.importKey('raw', unhex(keyHex), 'Ed25519', false, ['verify']);
    return await wc.subtle.verify('Ed25519', k, unhex(signature.slice(8)), enc.encode(text));
  } catch { return false; }
}
// A floor of sand around the cabin with one water cell to the east of 1,0 and nothing beyond radius 3.
const cells = { at: {} };
for (let q = -3; q <= 3; q++) { for (let r = -3; r <= 3; r++) { cells.at[q + ',' + r] = [q, r, 1, q === 2 && r === 0 ? 'water' : 'floor']; } }
const deps = { verify, digest, walk: WALK, cells };
const LAW = { stale_after: 3, gone_after: 6, max_visits: 8 }; // a FIXTURE for these cases, not the Sovereign's numbers

// A visitor as the browser would be: an ephemeral key, its own chain, its own walker on the same floor.
async function visitor() {
  const keys = await wc.subtle.generateKey('Ed25519', false, ['sign', 'verify']);
  const key = hex(await wc.subtle.exportKey('raw', keys.publicKey));
  let seq = 0, prev = 'genesis';
  const local = WALK.create(cells, [0, 0]);
  return { key, local,
    async sign(dir, change) {
      const record = dir === null ? { esquema: P.BEAT, seq: seq + 1, prev, clave_publica: key } : { esquema: P.SCHEMA, dir, seq: seq + 1, prev, clave_publica: key }, text = JSON.stringify(record);
      const signature = 'ed25519:' + hex(await wc.subtle.sign('Ed25519', keys.privateKey, enc.encode(text)));
      return { record: change ? change(record) : record, signature, commit() { seq++; prev = null; return digest(text).then((h) => { prev = h; }); } };
    } };
}
async function world(n) {
  let state = P.empty(); const vs = [];
  for (let i = 0; i < n; i++) { const v = await visitor(); const o = await P.open(state, { key: v.key, consent: true, tick: 0 }, LAW, deps); assert.equal(o.ok, true); state = o.state; vs.push(v); }
  return { state, vs };
}
async function walk(w, v, dir, tick) {
  const m = await v.sign(dir), r = await P.step(w.state, { ...m, tick }, LAW, deps);
  if (r.ok) { w.state = r.state; await m.commit(); if (dir !== null) { v.local.step(dir); } }
  return r;
}

test('two visitors, one accepted step: both read the same crab at the same cell', async () => {
  const w = await world(2), [a, b] = w.vs;
  const r = await walk(w, a, 'north-west', 1);
  assert.equal(r.ok, true);
  assert.deepEqual(r.at, { q: 0, r: -1 });
  assert.deepEqual(r.at, { q: a.local.here().q, r: a.local.here().r }); // the authority's cell is the cell A walked to
  const seenByA = JSON.stringify(P.view(w.state, 1, LAW)), seenByB = JSON.stringify(P.view(w.state, 1, LAW));
  assert.equal(seenByA, seenByB);
  const crabs = P.view(w.state, 1, LAW).crabs;
  assert.equal(crabs.length, 2);
  assert.equal(crabs.filter((c) => c.q === 0 && c.r === -1 && c.seal === 'LIVE').length, 1);
  assert.equal(crabs.filter((c) => c.q === 0 && c.r === 0).length, 1); // B has not moved
});

test('a chain of steps keeps the authority and the visitor on the same cell', async () => {
  const w = await world(1), [a] = w.vs;
  for (const [i, d] of ['east', 'south-west', 'west', 'north-west', 'north-east'].entries()) { assert.equal((await walk(w, a, d, i + 1)).ok, true, d); }
  const c = P.view(w.state, 5, LAW).crabs[0], h = a.local.here();
  assert.deepEqual([c.q, c.r], [h.q, h.r]);
});

test('the view carries no key, no sequence and no hash, and fits one frame', async () => {
  const w = await world(2); await walk(w, w.vs[0], 'east', 1);
  const text = JSON.stringify(P.view(w.state, 1, LAW));
  w.vs.forEach((v) => assert.equal(text.includes(v.key), false));
  assert.deepEqual(Object.keys(P.view(w.state, 1, LAW).crabs[0]).sort(), ['id', 'q', 'r', 'seal']);
  assert.ok(enc.encode(text).length < 1024);
  assert.match(P.view(w.state, 1, LAW).crabs[0].id, /^crab-[0-9a-f]{8}$/);
});

test('sabotage: an altered step, a forged signer, a replay, a gap and a broken chain are all refused; nothing moves', async () => {
  const w = await world(2), [a, b] = w.vs, before = JSON.stringify(w.state);
  const refuse = async (m, cause) => { const r = await P.step(w.state, { ...m, tick: 1 }, LAW, deps); assert.deepEqual([r.ok, r.cause], [false, cause]); assert.equal(JSON.stringify(r.state), before); };
  await refuse(await a.sign('east', (r) => ({ ...r, dir: 'west' })), 'signature_rejected');                 // changed after signing
  await refuse(await b.sign('east', (r) => ({ ...r, clave_publica: a.key })), 'signature_rejected');        // B speaks as A
  await refuse(await a.sign('east', (r) => ({ ...r, seq: 3 })), 'step_out_of_order');
  await refuse(await a.sign('east', (r) => ({ ...r, prev: 'f'.repeat(64) })), 'chain_broken');
  await refuse(await a.sign('up'), 'direction_unknown');
  await refuse(await a.sign('east', (r) => ({ ...r, q: 9 })), 'record_scope_rejected');                     // a visitor may not declare a cell
  await refuse({ record: (await a.sign('east')).record, signature: 'ed25519:' + '0'.repeat(128) }, 'signature_rejected');
  const good = await a.sign('east'); let r = await P.step(w.state, { ...good, tick: 1 }, LAW, deps);
  assert.equal(r.ok, true); w.state = r.state;
  r = await P.step(w.state, { ...good, tick: 2 }, LAW, deps);                                               // the same packet again
  assert.deepEqual([r.ok, r.cause], [false, 'replayed_step']);
});

test('sabotage: the floor decides; water and the end of the map are refused by the same walker', async () => {
  const w = await world(1), [a] = w.vs;
  assert.equal((await walk(w, a, 'east', 1)).ok, true);          // 1,0
  const wet = await walk(w, a, 'east', 2);                        // 2,0 is water
  assert.deepEqual([wet.ok, wet.cause], [false, 'floor_refused']);
  assert.deepEqual(P.view(w.state, 2, LAW).crabs[0].q, 1);
});

test('no consent, no visit; a full world says so; one key opens once', async () => {
  const v = await visitor();
  assert.equal((await P.open(P.empty(), { key: v.key, consent: false, tick: 0 }, LAW, deps)).cause, 'consent_required');
  assert.equal((await P.open(P.empty(), { key: 'short', consent: true, tick: 0 }, LAW, deps)).cause, 'visit_malformed');
  const w = await world(LAW.max_visits);
  assert.equal((await P.open(w.state, { key: v.key, consent: true, tick: 0 }, LAW, deps)).cause, 'world_full');
  assert.equal((await P.open(w.state, { key: w.vs[0].key, consent: true, tick: 0 }, LAW, deps)).cause, 'visit_already_open');
});

test('disconnect: silent → STALE → forgotten whole; a step after that is an unknown visit, never a ghost', async () => {
  const w = await world(2), [a, b] = w.vs;
  await walk(w, a, 'east', 1);
  const sealOf = (tick) => Object.fromEntries(P.view(w.state, tick, LAW).crabs.map((c) => [c.q + ',' + c.r, c.seal]));
  assert.deepEqual(sealOf(2), { '1,0': 'LIVE', '0,0': 'LIVE' });
  assert.deepEqual(sealOf(3), { '1,0': 'LIVE', '0,0': 'STALE' });        // B opened at tick 0 and never stepped
  assert.deepEqual(sealOf(4), { '1,0': 'STALE', '0,0': 'STALE' });
  assert.equal((await walk(w, a, 'west', 5)).ok, true);                  // A comes back before being forgotten: LIVE again; both stand on 0,0 now
  assert.equal(P.view(w.state, 5, LAW).crabs.filter((c) => c.seal === 'LIVE').length, 1);
  assert.equal(P.view(w.state, 6, LAW).crabs.length, 1);                 // B is gone at tick 6
  const kept = P.forget(w.state, 6, LAW);
  assert.equal(JSON.stringify(kept).includes(b.key), false);             // nothing of B remains, key included
  const late = await P.step(kept, { ...(await b.sign('east')), tick: 7 }, LAW, deps);
  assert.deepEqual([late.ok, late.cause], [false, 'visit_unknown']);
});

test('the law is not invented here: without the three numbers the piece refuses to run', async () => {
  const v = await visitor();
  for (const law of [undefined, {}, { stale_after: 3, gone_after: 6 }, { stale_after: 6, gone_after: 3, max_visits: 8 }, { stale_after: 0, gone_after: 6, max_visits: 8 }]) {
    assert.throws(() => P.view(P.empty(), 0, law), /law_not_signed/);
    await assert.rejects(() => P.open(P.empty(), { key: v.key, consent: true, tick: 0 }, law, deps), /law_not_signed/);
  }
  const src = readFileSync(new URL('./crab_presence.js', import.meta.url), 'utf8');
  assert.doesNotMatch(src, /(stale_after|gone_after|max_visits)\s*[:=]\s*\d/); // no default hidden in the code
});

test('pure: no clock, no randomness, no network, no storage', () => {
  const src = readFileSync(new URL('./crab_presence.js', import.meta.url), 'utf8');
  assert.doesNotMatch(src, /Math\.random|Date\.now|new Date|fetch\(|XMLHttpRequest|WebSocket|localStorage|setTimeout|setInterval/);
});

// Round 3 (Mesa #34): the still visitor, the cell of arrival and the crowded place.
test('a still visitor stays LIVE with a signed beat on the same chain; a beat moves nothing', async () => {
  const w = await world(2), [a, b] = w.vs;
  await walk(w, a, 'east', 1);
  for (const t of [2, 3, 4, 5, 6, 7]) { const r = await walk(w, a, null, t); assert.equal(r.ok, true, 'beat at ' + t); assert.deepEqual(r.at, { q: 1, r: 0 }); }
  const crabs = P.view(w.state, 7, LAW).crabs;
  assert.deepEqual(crabs.map((c) => [c.q, c.r, c.seal]), [[1, 0, 'LIVE']]); // A beat and is LIVE; B never signed and is gone
  assert.equal((await walk(w, a, 'west', 8)).ok, true);                      // the chain goes on through beats and steps
});
test('sabotage: a beat is not replayed, not forged, not sent too often, and carries nothing else', async () => {
  const w = await world(1), [a] = w.vs, law = { ...LAW, beat_gap: 2 };
  const send = async (m, tick) => P.step(w.state, { ...m, tick }, law, deps);
  const first = await a.sign(null); let r = await send(first, 1);
  assert.equal(r.ok, true); w.state = r.state; await first.commit();
  assert.equal((await send(first, 3)).cause, 'replayed_step');
  assert.equal((await send(await a.sign(null), 2)).cause, 'beat_too_soon');
  assert.equal((await send(await a.sign(null, (x) => ({ ...x, dir: 'east' })), 3)).cause, 'record_scope_rejected');
  assert.equal((await send({ record: (await a.sign(null)).record, signature: 'ed25519:' + '0'.repeat(128) }, 3)).cause, 'signature_rejected');
  assert.equal((await send(await a.sign(null), 3)).ok, true);
  await assert.rejects(() => P.step(w.state, { ...first, tick: 9 }, { ...LAW, beat_gap: -1 }, deps), /law_not_signed/);
});
test('a crab joins on a cell of the floor, or not at all', async () => {
  const v = await visitor();
  const on = await P.open(P.empty(), { key: v.key, consent: true, tick: 0, start: [1, -1] }, LAW, deps);
  assert.equal(on.ok, true);
  assert.deepEqual(P.view(on.state, 0, LAW).crabs.map((c) => [c.q, c.r]), [[1, -1]]);
  assert.equal((await P.open(P.empty(), { key: v.key, consent: true, tick: 0, start: [99, 99] }, LAW, deps)).cause, 'start_not_on_the_floor');
  assert.equal((await P.open(P.empty(), { key: v.key, consent: true, tick: 0, start: 'here' }, LAW, deps)).cause, 'visit_malformed');
});
test('a crowded place is read by region: nearest first, one frame, the rest counted, the frame never grows', async () => {
  const big = { stale_after: 3, gone_after: 6, max_visits: 60 }; let state = P.empty(); const spots = [];
  for (let q = -3; q <= 3; q++) { for (let r = -3; r <= 3; r++) { if (!(q === 2 && r === 0)) { spots.push([q, r]); } } }
  for (const s of spots) { const v = await visitor(); state = (await P.open(state, { key: v.key, consent: true, tick: 0, start: s }, big, deps)).state; }
  assert.throws(() => P.view(state, 0, big), /view_over_budget/);                 // 48 crabs do not fit one frame
  const near = P.view(state, 0, big, { q: 0, r: 0, radius: 1 });
  assert.equal(near.crabs.length, 7); assert.equal(near.more, undefined);         // the cell and its six neighbours
  assert.deepEqual([near.crabs[0].q, near.crabs[0].r], [0, 0]);
  const wide = P.view(state, 0, big, { q: 0, r: 0, radius: 9 });
  assert.ok(enc.encode(JSON.stringify(wide)).length < 1024);
  assert.equal(wide.crabs.length + wide.more, 48);
  assert.ok(wide.crabs.length >= 17 && wide.more > 0);
  const d = (c) => (Math.abs(c.q) + Math.abs(c.r) + Math.abs(c.q + c.r)) / 2;
  for (let i = 1; i < wide.crabs.length; i++) { assert.ok(d(wide.crabs[i]) >= d(wide.crabs[i - 1])); }
  assert.equal(P.view(state, 0, big, { q: 50, r: 50, radius: 2 }).crabs.length, 0);
  assert.throws(() => P.view(state, 0, big, { q: 0, r: 0, radius: -1 }), /region_malformed/);
});
