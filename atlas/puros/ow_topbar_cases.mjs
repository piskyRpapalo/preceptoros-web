// The top bar (public/game/ow_topbar.js) and the Tide boss (public/game/tide_boss.js): pure laws.
//   node --test atlas/puros/ow_topbar_cases.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const T = require('../../public/game/ow_topbar.js');
const B = require('../../public/game/tide_boss.js');
const K = require('../../public/game/canon.js');
const G = require('../../public/game/gacha.js');

test('two menus: Sound holds Radio and Audio only; Echoes holds Echoes, Quests and the demo boss', () => {
  assert.deepEqual(T.MENUS.sound.map((r) => r[0]), ['radio', 'audio']);
  assert.deepEqual(T.MENUS.echoes.map((r) => r[0]), ['echoes', 'quests', 'boss']);
  Object.values(T.MENUS).flat().forEach((r) => assert.ok(r[1].length <= 32 && /^[A-Z]/.test(r[1]), r[1]));
  assert.match(T.MENUS.echoes[2][1], /demo/i, 'the boss says it is a demo on its own button');
});

test('the version line names the seal letter, or says NO_DATA', () => {
  assert.equal(T.vline('preceptoros-2026-25-ko'), 'Web version ko · preceptoros-2026-25-ko');
  assert.equal(T.vline(null), 'Web version NO_DATA · not read');
  assert.equal(T.vline('<img onerror=1>'), 'Web version NO_DATA · not read');
});

test('the Tide boss is the same creature for everyone, and its life is measured from seven rolls', () => {
  const a = B.boss(K, G), b = B.boss(K, G);
  assert.equal(JSON.stringify(a), JSON.stringify(b));
  let life = 0; for (let i = 0; i < B.N; i++) { life += G.tirada(K.sha(B.SEED + ':' + i), 'tc4').stats.vida; }
  assert.equal(a.life, life);
  assert.ok(a.life > 0 && Array.isArray(a.troop.armonicos) && a.troop.armonicos.length > 0);
});

test('sabotage: another seed is another boss', () => {
  const other = { ...B, SEED: 'tide-boss/1:other' };
  const t = G.tirada(K.sha(other.SEED), 'tc4');
  assert.notEqual(JSON.stringify(t.armonicos), JSON.stringify(B.boss(K, G).troop.armonicos));
});
