import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const P = require('../public/game/bubble_paint.js');
const p = P.create({ id: 'GATE', band: 'paper' });
for (const q of [[20, 30], [40, 50], [70, 40]]) p.addPoint(q[0], q[1]);
const first = p.frame();
assert.equal(first.atoms[0].i[0].o, 'ribbon');
assert.ok(p.tryFrame().bytes < 1024);
assert.deepEqual(p.frame(), first);
const long = P.create({ id: 'LONG' });
let rejected = false;
for (let i = 0; i < 200 && !rejected; i++) {
  const before = long.points().length;
  const result = long.addPoint(i, i % 2);
  if (result && result.ok === false) {
    rejected = true;
    assert.equal(long.points().length, before);
    assert.match(result.cause, /1024/);
  }
}
assert.equal(rejected, true);
console.log(JSON.stringify({ ok: true, bytes: p.tryFrame().bytes, rejected_whole: rejected }));
