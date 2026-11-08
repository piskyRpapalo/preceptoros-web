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

test('the bubble rests minimized: its name is a 44 px toggle, the line stays for screen readers (Sovereign, 2026-11-08)', async () => {
  const { readFileSync } = await import('node:fs');
  const js = readFileSync(new URL('../../public/game/preceptor_talk.js', import.meta.url), 'utf8');
  const css = readFileSync(new URL('../../public/game/talk.css', import.meta.url), 'utf8');
  const assert = (await import('node:assert/strict')).default;
  assert.match(js, /box\.classList\.add\('pt-min'\)/, 'the bubble does not start minimized');
  assert.match(js, /createElement\('button'\); who\.type = 'button'; who\.className = 'pt-who'/, 'its name is not a button');
  assert.match(js, /aria-expanded/, 'the toggle does not say whether it is open');
  assert.match(css, /\.pt-min \.pt-line>span\{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset\(50%\)/, 'the minimized line is not kept for screen readers');
  assert.doesNotMatch(css, /\.pt-min \.pt-line[^{]*\{[^}]*display:none/, 'the minimized line is removed from screen readers');
  assert.match(css, /\.pt-who\{[^}]*min-height:44px;min-width:44px/, 'the toggle is smaller than 44 px');
});
