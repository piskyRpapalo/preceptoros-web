import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

const receipt = JSON.parse(execFileSync(process.execPath,
  ['atlas/gusano_bitmap_casos.mjs'], { encoding: 'utf8', timeout: 60000 }));

test('worm transition renders a repeatable bitmap sequence and catches timing drift', () => {
  assert.equal(receipt.frames_per_run, 8);
  assert.equal(receipt.same_schedule_sha256, receipt.repeat_sha256);
  assert.notEqual(receipt.same_schedule_sha256, receipt.sabotage_schedule_sha256);
  assert.equal(receipt.timing_sabotage, 'RED');
});
