// odds_beside_cases.mjs · each summon's odds stand beside its button, never folded (visitor_view.js, 2026-11-15).
import { test } from 'node:test'; import assert from 'node:assert/strict'; import { readFileSync } from 'node:fs';
const src = readFileSync(new URL('../public/game/visitor_view.js', import.meta.url), 'utf8');
test('the odds line is moved right after the summon button it prices', () => {
  assert.ok(/odds per thousand/.test(src)); assert.ok(/#visitor-summon-' \+ m\[1\]/.test(src)); assert.ok(/b\.after\(p\)/.test(src));
});
test('the odds are never sent into Technical details', () => {
  const tech = src.slice(src.indexOf('Technical details'), src.indexOf('The odds stand beside'));
  assert.ok(!/odds/.test(tech));
});
