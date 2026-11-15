// combat_acho.js · the combat, alive: every card, line and attribute is read from the resolved record; nothing decides.
import { test } from 'node:test'; import assert from 'node:assert/strict'; import { createRequire } from 'node:module';
const req = createRequire(import.meta.url), A = req('../../public/game/combat_acho.js'), T = req('../../public/game/combat_ticks.js');
const V = req('../../public/game/values.js'), K = req('../../public/game/canon.js');
// A real practice fight: the first house patrol against a squad of two, resolved by the engine the game uses.
function fight(tag) {
  const p = V.patrullas[0], seed = K.sha('atlas.patrulla/1:' + p.id), def = [], asa = [];
  for (let j = 0; j < p.n; j++) { def.push({ tc: p.tc, semilla: K.sha(seed + ':patrulla:' + j) }); }
  for (let j = 0; j < 2; j++) { asa.push({ tc: 'tc2', semilla: K.sha('combat-acho-cases:' + tag + ':' + j) }); }
  const combat = T.combate(def, asa, K.sha('combat-acho-cases:seed:' + tag));
  return { seed: K.sha(tag), defenders: def, attackers: asa, combat, hits: combat.registro };
}
const deep = (o) => { Object.freeze(o); Object.values(o).forEach((v) => { if (v && typeof v === 'object' && !Object.isFrozen(v)) { deep(v); } }); return o; };
test('two replays of the same record give the same lines, states and waves', () => {
  const a = A.read(fight('x')), b = A.read(fight('x'));
  assert.ok(a.ok, a.cause); assert.deepEqual(A.script(a, true), A.script(b, true));
  for (let k = 0; k <= a.hits.length; k++) { assert.deepEqual(A.stateAt(a, k), A.stateAt(b, k)); }
  const u = a.U[0][0]; assert.equal(A.wavePath(u.arm, 0.5, 48), A.wavePath(u.arm, 0.5, 48));
});
test('the record adds up: the last state equals combat.vida_por_mil; the verdict reads combat.gana', () => {
  ['x', 'y', 'z', 'w'].forEach((tag) => {
    const r = fight(tag), f = A.read(r), s = A.script(f, true), last = s[s.length - 1];
    assert.ok(f.ok); assert.deepEqual(A.stateAt(f, f.hits.length).pm, r.combat.vida_por_mil); assert.equal(last.end, true);
    assert.match(last.line, { asalto: /^Your squad wins/, defensa: /^The patrol wins/, empate: /^Draw/ }[r.combat.gana]);
    assert.match(last.line, new RegExp('after ' + r.combat.rondas + ' rounds'));
  });
});
test('the presentation never changes the result: a frozen result reads the same, winner and hits untouched', () => {
  const r = fight('x'), copy = JSON.stringify(r), f = A.read(deep(r)); A.script(f, true); A.stateAt(f, 3);
  assert.equal(JSON.stringify(r), copy);
});
test('a different observed life changes the expression: mood, wave and words follow the life only', () => {
  assert.deepEqual([30, 19, 9, 0].map((v) => A.mood(v, 30)), ['steady', 'hurt', 'grave', 'out']);
  const u = A.read(fight('x')).U[0][0];
  const full = A.wavePath(u.arm, 1, 48), half = A.wavePath(u.arm, 0.5, 48), out = A.wavePath(u.arm, 0, 48);
  assert.notEqual(full, half); assert.equal(out, 'M10 24h28'); // out: the wave goes flat
  const box = (d) => { const n = d.match(/-?\d+(\.\d+)?/g).map(Number), xs = n.filter((_, i) => i % 2 === 0); return Math.max(...xs) - Math.min(...xs); };
  assert.ok(box(half) < box(full), 'a hurt wave is smaller than a whole one');
});
test('each round is said once, in order, with who hit and both sides\' life; outs are named', () => {
  const f = A.read(fight('x')), s = A.script(f, false), rounds = s.filter((x) => !x.end).map((x) => x.round);
  assert.deepEqual(rounds, [...new Set(rounds)].sort((a, b) => a - b));
  assert.equal(new Set(s.map((x) => x.line)).size, s.length, 'no line twice');
  s.filter((x) => !x.end).forEach((x) => { assert.match(x.line, /^Round \d+ · /); assert.match(x.line, /Life: you \d+ %, the patrol \d+ %\.$/); });
  const outs = s.filter((x) => / is out\.| are out\./.test(x.line)); const zero = A.stateAt(f, f.hits.length).life.flat().filter((v) => v === 0).length;
  assert.equal(outs.map((x) => x.line.match(/(You|Patrol) \d+/g).length).reduce((a, b) => a + b, 0) >= Math.min(1, zero), true);
  assert.doesNotMatch(s.map((x) => x.line).join(' '), /SIGNED|LIVE/);
});
test('not enough data is NO_DATA with its cause, never a made-up fight', () => {
  assert.deepEqual(A.read(null), { ok: false, cause: 'the battle sent no record' });
  const r = fight('x'); assert.equal(A.read({ ...r, hits: [[1, 0, 9, 0, 3]] }).cause, 'a hit names no fighter');
});
test('sabotage: a record that does not add up (one hit altered) is NO_DATA, not a different picture', () => {
  const r = fight('x'), f = A.read(r), end = A.stateAt(f, f.hits.length).life, hits = r.hits.map((e) => e.slice());
  const j = hits.findIndex((e) => e[4] > 0 && end[1 - e[1]][e[3]] > 0); assert.ok(j >= 0, 'a hit on a survivor'); hits[j][4] += 1; // one more point on a fighter still standing
  assert.equal(A.read({ ...r, hits }).cause, 'the record does not add up to its result');
});
test('sabotage: a verdict swapped without its event fails — the line follows combat.gana, not the picture', () => {
  const r = fight('x'), f = A.read(r), other = { asalto: 'defensa', defensa: 'asalto', empate: 'asalto' }[r.combat.gana];
  const g = { ...f, gana: other }, a = A.script(f, true).pop().line, b = A.script(g, true).pop().line;
  assert.notEqual(a, b);
});
test('many standing are small tiles with a count; three or fewer unfold with their names; none is tiles again', () => {
  assert.deepEqual([10, 4, 3, 1, 0].map((n) => A.view(n)), ['tiles', 'tiles', 'named', 'named', 'tiles']);
  assert.deepEqual([10, 6, 0].map((n) => A.view(n, true)), ['named', 'named', 'tiles'], 'at the end the survivors unfold');
});
test('ten against ten: the record still adds up and every fighter has a card state', () => {
  const def = [], asa = []; for (let j = 0; j < 10; j++) { def.push({ tc: 'tc1', semilla: K.sha('ten:d:' + j) }); asa.push({ tc: 'tc2', semilla: K.sha('ten:a:' + j) }); }
  const combat = T.combate(def, asa, K.sha('ten:seed')), f = A.read({ seed: K.sha('t'), defenders: def, attackers: asa, combat, hits: combat.registro });
  assert.ok(f.ok, f.cause); assert.equal(A.stateAt(f, 0).life.flat().length, 20); assert.deepEqual(A.stateAt(f, f.hits.length).pm, combat.vida_por_mil);
});
