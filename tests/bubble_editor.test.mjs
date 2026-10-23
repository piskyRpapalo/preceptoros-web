import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const E = require('../public/game/bubble_editor.js');
const B = require('../public/game/bubble_language.js');

test('editor creates deterministic Bubble frames and rejects oversized output whole', () => {
  const a = E.create({ id: 'EDITOR', primitive: 'blob', band: 'cyan', x: 80, y: 90 });
  const b = E.create({ id: 'EDITOR', primitive: 'blob', band: 'cyan', x: 80, y: 90 });
  assert.equal(a.v, 'preceptoros.bubble/1');
  assert.deepEqual(a, b);
  assert.ok(Buffer.byteLength(JSON.stringify(a)) < 1024);
  assert.ok(B.compile(a).length > 0);
  assert.throws(() => E.serialize({ ...a, note: 'x'.repeat(1100) }), /1024/);
  assert.deepEqual(E.PRIMITIVES, ['wave', 'blob', 'ribbon', 'arcs', 'field', 'wall', 'text', 'keep', 'neck']);
});

test('editor surface exposes labeled, keyboard-operable controls and text output', () => {
  const root = { innerHTML: '', querySelectorAll: () => [] };
  const view = E.mount(root);
  assert.equal(typeof view.frame, 'function');
  assert.match(root.innerHTML, /aria-label=/);
  assert.match(root.innerHTML, /preceptoros\.bubble\/1/);
});
