// Cases of the terminal, anchor and joystick core (ODD colony-terminal-anchor, TA-1 and TA-5).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
const require = createRequire(import.meta.url);
const C = require('./colony_controls.js');
const TOK = require('../../public/game/comic_tokens.js');
const ACC = require('../../public/game/comic_accents.js');

const NODES = [{ id: 'cabin', q: 0, r: 0 }, { id: 'ring-e', q: 1, r: 0 }];
const START = { node: 'cabin', q: 0, r: 0 };

test('the walker steps onto a neighbour that holds a colony node', () => {
  const r = C.move(START, 'east', NODES);
  assert.equal(r.ok, true);
  assert.deepEqual(r.walker, { node: 'ring-e', q: 1, r: 0 });
});

test('sabotage: the walker never steps onto an empty hex; the refusal says NO_DATA', () => {
  const r = C.move(START, 'west', NODES);
  assert.equal(r.ok, false);
  assert.deepEqual(r.walker, START);
  assert.match(r.cause, /NO_DATA/);
});

test('sabotage: an unknown direction is refused', () => {
  assert.equal(C.move(START, 'up', NODES).ok, false);
});

test('the user’s saved terminal wins over the node’s look; the node’s look is used otherwise', () => {
  assert.equal(C.enter(START, 'zombie', 'atlantis').look, 'atlantis');
  assert.equal(C.enter(START, 'zombie', null).look, 'zombie');
  assert.equal(C.enter(START, 'zombie', null).source, 'node');
});

test('an unknown node look falls back to basic, labelled as the default', () => {
  const r = C.enter(START, 'neon', null);
  assert.equal(r.look, 'basic');
  assert.equal(r.source, 'default');
});

test('the anchor colours are the house bands, resolved from comic_tokens and comic_accents', () => {
  const hex = (n) => C.bandHex(n, TOK, ACC);
  const basic = C.colours('basic', hex);
  assert.equal(basic.bg, TOK.NEUTRAL.paper);
  assert.equal(basic.fg, TOK.NEUTRAL.ink);
  const atl = C.colours('atlantis', hex);
  assert.equal(atl.accent, ACC.ACCENTS['comic yellow'].bands.base);
});

test('sabotage: a band that does not resolve is refused, never painted with a guess', () => {
  assert.throws(() => C.colours('basic', () => undefined), /band does not resolve/);
});

test('sabotage: a terminal look that is not one of the three is refused', () => {
  assert.throws(() => C.colours('neon', () => '#000000'), /unknown terminal look/);
});

test('the saved choice: an invalid value is ignored; a store that throws reads as no choice', () => {
  assert.equal(C.savedChoice({ getItem: () => 'neon' }), null);
  assert.equal(C.savedChoice({ getItem: () => { throw new Error('denied'); } }), null);
  assert.equal(C.savedChoice({ getItem: () => 'zombie' }), 'zombie');
});

test('saving: an invalid look is refused and never stored; a throwing store reports false', () => {
  let stored = null;
  const store = { setItem: (k, v) => { stored = v; } };
  assert.equal(C.saveChoice(store, 'neon'), false);
  assert.equal(stored, null);
  assert.equal(C.saveChoice(store, 'atlantis'), true);
  assert.equal(stored, 'atlantis');
  assert.equal(C.saveChoice({ setItem: () => { throw new Error('quota'); } }, 'basic'), false);
});

test('the module writes no hex literal and reads no random number, clock or network', () => {
  const src = readFileSync(new URL('./colony_controls.js', import.meta.url), 'utf8');
  assert.doesNotMatch(src, /#[0-9a-fA-F]{6}/);
  assert.doesNotMatch(src, /Math\.random|Date\.now|new Date|performance\.now|fetch\(|XMLHttpRequest/);
});
