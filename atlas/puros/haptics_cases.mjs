// haptics.js · the game answers the thumb; short patterns, one per kind of moment.
import { test } from 'node:test'; import assert from 'node:assert/strict'; import { createRequire } from 'node:module';
const H = createRequire(import.meta.url)('../../public/game/haptics.js');
test('each pattern is short: under half a second', () => { Object.values(H.PATTERNS).forEach((p) => assert.ok(p.reduce((a, b) => a + b, 0) < 500)); });
test('battle: win, loss; practice is silent', () => {
  assert.equal(H.kindOf({ combat: { gana: 'asalto' } }), 'win'); assert.equal(H.kindOf({ combat: { gana: 'defensa' } }), 'loss');
  assert.equal(H.kindOf({ practice: true, combat: { gana: 'asalto' } }), null);
});
test('holdings and making a building yours', () => {
  assert.equal(H.kindOf({ event: { kind: 'holding.raid' } }), 'raid'); assert.equal(H.kindOf({ event: { kind: 'building.yours' } }), 'yours');
  assert.equal(H.kindOf({ event: { kind: 'chat.line' } }), null); assert.equal(H.kindOf(null), null);
});
