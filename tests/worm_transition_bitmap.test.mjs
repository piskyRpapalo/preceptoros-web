import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

const receipt = JSON.parse(execFileSync(process.execPath,
  ['atlas/gusano_bitmap_casos.mjs'], { encoding: 'utf8', timeout: 90000 }));

test('worm transition renders repeatable neck bitmaps and catches scroll-progress drift', () => {
  assert.equal(receipt.repeat, 'PASS');
  assert.equal(receipt.same_p_sha256.length, 64);
  assert.notEqual(receipt.same_p_sha256, receipt.sabotage_p_sha256);
  assert.equal(receipt.changed_at_sabotage, true);
});
