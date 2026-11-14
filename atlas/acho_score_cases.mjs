// Cases for the Acho math kernel and the Acho score (pure, not served yet). Uso: node --test atlas/acho_score_cases.mjs
// Sabotages: node atlas/acho_score_cases.mjs --sabotage  → each mutation of the score must be caught by a law.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
const require = createRequire(import.meta.url);
const M = require('./puros/acho_math.js'), S = require('./puros/acho_score.js');
const F = require('../public/game/state_frames.js'), SON = require('../public/game/acho_sonify.js');
const VEC = JSON.parse(readFileSync(new URL('./acho_score_vectors.json', import.meta.url), 'utf8'));
const src = (f) => readFileSync(new URL(f, import.meta.url), 'utf8');
const FARO = { k: 'faro', id: 'ev-7f3a9c01', who: ['crab-0a1b2c3d', 'crab-4e5f6a7b'], cell: [6, 4], tick: 41 };
const LIT = S.lit(FARO), ASK = S.asked({ id: 'ask-00112233', from: 'crab-0a1b2c3d', to: 'crab-4e5f6a7b' }, 'authority', { q: 6, r: 4 });
const ATTACKS = ['signature_rejected', 'replay_rejected', 'sequence_rejected', 'consent_required', 'visit_expired', 'too_far_from_the_beacon', 'already_lit'];
const bright = (o) => o.lamp > 0 || o.ring !== null || o.sparks.length > 0;
const times = (dur, fps) => Array.from({ length: Math.floor(dur * fps / 1000) + 1 }, (_, i) => i * 1000 / fps);

// The laws, as one function of a score module, so the sabotages can run them against a mutated copy.
function laws(X) {
  const out = [];
  const say = (name, ok) => out.push({ law: name, ok: !!ok });
  const lit = X.score(X.lit(FARO));
  say('an accepted authority lighting has light', lit.ok && lit.light && X.at(lit, 400).lamp > 0 && X.at(lit, 400).sparks.length > 0);
  say('the lit beacon rests lit and still', X.rest(lit).lamp === 1 && X.rest(lit).ring === null && X.rest(lit).sparks.length === 0);
  let dark = true, cause = true;
  ATTACKS.forEach((c) => {
    const s = X.score(X.refused('coop.beacon_lit', c, 'refused/' + c, 'authority', { q: 6, r: 4 }));
    if (!s.ok || s.light) { dark = false; return; }
    for (let t = 0; t <= s.dur + 100; t += 20) { if (bright(X.at(s, t))) { dark = false; } }
    if (!/Refused/.test(s.caption) || /is lit/.test(s.caption) || !/nothing was lit/.test(s.caption)) { cause = false; }
  });
  say('no refusal ever shows light', dark);
  say('a refusal says so and never says lit', cause);
  const ask = X.score(ASK); let pend = ask.ok && !ask.light && ask.waves.length === 0;
  for (let t = 0; t <= 1000; t += 50) { if (bright(X.at(ask, t))) { pend = false; } }
  say('a pending request is an outline, never light', pend && X.rest(ask).mark === 1);
  const local = X.score(Object.assign(X.lit(FARO), { source: 'local' }));
  say('a lighting this device claims alone has no lamp', local.ok && !local.light && !bright(X.at(local, 300)));
  const fix = X.score(X.lit(FARO, 'fixture'));
  say('a fixture is sealed SIMULATED in words', fix.seal === 'SIMULATED' && /SIMULATED/.test(fix.caption) && X.at(fix, 100).seal === 'SIMULATED');
  const a = X.score(X.lit(FARO)), b = X.score(X.lit(FARO));
  say('same event, same score, in any order of asking', JSON.stringify([900, 100, 500].map((t) => X.at(a, t))) === JSON.stringify([900, 100, 500].map((t) => X.at(b, t)).slice()) &&
    JSON.stringify(X.at(a, 500)) === JSON.stringify(X.at(b, 500)));
  const other = X.score(X.lit(Object.assign({}, FARO, { id: 'ev-00000001' })));
  say('another event id is another burst of sparks', JSON.stringify(X.at(a, 300).sparks) !== JSON.stringify(X.at(other, 300).sparks));
  say('the budget of sparks holds', X.at(a, 50).sparks.length <= 24);
  let vec = true;
  VEC.cases.forEach((c) => { const s = X.score(c.event); c.samples.forEach((p) => { if (JSON.stringify(X.at(s, p.t)) !== JSON.stringify(p.sample)) { vec = false; } }); });
  say('the golden vectors hold', vec && VEC.cases.length >= 4);
  return out;
}

test('every law of the score holds', () => { laws(S).forEach((l) => assert.equal(l.ok, true, l.law)); });
test('frame rate does not change the curve: 15, 30 and 60 fps agree wherever they sample the same instant', () => {
  const s = S.score(LIT), at60 = new Map(times(s.dur, 60).map((t) => [Math.round(t * 1000), JSON.stringify(S.at(s, t))]));
  [15, 30].forEach((fps) => times(s.dur, fps).forEach((t) => { assert.equal(JSON.stringify(S.at(s, t)), at60.get(Math.round(t * 1000)), fps + ' fps at ' + t); }));
});
test('the envelope refuses what it cannot read, with a cause', () => {
  [[null, 'event_not_an_object'], [{ id: '', kind: 'a', status: 'accepted', source: 'local' }, 'event_without_id'], [{ id: 'x', kind: 'Bad Kind', status: 'accepted', source: 'local' }, 'event_kind_unreadable'],
    [{ id: 'x', kind: 'a.b', status: 'won', source: 'local' }, 'event_status_unknown'], [{ id: 'x', kind: 'a.b', status: 'accepted', source: 'me' }, 'event_source_unknown'],
    [{ id: 'x', kind: 'a.b', status: 'refused', source: 'authority' }, 'refusal_without_cause'], [{ id: 'x', kind: 'a.b', status: 'accepted', source: 'authority', where: { q: 0.5, r: 1 } }, 'event_where_unreadable']]
    .forEach(([e, cause]) => { assert.deepEqual(S.score(e), { ok: false, cause }); });
});
test('the sound is the house sound: three rising notes for the lighting, a falling pair for a refusal, silence for a request', () => {
  const hz = (s) => { const f = F.stateFrame({ id: s.id, sentence: s.caption, waves: s.waves }); assert.deepEqual(F.valida(f), []); const r = SON.sonify(f); return r.ok ? r.voices.map((v) => v.recipe.carrier) : []; };
  const up = hz(S.score(LIT)), down = hz(S.score(S.refused('coop.beacon_lit', 'already_lit', 'refused/1')));
  assert.equal(up.length, 3); assert.ok(up[0] < up[1] && up[1] < up[2]);
  assert.equal(down.length, 2); assert.ok(down[0] > down[1]); assert.ok(down[0] < up[0], 'a refusal never sounds like the first note of a lighting');
  assert.equal(S.score(ASK).waves.length, 0);
});
test('math: the track is monotone between rising keys and never passes a key', () => {
  const f = M.track([[0, 0], [1, 0.1], [2, 5], [3, 5.1], [10, 6]]); let prev = -Infinity;
  for (let t = -1; t <= 11; t += 0.01) { const v = f(t); assert.ok(v >= prev - 1e-12, 'falls at ' + t); assert.ok(v >= 0 && v <= 6); prev = v; }
  [[0, 0], [1, 0.1], [2, 5], [3, 5.1], [10, 6]].forEach(([t, v]) => assert.ok(Math.abs(f(t) - v) < 1e-12));
  assert.throws(() => M.track([[1, 0], [1, 2]])); assert.throws(() => M.track([]));
});
test('math: the spring starts at rest, settles at one, and matches a fine numerical integration', () => {
  [[0.45, 14], [1, 9], [1.8, 6]].forEach(([z, w]) => {
    assert.equal(M.spring(0, z, w), 0); assert.ok(Math.abs(M.spring(8, z, w) - 1) < 1e-6);
    let x = 0, v = 0; const dt = 1e-5; for (let i = 0; i < 30000; i++) { v += (w * w * (1 - x) - 2 * z * w * v) * dt; x += v * dt; }
    assert.ok(Math.abs(M.spring(0.3, z, w) - x) < 1e-3, 'zeta ' + z);
  });
});
test('math: the particle is the exact integral of drag and gravity', () => {
  const p = { x: 1, y: 2, vx: 3, vy: -4, drag: 3, g: 2.4 }; let x = p.x, y = p.y, vx = p.vx, vy = p.vy; const dt = 1e-5;
  for (let i = 0; i < 70000; i++) { vx += -p.drag * vx * dt; vy += (-p.drag * vy + p.g) * dt; x += vx * dt; y += vy * dt; }
  const q = M.particle(0.7, p); assert.ok(Math.abs(q.x - x) < 1e-3 && Math.abs(q.y - y) < 1e-3);
  const free = M.particle(2, { x: 0, y: 0, vx: 1, vy: 0, drag: 0, g: 2 }); assert.deepEqual(free, { x: 2, y: 4 });
});
test('math: hash, rand, noise and screen are bounded and repeatable', () => {
  assert.equal(M.hash('ev-7f3a9c01'), M.hash('ev-7f3a9c01')); assert.notEqual(M.hash('a'), M.hash('b')); assert.equal(M.hash(''), 0x811c9dc5);
  let sum = 0; for (let i = 0; i < 4000; i++) { const r = M.rand(77, i); assert.ok(r >= 0 && r < 1); sum += r; } assert.ok(Math.abs(sum / 4000 - 0.5) < 0.03);
  for (let x = -3; x < 3; x += 0.07) { const n = M.noise(5, x); assert.ok(n >= 0 && n < 1); assert.ok(Math.abs(M.noise(5, x + 1e-4) - n) < 1e-3); }
  assert.equal(M.screen(1, 1), 1); assert.equal(M.screen(0, 0), 0); assert.ok(M.screen(0.7, 0.7) <= 1); assert.equal(M.screen(5, -2), 1);
});
test('pure: no clock, no randomness, no network, no document', () => {
  ['./puros/acho_math.js', './puros/acho_score.js'].forEach((f) => assert.doesNotMatch(src(f), /Math\.random|Date\.now|new Date|performance\.|fetch\(|XMLHttpRequest|document\.|localStorage|requestAnimationFrame/));
});

// Sabotages: each one breaks one law on purpose. A sabotage that no law catches is reported MISSED and exits 1.
const SABOTAGES = [
  ['refusal-wins', "if (e.status === 'refused') { s.shape = 'refusal';", "if (e.status === 'refused') { s.shape = 'beacon'; s.light = true;"],
  ['local-lamp', "bright = e.status === 'accepted' && (e.source === 'authority' || e.source === 'fixture')", "bright = e.status === 'accepted'"],
  ['request-glows', "else if (e.status === 'pending') { s.shape = 'request';", "else if (e.status === 'pending') { s.shape = 'pulse';"],
  ['seed-ignored', 'seed: M.hash(e.id)', 'seed: 1'],
  ['fixture-unsealed', "fixture: 'SIMULATED'", "fixture: 'LIVE'"],
  ['never-rests', 'else { o.lamp = 1; }', 'else { o.lamp = 1; o.sparks = sparks(s, 100); }'],
  ['refusal-says-lit', "' · nothing was lit'", "' · the beacon is lit'"],
  ['curve-moved', '[300, 1.6]', '[300, 2.6]']
];
function mutated(from, to) {
  const code = src('./puros/acho_score.js'); if (!code.includes(from)) { return null; }
  const mod = { exports: {} }, ctx = vm.createContext({ module: mod, require: (n) => n === './acho_math.js' ? M : require(n), globalThis: {}, isFinite, Number, Math, JSON, String, Array, Object });
  vm.runInContext(code.replace(from, to), ctx); return mod.exports;
}
test('sabotage: every mutation of the score is caught by a law', () => {
  SABOTAGES.forEach(([name, from, to]) => {
    const X = mutated(from, to); assert.ok(X, name + ': the line to mutate exists');
    assert.ok(laws(X).some((l) => !l.ok), name + ' was not caught');
  });
});
if (process.argv.includes('--sabotage')) {
  const rows = SABOTAGES.map(([name, from, to]) => { const X = mutated(from, to); return { sabotage: name, caught: X ? laws(X).filter((l) => !l.ok).map((l) => l.law) : null }; });
  console.log(JSON.stringify(rows, null, 1)); if (rows.some((r) => !r.caught || !r.caught.length)) { process.exitCode = 1; }
}
