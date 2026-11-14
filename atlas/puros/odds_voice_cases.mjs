// Cases for the odds that sound (BUILD 1B). Uso: node --test atlas/puros/odds_voice_cases.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const G = require('../../public/game/gacha.js'), F = require('../../public/game/state_frames.js'), A = require('../../public/game/acho_language.js');
const S = require('../../public/game/acho_sonify.js'), C = require('../../public/game/acho_claim.js'), V = require('../../public/game/odds_voice.js');
const tiers = Object.keys(G.TCS), e = V.event(G, F, A);
// A page as small as the piece needs: the globals it reads, a document that keeps events, an audio context that keeps notes.
function page(audio) {
  const events = [], notes = [];
  const osc = () => { const o = { frequency: { value: 0 }, connect() {}, start() {}, stop() {} }; notes.push(o); return o; };
  const gain = () => ({ gain: { value: 0, setValueAtTime() {}, linearRampToValueAtTime() {} }, connect() {} });
  class Ctx { constructor() { this.currentTime = 0; this.destination = {}; } createOscillator() { return osc(); } createGain() { return gain(); } resume() {} }
  const win = { CustomEvent: class { constructor(t, o) { this.type = t; this.detail = o.detail; } }, AudioContext: audio ? Ctx : undefined };
  return { events, notes, doc: { dispatchEvent: (x) => events.push(x) }, c: { win, load: (src, name, then) => then(audio === 'no-piece' ? null : S) } };
}
function press(p) { const said = []; Object.assign(globalThis, { AtlasGacha: G, AtlasStateFrames: F, AtlasAcho: A }); V.run(p.doc, (t) => said.push(t), p.c); return said; }

test('the event is the table the roll uses, as one lawful frame with one id', () => {
  assert.equal(e.ok, true);
  tiers.forEach((tc) => { assert.equal(G.odds(tc).reduce((a, b) => a + b, 0), 1000); assert.ok(e.line.includes(tc + ' ' + G.odds(tc).join('/')), tc); });
  assert.deepEqual(F.valida(e.frame), []);
  assert.equal(e.frame.sound, 'ok');
  assert.equal(e.frame.atoms[0].r, e.line); // the machine reads the very sentence the reader hears
  assert.match(e.id, /^acho:[0-9a-f]{8}$/);
  assert.equal(V.event(G, F, A).id, e.id); // same table, same id, always
});
test('one voice per tier, and a luckier tier is never a lower note', () => {
  const r = S.sonify(e.frame), hz = r.voices.map((v) => v.recipe.carrier), luck = tiers.map((tc) => G.odds(tc)[2] + G.odds(tc)[3]);
  assert.equal(r.voices.length, tiers.length);
  for (let i = 1; i < hz.length; i++) { assert.equal(Math.sign(hz[i] - hz[i - 1]), Math.sign(luck[i] - luck[i - 1]), 'tier ' + i); }
});
test('eye, ear and machine point at the same rows of one claim', () => {
  const c = C.claim(e.frame), w = c.rows.filter((r) => r.primitive === 'wave');
  assert.equal(c.ok, true);
  assert.equal(w.length, tiers.length);
  w.forEach((r, i) => { assert.ok(r.listen && r.look > 0 && r.silent === null); assert.deepEqual(r.inspect.h, V.wave(G.odds(tiers[i]))); });
});
test('a press says the words first, tells machines once, then hands the same notes to the ear', () => {
  const p = page(true), said = press(p), want = S.sonify(e.frame).voices.map((v) => v.recipe.carrier);
  assert.equal(said[0], e.line);
  assert.equal(said[1], e.line + ' · ' + tiers.length + ' notes, one per tier: higher is luckier');
  assert.equal(p.events.length, 1);
  assert.equal(p.events[0].type, 'acho:event');
  assert.deepEqual(p.events[0].detail, { id: e.id, frame: e.frame });
  assert.deepEqual(p.notes.filter((o, i) => i % 2 === 0).map((o) => o.frequency.value), want); // carrier, modulator, carrier…
});
test('without audio the words and the frame stay, and the line says why there is no sound', () => {
  let p = page(false), said = press(p);
  assert.equal(said[0], e.line);
  assert.equal(said[1], e.line + ' · sound NO_DATA · no_audio_output');
  assert.equal(p.events.length, 1);
  p = page('no-piece'); said = press(p);
  assert.equal(said[1], e.line + ' · sound NO_DATA · sound_piece_not_loaded');
});
test('sabotage: odds that do not add to a thousand make no event and no sound', () => {
  const bad = { RAREZAS: G.RAREZAS, TCS: { a: 1 }, odds: () => [640, 280, 65, 16] };
  assert.equal(V.wave([640, 280, 65, 16]), null);
  assert.deepEqual(V.event(bad, F, A), { ok: false, cause: 'odds_do_not_add_to_1000' });
  assert.deepEqual(V.event(null, F, A), { ok: false, cause: 'piece_not_loaded' });
});
test('sabotage: another table is another id and another sound', () => {
  const other = { RAREZAS: G.RAREZAS, TCS: { a: 1 }, odds: () => [500, 280, 150, 70] }, o = V.event(other, F, A);
  assert.equal(o.ok, true);
  assert.notEqual(o.id, e.id);
  assert.notDeepEqual(S.recipe(V.wave([640, 280, 65, 15])), S.recipe(V.wave([500, 280, 150, 70])));
});
test('pure and small: no clock, no randomness, no network, under 4,096 B', () => {
  const f = new URL('../../public/game/odds_voice.js', import.meta.url);
  assert.doesNotMatch(readFileSync(f, 'utf8'), /Math\.random|Date\.now|new Date|fetch\(|XMLHttpRequest/);
  assert.ok(statSync(f).size <= 4096);
});
