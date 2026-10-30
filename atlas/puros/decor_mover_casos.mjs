import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';

const require = createRequire(import.meta.url);
const D = require('./decor_mover.js');
const nodes = [{ id: 'a', q: 0, r: 0 }, { id: 'b', q: 1, r: 0 }, { id: 'c', q: 0, r: 1 }];
const move = D.inColony(nodes);
const prop = { id: 'sample-prop', q: 0, r: 0 };

test('same prop, destination and seed produce byte-identical movement scripts', () => {
  const first = move(prop, { q: 1, r: 0 }, 17);
  const second = move(prop, { q: 1, r: 0 }, 17);
  assert.equal(JSON.stringify(first), JSON.stringify(second));
  assert.deepEqual(first.moves, [{ id: 'sample-prop', from: { q: 0, r: 0 }, to: { q: 1, r: 0 } }]);
  assert.equal(first.schema, D.VERSION);
  assert.equal(first.seed, 17);
});

test('movement frame is a sealed Bubble with a phrase and honest sound absence', () => {
  const frame = move(prop, { q: 1, r: 0 }, 17).frames[0];
  assert.equal(frame.v, 'preceptoros.bubble/1');
  assert.equal(frame.seal, 'SIMULATED');
  assert.match(frame.atoms[0].r, /sample-prop moves to axial cell 1,0/);
  assert.match(frame.sound, /^NO_DATA:/);
  assert.ok(frame.soundCause);
  assert.ok(Buffer.byteLength(JSON.stringify(frame), 'utf8') < 1024);
});

test('source inputs are not mutated', () => {
  const beforeNodes = JSON.stringify(nodes), beforeProp = JSON.stringify(prop);
  const destination = { q: 0, r: 1 }, beforeDestination = JSON.stringify(destination);
  move(prop, destination, 17);
  assert.equal(JSON.stringify(nodes), beforeNodes);
  assert.equal(JSON.stringify(prop), beforeProp);
  assert.equal(JSON.stringify(destination), beforeDestination);
});

test('non-finite, non-axial, and unknown destinations are refused', () => {
  for (const destination of [{ q: NaN, r: 0 }, { q: Infinity, r: 0 }, { q: 0.5, r: 0 }, { q: 9, r: 9 }]) {
    assert.throws(() => move(prop, destination, 17), /destination/);
  }
});

test('prop without id and source outside the colony are refused', () => {
  assert.throws(() => move({ q: 0, r: 0 }, { q: 1, r: 0 }, 17), /prop needs id/);
  assert.throws(() => move({ id: 'sample-prop', q: 9, r: 9 }, { q: 1, r: 0 }, 17), /source is outside/);
  assert.throws(() => move([{ id: 'same', q: 0, r: 0 }, { id: 'same', q: 1, r: 0 }], { q: 1, r: 0 }, 17), /repeated prop id/);
});

test('repeated colony ids or cells are refused before a movement can be issued', () => {
  assert.throws(() => D.inColony([...nodes, { id: 'a', q: 2, r: 0 }]), /repeated/);
  assert.throws(() => D.inColony([...nodes, { id: 'd', q: 1, r: 0 }]), /repeated/);
});

test('Bubble frame at or above 1 KiB is refused', () => {
  assert.throws(() => move({ id: 'p'.repeat(1100), q: 0, r: 0 }, { q: 1, r: 0 }, 17), /Bubble\/1 law/);
});

test('invalid seed is refused and source has no random, clock or network path', () => {
  for (const seed of [-1, 1.5, NaN, Infinity, '17']) assert.throws(() => move(prop, { q: 1, r: 0 }, seed), /seed/);
  const source = readFileSync(new URL('./decor_mover.js', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /Math\.random|Date\.now|new Date|performance\.now|fetch\(|XMLHttpRequest/);
});
