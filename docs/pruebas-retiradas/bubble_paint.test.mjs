import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { FakeDocument, host } from './fake_dom.mjs';

const require = createRequire(import.meta.url);
const P = require('../public/game/bubble_paint.js');
const B = require('../public/game/bubble_language.js');
const Tokens = require('../public/game/comic_tokens.js');

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

test('Paint maps into the fitted viewBox and rejects the letterbox bars', () => {
  const landscape = { left: 10, top: 20, width: 824, height: 515 };
  assert.deepEqual(P.viewportPoint(landscape, 422, 277.5, 412, 515), [206, 257.5]);
  assert.equal(P.viewportPoint(landscape, 20, 277.5, 412, 515), null);
  const portrait = { left: 0, top: 0, width: 412, height: 180 };
  assert.deepEqual(P.viewportPoint(portrait, 206, 90, 412, 515), [206, 257.5]);
  assert.equal(P.viewportPoint(portrait, 2, 90, 412, 515), null);
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
  assert.equal(surface.querySelector('polyline').getAttribute('stroke'), Tokens.FRONT_DOOR.cyan);
});

test('Paint pointer ignores letterboxing and records the transformed SVG point', () => {
  const doc = new FakeDocument(), target = host(doc), view = P.mount(target, { id: 'PAINT_VIEWPORT' });
  const surface = target.querySelector('[data-surface="paint"]');
  let svg = surface.querySelector('svg');
  svg.getBoundingClientRect = () => ({ left: 10, top: 20, width: 824, height: 515 });
  surface.listeners.pointerdown[0]({ clientX: 20, clientY: 277.5, pointerId: 1, pointerType: 'mouse' });
  assert.equal(view.paint.state().cause, 'outside drawing viewport');
  assert.equal(view.paint.points().length, 0);
  svg = surface.querySelector('svg');
  svg.getBoundingClientRect = () => ({ left: 10, top: 20, width: 824, height: 515 });
  surface.listeners.pointerdown[0]({ clientX: 422, clientY: 277.5, pointerId: 1, pointerType: 'mouse' });
  assert.deepEqual(view.paint.points(), [[206, 258]]);
});
