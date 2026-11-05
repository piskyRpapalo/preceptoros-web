// Cases for preceptor-coder. The law is the same one the web uses; sabotage must be refused.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { ley, svg } from './bin/preceptor-coder.mjs';

const CABIN = JSON.parse(readFileSync(fileURLToPath(new URL('./frames/cabin.json', import.meta.url)), 'utf8'));

test('the cabin fixture obeys the law', () => {
  assert.deepEqual(ley(CABIN), []);
});

test('sabotage: an atom with no sentence is refused by the law', () => {
  const malo = JSON.parse(JSON.stringify(CABIN)); malo.atoms[0].r = '';
  assert.ok(ley(malo).some((p) => /no sentence/.test(p)));
});

test('sabotage: a frame over 1,024 bytes is refused by the law', () => {
  const malo = JSON.parse(JSON.stringify(CABIN)); malo.atoms[0].r = 'x'.repeat(1100);
  assert.ok(ley(malo).some((p) => /bytes/.test(p)));
});

test('deterministic: the same frame gives the same drawing', () => {
  assert.equal(svg(CABIN).svg, svg(CABIN).svg);
});

test('the drawing is an SVG root with the frame sentences as its label', () => {
  const s = svg(CABIN).svg;
  assert.match(s, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" viewBox="0 0 320 96"/);
  assert.match(s, /aria-label="The tutorial cabin/);
});

test('the size is measured and reported, not hidden: the cabin drawing is above 16 KiB today', () => {
  const bytes = Buffer.byteLength(svg(CABIN).svg, 'utf8');
  assert.ok(bytes > 0, 'the size must be measured');
  // Recorded finding: the piece ceiling is 16,384 B. The drawing is over it; reducing it is a decision (see the record).
  assert.ok(bytes > 16384, 'if this drops under 16 KiB, update the record and this case');
});
