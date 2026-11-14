// Cases for many crabs in Acho (Seam A, not served). Uso: node --test atlas/puros/crab_presence_acho_cases.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const D = require('../../public/game/crab_presence_acho.js'), F = require('../../public/game/state_frames.js'), S = require('../../public/game/acho_sonify.js');
const C = require('../../public/game/acho_claim.js'), WALK = require('../../public/game/visitor_walk.js');
const view = (crabs) => ({ esquema: 'atlas.presencia/1', tick: 4, crabs });
const me = { id: 'crab-00000001', q: 0, r: 0, seal: 'LIVE' };

test('the six ways are the six walking directions of the walker', () => {
  for (const [name, d] of Object.entries(WALK.DIRS)) { assert.equal(D.way({ q: 0, r: 0 }, { q: d[0] * 3, r: d[1] * 3 }), name); assert.equal(D.distance({ q: 0, r: 0 }, { q: d[0] * 3, r: d[1] * 3 }), 3); }
  assert.equal(D.way(me, me), 'here');
});
test('alone, the line says so and the frame is silent with its cause', () => {
  const r = D.describe(view([me]), me.id, F);
  assert.equal(r.line, 'You at 0, 0 · no other crab in sight');
  assert.match(r.frame.sound, /^NO_DATA/);
  assert.equal(S.sonify(r.frame).ok, false);
});
test('one event, four readings: the words, the same words in the frame, one note per named crab, one claim', () => {
  const r = D.describe(view([me, { id: 'crab-aaaaaaaa', q: 2, r: 0, seal: 'LIVE' }, { id: 'crab-bbbbbbbb', q: 0, r: -5, seal: 'STALE' }]), me.id, F);
  assert.equal(r.line, 'You at 0, 0 · 2 other crabs · crab-aaaaaaaa LIVE 2 hexes east; crab-bbbbbbbb STALE 5 hexes north-west');
  assert.deepEqual(F.valida(r.frame), []);
  assert.equal(r.frame.atoms[0].r, r.line);
  const son = S.sonify(r.frame), c = C.claim(r.frame);
  assert.equal(son.voices.length, 2);
  assert.ok(son.voices[0].recipe.carrier > son.voices[1].recipe.carrier, 'the nearer crab is the higher note');
  assert.ok(son.voices[0].recipe.index > son.voices[1].recipe.index, 'the STALE crab is the duller one');
  assert.equal(c.ok, true);
  assert.equal(c.rows.filter((x) => x.primitive === 'wave' && x.listen).length, 2);
});
test('a full world still fits one frame: three by name, the rest counted', () => {
  const crabs = [me]; for (let i = 0; i < 19; i++) { crabs.push({ id: 'crab-' + String(i).padStart(8, 'f'), q: -1000 - i, r: 2000 + i, seal: i % 2 ? 'STALE' : 'LIVE' }); }
  const r = D.describe(view(crabs), me.id, F);
  assert.equal(r.ok, true);
  assert.match(r.line, /19 other crabs · .*; and 16 more$/);
  assert.deepEqual(F.valida(r.frame), []);
});
test('sabotage: the same view always gives the same event; a moved crab gives another', () => {
  const a = [me, { id: 'crab-aaaaaaaa', q: 2, r: 0, seal: 'LIVE' }], b = [me, { id: 'crab-aaaaaaaa', q: 3, r: 0, seal: 'LIVE' }];
  assert.deepEqual(D.describe(view(a), me.id, F), D.describe(view(a.slice().reverse()), me.id, F));
  assert.notEqual(D.describe(view(a), me.id, F).line, D.describe(view(b), me.id, F).line);
  assert.notDeepEqual(S.sonify(D.describe(view(a), me.id, F).frame), S.sonify(D.describe(view(b), me.id, F).frame));
});
test('sabotage: a view that is not the authority\'s, or that does not hold you, is NO_DATA with its cause', () => {
  assert.deepEqual(D.describe({ crabs: [me] }, me.id, F), { ok: false, cause: 'view_not_readable' });
  assert.deepEqual(D.describe(view([{ ...me, id: 'crab-zzzzzzzz' }]), me.id, F), { ok: false, cause: 'you_are_not_in_this_view' });
});
test('a change is said: who arrived, came nearer, went farther, fell silent, came back, is gone', () => {
  const a = (q, seal) => ({ id: 'crab-aaaaaaaa', q, r: 0, seal }), b = { id: 'crab-bbbbbbbb', q: 0, r: 3, seal: 'LIVE' };
  const first = D.describe(view([me, a(4, 'LIVE')]), me.id, F);
  assert.deepEqual(first.news, []);
  const say = (crabs, before) => D.describe(view([me, ...crabs]), me.id, F, before);
  assert.deepEqual(say([a(2, 'LIVE')], first.others).news, ['crab-aaaaaaaa nearer']);
  assert.match(say([a(2, 'LIVE')], first.others).line, /^crab-aaaaaaaa nearer · You at 0, 0 · 1 other crab · crab-aaaaaaaa LIVE 2 hexes east$/);
  assert.deepEqual(say([a(6, 'LIVE')], first.others).news, ['crab-aaaaaaaa farther']);
  assert.deepEqual(say([a(4, 'STALE')], first.others).news, ['crab-aaaaaaaa silent']);
  assert.deepEqual(say([a(4, 'LIVE')], say([a(4, 'STALE')], first.others).others).news, ['crab-aaaaaaaa back']);
  assert.deepEqual(say([a(4, 'LIVE'), b], first.others).news, ['crab-bbbbbbbb arrived']);
  assert.deepEqual(say([], first.others).news, ['crab-aaaaaaaa gone']);
  assert.equal(say([], first.others).line, 'crab-aaaaaaaa gone · You at 0, 0 · no other crab in sight');
  assert.deepEqual(say([a(4, 'LIVE')], first.others).news, []);       // nothing changed, nothing is said twice
  assert.match(D.describe({ ...view([me, a(1, 'LIVE')]), more: 5 }, me.id, F).line, / · 5 more beyond this frame$/);
});
test('a meeting and the lit beacon are said once, by the authority\'s own event id, the same for both except for «you»', () => {
  const a = { id: 'crab-aaaaaaaa', q: 1, r: 0, seal: 'LIVE' }, meet = { k: 'meet', id: 'ev-11111111', who: [a.id, me.id].sort(), d: 1, tick: 3 };
  const faro = { k: 'faro', id: 'ev-22222222', who: [a.id, me.id], cell: [6, 4], tick: 5 };
  const v1 = { ...view([me, a]), events: [meet] };
  const mine = D.describe(v1, me.id, F, undefined, []), theirs = D.describe(v1, a.id, F, undefined, []);
  assert.match(mine.line, /^You met crab-aaaaaaaa · You at 0, 0 · /);
  assert.match(theirs.line, /^You met crab-00000001 · You at 1, 0 · /);
  assert.deepEqual(mine.events, ['ev-11111111']); assert.deepEqual(theirs.events, mine.events);
  assert.doesNotMatch(D.describe(v1, me.id, F, mine.others, mine.events).line, /met/);            // not said twice
  const v2 = { ...view([me, a]), events: [meet, faro], lit: faro.id };
  const lit = D.describe(v2, me.id, F, mine.others, mine.events);
  assert.match(lit.line, /^The beacon is lit: you and crab-aaaaaaaa lit it together · You at 0, 0 · .* · the beacon is lit$/);
  assert.match(D.describe(v2, a.id, F, undefined, ['ev-11111111']).line, /^The beacon is lit: you and crab-00000001 lit it together · /);
  assert.match(D.describe(v2, 'crab-cccccccc', F).cause, /you_are_not_in_this_view/);
  const third = D.describe({ ...view([me, a, { id: 'crab-cccccccc', q: 3, r: 3, seal: 'LIVE' }]), events: [faro], lit: faro.id }, 'crab-cccccccc', F, undefined, []);
  assert.match(third.line, /^The beacon is lit: crab-00000001 and crab-aaaaaaaa lit it together · /);
  assert.deepEqual(lit.events, ['ev-22222222']); assert.equal(lit.lit, true);
  assert.deepEqual(F.valida(lit.frame), []); assert.equal(lit.frame.atoms[0].r, lit.line);
  const notes = S.sonify(lit.frame).voices.map((x) => x.recipe.carrier);
  assert.ok(notes.length >= 3 && notes[0] < notes[1] && notes[1] < notes[2], 'the beacon sounds as three rising notes: ' + notes);
  assert.match(D.describe(v2, me.id, F, lit.others, ['ev-11111111', 'ev-22222222']).line, /^You at 0, 0 · .* · the beacon is lit$/); // the state stays, the event is not repeated
});
test('an ask is said to the one it is for, and to the one who made it, while it waits', () => {
  const a = { id: 'crab-aaaaaaaa', q: 1, r: 0, seal: 'LIVE' }, v = { ...view([me, a]), asks: [{ id: 'ask-33333333', from: a.id, to: me.id }] };
  assert.match(D.describe(v, me.id, F).line, /^crab-aaaaaaaa asks you to light the beacon together · /);
  assert.match(D.describe(v, a.id, F).line, /^You asked crab-00000001 · waiting for their yes · /);
});
test('sabotage: a line too long for one frame keeps the event and drops the notes; it never grows the frame', () => {
  const crabs = [me]; for (let i = 0; i < 12; i++) { crabs.push({ id: 'crab-' + String(i).padStart(8, 'e'), q: -123456 - i, r: 654321 + i, seal: 'STALE' }); }
  const events = [0, 1, 2].map((i) => ({ k: 'meet', id: 'ev-0000000' + i, who: [crabs[i + 1].id, crabs[i + 2].id], d: 1, tick: 1 }));
  events.push({ k: 'faro', id: 'ev-99999999', who: [me.id, crabs[1].id], cell: [6, 4], tick: 2 });
  const r = D.describe({ ...view(crabs), events, lit: 'ev-99999999', more: 40, asks: [{ id: 'ask-1', from: crabs[2].id, to: me.id }] }, me.id, F, undefined, []);
  assert.equal(r.ok, true);
  assert.deepEqual(F.valida(r.frame), []);
  assert.match(r.line, /The beacon is lit: you and /);
});
test('pure: no clock, no randomness, no network', () => {
  assert.doesNotMatch(readFileSync(new URL('../../public/game/crab_presence_acho.js', import.meta.url), 'utf8'), /Math\.random|Date\.now|new Date|fetch\(|XMLHttpRequest/);
});
