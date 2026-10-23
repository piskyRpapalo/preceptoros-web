import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { FakeDocument, host } from './fake_dom.mjs';

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

test('Paint mounts accessible DOM and projects points as SVG without HTML parsing', () => {
  const doc = new FakeDocument(), target = host(doc);
  const view = P.mount(target, { id: 'PAINT_DOM' });
  const surface = target.querySelector('[data-surface="paint"]');
  assert.ok(surface);
  assert.equal(target.querySelectorAll('[data-action]').length, 2);
  view.paint.addPoint(12, 18).addPoint(24, 30); view.refresh();
  assert.ok(surface.querySelector('svg'));
  assert.ok(target.querySelector('[data-frame]').textContent.includes('preceptoros.bubble/1'));
  assert.doesNotMatch(require('node:fs').readFileSync(new URL('../public/game/bubble_paint.js', import.meta.url), 'utf8'), /innerHTML/);
  assert.equal(surface.querySelector('polyline').getAttribute('points'), '12,18 24,30');
});
