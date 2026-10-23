import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';

const lexicon = readFileSync(new URL('../docs/lexicon.md', import.meta.url), 'utf8');
const implementation = readFileSync(new URL('../docs/lexicon-implementation.md', import.meta.url), 'utf8');
const spec = readFileSync(new URL('../docs/bubble-language.md', import.meta.url), 'utf8');
const runtime = readFileSync(new URL('../public/game/bubble_language.js', import.meta.url), 'utf8');

test('lexicon stays a proposal while the bubble-language alias map is explicit', () => {
  assert.match(lexicon, /^\*\*Status:\*\* PROPOSAL/m);
  assert.match(implementation, /^## K · Bubble language contract map/m);
  assert.match(implementation, /bubble language.*canonical language name/i);
  assert.match(implementation, /preceptoros\.bubble\/1.*versioned frame schema/i);
  assert.match(implementation, /frame.*serialized unit/i);
  assert.match(implementation, /syllable.*metaphor/i);
  assert.match(implementation, /AtlasBubble.*runtime API/i);
  assert.match(spec, /# The bubble language · `preceptoros\.bubble\/1`/);
  assert.match(runtime, /VERSION = 'preceptoros\.bubble\/1'/);
});

test('lexicon remains below the file budget', () => {
  assert.ok(statSync(new URL('../docs/lexicon.md', import.meta.url)).size < 16384);
});
