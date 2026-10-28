import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync, statSync } from 'node:fs';
import vm from 'node:vm';
const require = createRequire(import.meta.url);
const P = require('../public/game/en301_practice_model.js');
const K = require('../public/game/canon.js');
const V = require('../public/game/valores.js');
const CT = require('../public/game/combate_ticks.js');
const SRC = new URL('../public/game/en301_practice_model.js', import.meta.url);

test('practice uses measured rounds and a reproducible receipt', () => {
 const m=P.create(K.sha('practice-test'));
 assert.equal(m.frame().tick,0);
 assert.equal(m.choose('shield').ok,true);
 let n=0;while(!m.frame().ended && n++<41)m.step();
 assert.equal(m.frame().ended,true);
 const r=m.receipt();assert.equal(r.ok,true);
 assert.ok(new TextEncoder().encode(r.text).length<200);
 assert.equal(r.packet.f,null);
 assert.equal(P.verify(r.packet).ok,true);
});
test('unknown stances fail closed', () => {
 const m=P.create(K.sha('practice-test'));
 assert.equal(m.choose('unknown').ok,false);
});

const WINNER = { defensa: 0, asalto: 1, empate: 2 };
const utf8 = (text) => new TextEncoder().encode(text).length;
const seedNamed = (name) => K.sha('en301-test:' + name);

function playOut(m) { while (m.step().ok) {} }

function stepN(m, n) {
  for (let i = 0; i < n; i++) { if (!m.step().ok) { return false; } }
  return true;
}

function findSeed(label, run, good) {
  for (let i = 0; i < 400; i++) {
    const seed = K.sha(`en301-find:${label}:${i}`);
    const m = P.create(seed);
    if (!run(m)) { continue; }
    playOut(m);
    if (good(m.trace())) { return seed; }
  }
  throw new Error(`no seed found for ${label}`);
}

function hitsBothWays(trace) {
  const sides = new Set(trace.filter((r) => r[4] >= 0).map((r) => r[1]));
  return sides.has(0) && sides.has(1);
}

function validPacket() {
  const m = P.create(seedNamed('valid'));
  m.choose('shield');
  playOut(m);
  return m.receipt().packet;
}

function effective(base, stance) {
  const a = { ...base };
  if (stance === 'shield') { a.arm = base.arm + 2; a.atk = Math.max(1, base.atk - 1); }
  if (stance === 'pike') { a.atk = base.atk + 2; a.vel = Math.max(1, base.vel - 1); }
  if (stance === 'bow') { a.vel = base.vel + 2; a.arm = Math.max(0, base.arm - 1); }
  return a;
}

function checkDamage(seed, orders, trace) {
  const T = P.teams(seed);
  const def = CT.unidades([T.def], 0, V)[0];
  const asaBase = CT.unidades([T.asa], 1, V)[0];
  const stanceAt = (n) => orders.reduce((s, o) => (o.tick <= n ? o.stance : s), null);
  const div = V.combate.armadura_div;
  let checked = 0;
  for (const [n, lado, , , d] of trace) {
    if (d < 0) { continue; }
    const s = stanceAt(n);
    const asa = s ? effective(asaBase, s) : asaBase;
    const esperado = lado === 1
      ? Math.max(1, asa.atk - Math.floor(def.arm / div))
      : Math.max(1, def.atk - Math.floor(asa.arm / div));
    assert.equal(d, esperado, `round ${n} side ${lado} under ${s}`);
    checked++;
  }
  return checked;
}

test('no choice is exactly the CT baseline, round by round', () => {
  const seed = seedNamed('baseline');
  const m = P.create(seed);
  playOut(m);
  const T = P.teams(seed);
  const c = CT.combate([T.def], [T.asa], seed);
  assert.equal(JSON.stringify(m.trace()), JSON.stringify(c.registro));
  assert.equal(m.frame().tick, c.rondas);
  assert.equal(m.frame().winner, c.gana);
  assert.ok(['defensa', 'asalto', 'empate'].includes(m.frame().winner));
  assert.equal(m.frame().stance, null);
  const r = m.receipt();
  assert.deepEqual(r.packet.v, [WINNER[c.gana], c.rondas, c.vida_por_mil[0], c.vida_por_mil[1]]);
});

for (const stance of ['shield', 'pike', 'bow']) {
  test(`posture ${stance}: damage from both sides follows the rules from the original stats`, () => {
    const seed = findSeed(stance, (m) => m.choose(stance).ok, hitsBothWays);
    const m = P.create(seed);
    m.choose(stance);
    playOut(m);
    assert.ok(checkDamage(seed, [{ tick: 1, stance }], m.trace()) > 0);
  });
}

test('posture is not cumulative: a second shield recomputes from the original stats', () => {
  const run = (m) => m.choose('shield').ok && stepN(m, 3) && m.choose('shield').ok;
  const seed = findSeed('noncumulative', run, hitsBothWays);
  const m = P.create(seed);
  run(m);
  playOut(m);
  assert.ok(checkDamage(seed, [{ tick: 1, stance: 'shield' }, { tick: 4, stance: 'shield' }], m.trace()) > 0);
});

test('switching stance replaces the previous posture from its tick on', () => {
  const run = (m) => m.choose('pike').ok && stepN(m, 3) && m.choose('bow').ok;
  const seed = findSeed('switch', run, hitsBothWays);
  const m = P.create(seed);
  run(m);
  playOut(m);
  assert.ok(checkDamage(seed, [{ tick: 1, stance: 'pike' }, { tick: 4, stance: 'bow' }], m.trace()) > 0);
});

test('cooldown: next order only at tick >= last + 3, and the refusal says when', () => {
  const seed = findSeed('cooldown', (m) => m.choose('shield').ok && stepN(m, 3) && !m.frame().ended, () => true);
  const m = P.create(seed);
  assert.equal(m.frame().ready_at, 1);
  assert.equal(m.choose('shield').tick, 1);
  assert.equal(m.frame().ready_at, 4);
  const dup = m.choose('pike');
  assert.equal(dup.ok, false);
  assert.match(dup.cause, /already ordered for tick 1/);
  stepN(m, 2);
  const early = m.choose('pike');
  assert.equal(early.ok, false);
  assert.match(early.cause, /cooldown.*tick 4/);
  stepN(m, 1);
  const ok = m.choose('pike');
  assert.equal(ok.ok, true);
  assert.equal(ok.tick, 4);
});

test('choose after the battle ended is refused, and step does not advance', () => {
  const m = P.create(seedNamed('ended'));
  playOut(m);
  assert.equal(m.frame().ended, true);
  assert.equal(m.choose('shield').ok, false);
  const before = JSON.stringify(m.frame());
  assert.equal(m.step().ok, false);
  assert.equal(JSON.stringify(m.frame()), before);
});

test('only shield, pike and bow are accepted; anything else is refused and changes nothing', () => {
  const m = P.create(seedNamed('stance'));
  for (const bad of ['Shield', 'retreat', '', undefined, null, 42, ['shield'], { stance: 'pike' }]) {
    const r = m.choose(bad);
    assert.equal(r.ok, false);
    assert.equal(typeof r.cause, 'string');
  }
  assert.equal(m.frame().stance, null);
  assert.equal(m.frame().ready_at, 1);
  assert.deepEqual([...P.STANCES], ['shield', 'pike', 'bow']);
});

test('step advances exactly one real round, with no clock involved', () => {
  const m = P.create(seedNamed('step'));
  assert.equal(m.frame().tick, 0);
  assert.equal(m.step().tick, 1);
  assert.equal(m.frame().tick, 1);
});

test('frame is a small plain snapshot with the agreed fields and no trace', () => {
  const seed = findSeed('frame', (m) => m.choose('shield').ok && stepN(m, 1) && !m.frame().ended, () => true);
  const m = P.create(seed);
  m.choose('shield');
  stepN(m, 1);
  const f = m.frame();
  assert.deepEqual(Object.keys(f), ['schema', 'seed', 'tick', 'cooldown_ticks', 'ready_at', 'stance', 'units', 'ended', 'winner', 'stamp', 'cause']);
  assert.equal(f.schema, 'preceptoros.practice/1');
  assert.equal(f.seed, seed);
  assert.equal(f.tick, 1);
  assert.equal(f.cooldown_ticks, 3);
  assert.equal(f.ready_at, 4);
  assert.equal(f.stance, 'shield');
  assert.equal(f.winner, null);
  assert.equal(f.stamp, 'SIMULATED');
  assert.match(f.cause, /no human signature/);
  assert.equal(Object.getPrototypeOf(f), Object.prototype);
  assert.ok(utf8(JSON.stringify(f)) < 1024);
  playOut(m);
  assert.ok(utf8(JSON.stringify(m.frame())) < 1024);
  assert.ok(utf8(JSON.stringify(P.create(seed).frame())) < 1024);
});

test('receipt: exact fields, under 200 UTF-8 bytes, hashes recomputed from teams and trace', () => {
  const seed = seedNamed('receipt');
  const m = P.create(seed);
  assert.equal(m.receipt().ok, false);
  m.choose('shield');
  playOut(m);
  const r = m.receipt();
  assert.equal(r.ok, true);
  assert.deepEqual(Object.keys(r.packet).sort(), ['e', 'f', 'h', 'o', 's', 'v']);
  assert.equal(r.packet.s, seed);
  assert.equal(r.packet.e, K.huella(P.teams(seed)).slice(0, 16));
  assert.equal(r.packet.h, K.huella(m.trace()).slice(0, 16));
  assert.equal(r.packet.f, null);
  assert.equal(r.text, JSON.stringify(r.packet));
  assert.ok(utf8(r.text) < 200);
});

test('multiple orders are encoded in order, big endian, and verify on replay', () => {
  const run = (m) => m.choose('shield').ok && stepN(m, 3) && m.choose('bow').ok;
  const seed = findSeed('multi', run, () => true);
  const m = P.create(seed);
  run(m);
  playOut(m);
  const r = m.receipt();
  assert.equal(r.ok, true);
  assert.deepEqual([...P.base64.decode(r.packet.o)], [0, 192, 2, 66]);
  assert.equal(P.verify(r.packet).ok, true);
});

test('14 orders, the most a side-1 unit 0 can hold, still fit under 200 bytes', () => {
  const ticks = Array.from({ length: 14 }, (_, i) => 1 + 3 * i);
  assert.equal(ticks[13], 40);
  const bytes = ticks.flatMap((t) => { const c = (t * 2 + 1) * 64 + 2; return [c >> 8, c & 255]; });
  const o = P.base64.encode(bytes);
  assert.equal(o.length, 40);
  const packet = { s: 'f'.repeat(64), e: '0'.repeat(16), o, v: [2, 40, 1000, 1000], h: 'a'.repeat(16), f: null };
  assert.ok(utf8(JSON.stringify(packet)) < 200, `size ${utf8(JSON.stringify(packet))}`);
});

test('fork K keeps the prefix before K identical, drops later orders, and replays from tick 0', () => {
  const run = (m) => m.choose('shield').ok && stepN(m, 3) && m.choose('bow').ok;
  const seed = findSeed('fork', run, () => true);
  const m = P.create(seed);
  run(m);
  playOut(m);
  const f = m.fork(3);
  assert.equal(f.ok, true);
  assert.equal(f.session.frame().tick, 2);
  assert.equal(f.session.frame().stance, 'shield');
  assert.deepEqual(f.session.trace(), m.trace().filter((r) => r[0] < 3));
  playOut(f.session);
  const r = f.session.receipt();
  assert.equal(r.packet.o.length, 4);
  assert.equal(P.verify(r.packet).ok, true);
});

test('fork past a later order keeps every order before that tick', () => {
  const run = (m) => m.choose('shield').ok && stepN(m, 3) && m.choose('bow').ok;
  const seed = findSeed('fork-keep', run, () => true);
  const m = P.create(seed);
  run(m);
  playOut(m);
  const f = m.fork(5);
  assert.equal(f.ok, true);
  playOut(f.session);
  const r = f.session.receipt();
  assert.equal(r.packet.o.length, 8);
  assert.equal(P.verify(r.packet).ok, true);
});

test('fork refuses ticks outside 1..currentTick+1 and 1..40', () => {
  const m = P.create(seedNamed('bounds'));
  for (const bad of [0, -1, 1.5, '2', 2, 41]) {
    assert.equal(m.fork(bad).ok, false, String(bad));
  }
  assert.equal(m.fork(1).ok, true);
});

test('a fork starts clean: no old victory is counted', () => {
  const m = P.create(seedNamed('reset'));
  m.choose('shield');
  playOut(m);
  assert.equal(m.frame().ended, true);
  const f = m.fork(1);
  assert.equal(f.ok, true);
  const ff = f.session.frame();
  assert.equal(ff.ended, false);
  assert.equal(ff.winner, null);
  assert.equal(ff.tick, 0);
  assert.equal(f.session.receipt().ok, false);
});

test('repeat deterministic: same seed and orders give the same trace, frame and receipt', () => {
  const run = () => {
    const m = P.create(seedNamed('repeat'));
    m.choose('pike');
    stepN(m, 3);
    m.choose('bow');
    playOut(m);
    return { trace: m.trace(), frame: m.frame(), receipt: m.receipt() };
  };
  assert.equal(JSON.stringify(run()), JSON.stringify(run()));
});

test('teams: deterministic tc1 troop per side, seeded from the practice seed', () => {
  const seed = seedNamed('teams');
  const t = P.teams(seed);
  assert.deepEqual(t, { def: { tc: 'tc1', semilla: K.sha(seed + ':def') }, asa: { tc: 'tc1', semilla: K.sha(seed + ':asa') } });
  assert.deepEqual(P.teams(seed), t);
  assert.notEqual(t.def.semilla, t.asa.semilla);
});

test('invalid seed fails closed', () => {
  for (const bad of ['', 'ABC', K.sha('x').toUpperCase(), K.sha('x').slice(1), 123, null, undefined]) {
    assert.throws(() => P.create(bad));
    assert.throws(() => P.teams(bad));
  }
  assert.equal(P.verify({ ...validPacket(), s: 'NOPE' }).ok, false);
});

test('verify refuses a packet of 200 bytes or more', () => {
  const p = validPacket();
  const big = { ...p, o: p.o + 'AAAA'.repeat(40) };
  const r = P.verify(big);
  assert.equal(r.ok, false);
  assert.match(r.cause, /not under 200/);
});

test('verify rejects every altered field, each with a cause', () => {
  const p = validPacket();
  const noH = { ...p };
  delete noH.h;
  const cases = {
    'seed altered': { ...p, s: K.sha('someone else') },
    'team hash altered': { ...p, e: '0'.repeat(16) },
    'verdict altered': { ...p, v: [(p.v[0] + 1) % 3, p.v[1], p.v[2], p.v[3]] },
    'trace hash altered': { ...p, h: (p.h[0] === 'a' ? 'b' : 'a') + p.h.slice(1) },
    'signature present': { ...p, f: 'NO_DATA' },
    'extra field': { ...p, extra: 1 },
    'missing field': noH,
    'seed wrong type': { ...p, s: 123 },
    'verdict wrong type': { ...p, v: '0,1,2,3' },
    'orders not text': { ...p, o: 7 }
  };
  for (const [name, bad] of Object.entries(cases)) {
    const r = P.verify(bad);
    assert.equal(r.ok, false, name);
    assert.equal(typeof r.cause, 'string', name);
  }
  assert.equal(P.verify(p).ok, true);
});

test('verify rejects foreign side, foreign unit, bad tick, bad stance, cooldown, duplicates, disorder', () => {
  const p = validPacket();
  const orders = (codes) => P.base64.encode(codes.flatMap((c) => [c >> 8, c & 255]));
  const cases = {
    'foreign side (side 0, tick 1, shield)': [(1 * 2 + 0) * 16 * 4],
    'foreign unit (side 1, unit 1, tick 1)': [((1 * 2 + 1) * 16 + 1) * 4],
    'tick 0': [(0 * 2 + 1) * 64],
    'stance code 3': [(1 * 2 + 1) * 64 + 3],
    'cooldown broken (ticks 1 and 2)': [(1 * 2 + 1) * 64, (2 * 2 + 1) * 64],
    'duplicate tick (ticks 1 and 1)': [3 * 64, 3 * 64 + 1],
    'out of order (ticks 4 then 1)': [9 * 64, 3 * 64]
  };
  for (const [name, codes] of Object.entries(cases)) {
    const r = P.verify({ ...p, o: orders(codes) });
    assert.equal(r.ok, false, name);
    assert.equal(typeof r.cause, 'string', name);
  }
});

test('verify rejects non-canonical and odd-length orders', () => {
  const p = validPacket();
  const noncanonical = P.verify({ ...p, o: 'AAF=' });
  assert.equal(noncanonical.ok, false);
  assert.match(noncanonical.cause, /canonical/);
  const odd = P.verify({ ...p, o: 'AA==' });
  assert.equal(odd.ok, false);
  assert.match(odd.cause, /odd/);
});

test('base64 codec: strict, canonical, round-trips every byte pattern', () => {
  for (let n = 0; n < 9; n++) {
    const bytes = Array.from({ length: n }, (_, i) => (i * 37 + 11) & 255);
    assert.deepEqual([...P.base64.decode(P.base64.encode(bytes))], bytes);
  }
  assert.equal(P.base64.encode([]), '');
  assert.equal(P.base64.encode([0, 1]), 'AAE=');
  assert.equal(P.base64.decode('AAF='), null);
  assert.equal(P.base64.decode('A'), null);
  assert.equal(P.base64.decode('AB$='), null);
  assert.equal(P.base64.decode('AA==AA=='), null);
});

test('copies cannot change the live session', () => {
  const seed = findSeed('copies', (m) => stepN(m, 2), () => true);
  const m = P.create(seed);
  stepN(m, 2);
  const before = JSON.stringify(m.trace());
  const f = m.frame();
  f.tick = 99;
  f.units[0].hp = -5;
  f.stance = 'bow';
  assert.equal(m.frame().tick, 2);
  assert.notEqual(m.frame().units[0].hp, -5);
  assert.equal(m.frame().stance, null);
  const t = m.trace();
  t.forEach((r) => { r[4] = 999; });
  t.push([9, 9, 9, 9, 9]);
  assert.equal(JSON.stringify(m.trace()), before);
  const tm = P.teams(seed);
  tm.def.semilla = 'x';
  assert.notEqual(P.teams(seed).def.semilla, 'x');
  assert.throws(() => { P.STANCES.push('x'); });
  playOut(m);
  const r = m.receipt();
  r.packet.v[0] = 9;
  assert.notEqual(m.receipt().packet.v[0], 9);
});

test('browser: without a module system it exposes window.AtlasPracticeModel from its globals', () => {
  const sandbox = { AtlasValores: V, AtlasCanon: K, AtlasCombateTicks: CT };
  vm.runInNewContext(readFileSync(SRC, 'utf8'), sandbox);
  assert.equal(typeof sandbox.AtlasPracticeModel.verify, 'function');
  assert.equal(sandbox.AtlasPracticeModel.create(seedNamed('browser')).frame().tick, 0);
});

test('served module: no clock, randomness, network, DOM or comments; under 16 KiB', () => {
  const src = readFileSync(SRC, 'utf8');
  assert.doesNotMatch(src, /Math\.random|Date|performance\.|setTimeout|setInterval|fetch\(|XMLHttpRequest|WebSocket|localStorage|document|window/);
  assert.doesNotMatch(src, /\/\/|\/\*/);
  assert.ok(statSync(SRC).size < 16 * 1024);
});
