// Sound from the first press: the pure parts. Uso: node --test atlas/puros/sound_first_cases.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync, statSync } from 'node:fs';
const require = createRequire(import.meta.url);
const S = require('../../public/game/sound_first.js');
const A = require('../../public/game/audio_only.js');
const page = (f) => readFileSync(new URL('../../public/' + f, import.meta.url), 'utf8');

test('one choice, one key: the switch keeps what audio_only.js reads', () => {
  assert.equal(S.KEY, A.KEY);
});

test('the switch says its state, and says NO_DATA when the browser has no voice', () => {
  assert.equal(S.label(false, true), 'Sound off · press to hear the world');
  assert.equal(S.label(true, true), 'Sound on · the world is spoken · press to turn off');
  assert.equal(S.label(true, false), 'Sound · NO_DATA · this browser has no voice');
});

test('what is spoken is the heading, without the visitor id, at most 120 characters', () => {
  assert.equal(S.said('Visitor-cd6c7071 · Dorvorfen · 0, 1'), 'Dorvorfen · 0, 1');
  assert.equal(S.said('Dorvorfen  ·  0, 0'), 'Dorvorfen · 0, 0');
  assert.equal(S.said(''), '');
  assert.equal(S.said('x'.repeat(300)).length, 120);
});

test('speak hands the newest line to the system voice, or says it could not', () => {
  const log = [];
  const win = { speechSynthesis: { cancel: () => log.push('cancel'), speak: (u) => log.push(u.text) }, SpeechSynthesisUtterance: function (t) { this.text = t; } };
  assert.equal(S.speak(win, 'Dorvorfen · 0, 1'), true);
  assert.deepEqual(log, ['cancel', 'Dorvorfen · 0, 1']);
  assert.equal(S.speak({}, 'x'), false);
  assert.equal(S.speak(win, ''), false);
  assert.equal(S.speak({ speechSynthesis: { cancel() { throw new Error('x'); } }, SpeechSynthesisUtterance: function () {} }, 'x'), false);
});

test('the landing: the switch is a 1-press control placed before the single door', () => {
  const html = page('index.html');
  assert.ok(html.indexOf('id="sound-first"') > 0 && html.indexOf('id="sound-first"') < html.indexOf('id="start"'));
  assert.match(html, /<button type="button" id="sound-first" class="sound-first" aria-pressed="false">/);
  assert.equal((html.match(/class="start"/g) || []).length, 1);
  assert.ok(html.includes('/game/sound_first.js') && page('openworld/index.html').includes('/game/sound_first.js'));
});

test('the piece stays small', () => {
  assert.ok(statSync(new URL('../../public/game/sound_first.js', import.meta.url)).size <= 4608);
});
