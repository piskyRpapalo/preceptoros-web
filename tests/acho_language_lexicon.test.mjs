import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';

const lexicon = readFileSync(new URL('../docs/lexicon.md', import.meta.url), 'utf8');
const implementation = readFileSync(new URL('../docs/lexicon-implementation.md', import.meta.url), 'utf8');
const spec = readFileSync(new URL('../docs/acho-language.md', import.meta.url), 'utf8');
const runtime = readFileSync(new URL('../public/game/acho_language.js', import.meta.url), 'utf8');

test('lexicon stays a proposal while the acho-language alias map is explicit', () => {
  assert.match(lexicon, /^\*\*Status:\*\* PROPOSAL/m);
  assert.match(implementation, /^## K · Acho language contract map/m);
  assert.match(implementation, /Acho language.*canonical language name/i);
  assert.match(implementation, /preceptoros\.acho\/1.*versioned frame schema/i);
  assert.match(implementation, /frame.*serialized unit/i);
  assert.match(implementation, /syllable.*metaphor/i);
  assert.match(implementation, /AtlasAcho.*runtime API/i);
  assert.match(spec, /# The Acho language · `preceptoros\.acho\/1`/);
  assert.match(runtime, /VERSION = 'preceptoros\.acho\/1', ALIAS = 'preceptoros\.bubble\/1'/);
});

test('lexicon remains below the file budget', () => {
  assert.ok(statSync(new URL('../docs/lexicon.md', import.meta.url)).size < 16384);
});
