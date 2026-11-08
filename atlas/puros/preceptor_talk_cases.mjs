// The preceptor's dialogue box is deterministic: the same line and event always give the same next line.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const T = createRequire(import.meta.url)('../../public/game/preceptor_talk.js');
test('every answer leads to a line that exists, and every line has at least one answer', () => {
  for (const [id, l] of Object.entries(T.LINES)) {
    assert.ok(l[1].length >= 1, id);
    l[1].forEach((a, i) => assert.ok(T.LINES[T.choose(id, i)], id + ' → ' + a[0]));
    assert.ok(l[0].length <= 60, 'a short line fits the small box: ' + id);
  }
});
test('events move the talk only where they mean something, the same way every time', () => {
  assert.equal(T.next('walk', 'walked'), 'walked');
  assert.equal(T.next('walk', 'walked'), T.next('walk', 'walked'));
  assert.equal(T.next('hello', 'walked'), 'walked', 'a visitor who walks before answering is answered');
  assert.equal(T.next('hello', 'entered'), 'entered');
  assert.equal(T.next('play', 'playing'), 'playing');
  assert.equal(T.next('rest', 'entered'), 'rest', 'a visitor who said «Later» is left in peace');
});
