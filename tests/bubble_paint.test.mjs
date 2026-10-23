import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const P = require('../public/game/bubble_paint.js');
const B = require('../public/game/bubble_language.js');

test('Paint records points as a single frame ribbon and undo/redo is exact', () => {
  const p = P.create({ id: 'PAINT', band: 'paper' });
  p.addPoint(20, 30).addPoint(40, 50).addPoint(70, 40);
  const before = p.frame();
  assert.equal(before.v, 'preceptoros.bubble/1');
  assert.equal(before.atoms[0].i[0].o, 'ribbon');
  assert.deepEqual(before.atoms[0].i[0].pts, [[20, 30], [40, 50], [70, 40]]);
  assert.ok(B.compile(before).length > 0);
  p.undo();
  assert.equal(p.frame().atoms[0].i[0].pts.length, 2);
  p.redo();
  assert.deepEqual(p.frame(), before);
});

test('Paint rejects over-limit strokes without truncation and announces cause', () => {
  const p = P.create({ id: 'PAINT' });
  let rejected = null;
  for (let i = 0; i < 200 && !rejected; i++) {
    const before = p.points().length;
    const r = p.addPoint(i, i % 2);
    if (r && r.ok === false) {
      rejected = r;
      assert.equal(p.points().length, before, 'rejected point must not truncate or mutate the frame');
    }
  }
  assert.ok(rejected, 'oversized stroke was not rejected');
  assert.match(rejected.cause, /1024/);
  assert.equal(p.tryFrame().ok, true);
});
