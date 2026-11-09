// Y10 (odd/tasks/chat-9nov-tanda.md): Communication gives the panel to the live chat. Measured in a browser on 2026-11-09
// (order open-chat, Radio; first heading «Chat live»; the Radio banner hidden); this guard keeps the three sources honest.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = (p) => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
test('the live chat is named Chat live and goes before the Radio voice', () => {
  const s = read('public/game/open_talk.js');
  assert.match(s, /h\.textContent = 'Chat live'/);
  assert.doesNotMatch(s, /Chat to the rack/);
  assert.match(s, /list\.insertBefore\(li, radio\)/);
});
test('no «news of the map» banner tops Communication', () => {
  assert.doesNotMatch(read('public/openworld/index.html'), /news of the map/);
  assert.match(read('public/assets/openworld.css'), /#voices \[data-speaker="Radio"\] > \.who \{ display: none; \}/);
});
test('Y7: the finished tutorial folds to its minimum and rests', () => {
  const s = read('public/game/visitor_play.js');
  assert.match(s, /s\.troops\.length && t === 'Ask the guide in the chat\.'/);
  assert.match(s, /classList\.toggle\('folded', fin\)/);
  assert.match(read('public/assets/openworld.css'), /#next\.folded\{opacity:\.6;pointer-events:none/);
});
