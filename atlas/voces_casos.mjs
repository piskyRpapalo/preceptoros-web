// LAS VOCES · the immutable table of who speaks in the conversation panel (public/game/terminal_panel.js).
// Uso: node --test atlas/voces_casos.mjs
// Laws: the table is pinned by sha256 (a new voice is a new signed version: change PIN in the same signed PR);
// every title is a valid header under 1,024 B; the chunk model, the edge model, the rack and the contributors' models are
// all named; decir() writes «Title · text» with data-voice and data-speaker, and refuses an unknown voice.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
const P = createRequire(import.meta.url)('../public/game/terminal_panel.js');
const PIN = 'a9594ab7fc8799bd1688d009ddc2f5f3d117c49a5bc8ce8e1dbeed330780a676';

test('the voices table is the pinned one (immutable panel)', () => {
  assert.equal(createHash('sha256').update(JSON.stringify(P.VOCES)).digest('hex'), PIN);
  assert.ok(Object.isFrozen(P.VOCES) && P.VOCES.every(Object.isFrozen));
  assert.throws(() => { 'use strict'; P.VOCES.push(['x']); });
});

test('from the chunk model to the contributors: every kind of voice is named', () => {
  const ids = P.VOCES.map((v) => v[0]);
  for (const id of ['you', 'script', 'chunk', 'hexelion', 'rack', 'jewels', 'claude', 'codex', 'mistral', 'glm']) { assert.ok(ids.includes(id), id); }
  assert.equal(new Set(ids).size, ids.length);
  for (const v of P.VOCES) { if (v[1]) { assert.equal(P.frame(v[1]), v[1]); } assert.ok(v[2] && v[3], v[0]); }
});

function doc() {
  const el = () => ({ dataset: {}, children: [], title: '', textContent: '', appendChild(c) { this.children.push(c); return c; } });
  return { createElement: el, log: el() };
}
test('decir writes the title first, with its voice, and refuses an unknown voice', () => {
  const d = doc();
  const li = P.decir(d, d.log, 'hexelion', 'NO_DATA · the door is closed');
  assert.equal(li.textContent, 'Hexelion · NO_DATA · the door is closed');
  assert.equal(li.dataset.voice, 'hexelion'); assert.equal(li.dataset.speaker, 'Hexelion');
  assert.match(li.title, /edge door · the rack, through api\.preceptoros\.org$/);
  assert.equal(P.decir(d, d.log, 'script', 'Welcome.', 'Tutorial cabin').textContent, 'Tutorial cabin · Welcome.');
  assert.equal(P.decir(d, d.log, 'chunk', 'hi', 'SmolLM2-135M-Instruct-Q4_K_M').textContent, 'SmolLM2-135M-Instruct-Q4_K_M · hi');
  assert.equal(d.log.children.length, 3);
  assert.throws(() => P.decir(d, d.log, 'oracle', 'x'), /unknown voice/);
  assert.throws(() => P.decir(d, d.log, 'script', 'x'), /without a speaker/);
});
