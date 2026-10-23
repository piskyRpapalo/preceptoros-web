import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { FakeDocument, host } from './fake_dom.mjs';

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
  const doc = new FakeDocument();
  const root = host(doc);
  const view = E.mount(root);
  assert.equal(typeof view.frame, 'function');
  const controls = root.querySelectorAll('[data-field]');
  assert.equal(controls.length, 5);
  assert.ok(controls.every(control => control.getAttribute('aria-label')));
  assert.equal(root.querySelector('[data-output="status"]').textContent, 'preceptoros.bubble/1');
  assert.equal(root.querySelector('[data-output="frame"]').textContent, E.serialize(view.frame()));
  assert.doesNotMatch(require('node:fs').readFileSync(new URL('../public/game/bubble_editor.js', import.meta.url), 'utf8'), /innerHTML/);
});
