import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const S = require('../public/game/crab_state_screen.js');

const ids = ['who', 'body', 'core', 'budget', 'receipts', 'actions'];
assert.deepEqual(S.guion().map((s) => s.id), ids, 'the player state has one fixed order');
assert.deepEqual(S.guion(), S.guion(), 'the script is deterministic');
assert.deepEqual(S.guion().map((s) => s.titulo), ['state_who', 'state_body', 'state_core', 'state_budget', 'state_receipts', 'state_actions']);
assert.equal(S.SECCIONES.length, 6, 'reserved future slots are not rendered today');
console.log('5C crab state script: 4/4 green');
