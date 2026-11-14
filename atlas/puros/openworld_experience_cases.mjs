// OpenWorld UX gate: actual coordinates and visit state, never click-only "success".
// In isolation these tests need only node:test and the native pure module.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
const require = createRequire(import.meta.url);
const UX = require('../../public/game/openworld_experience.js');

function controller(q = 0, r = 0) {
  const pos = { q, r };
  const dx = { east: [1, 0], 'north-east': [1, -1], 'north-west': [0, -1],
    west: [-1, 0], 'south-west': [-1, 1], 'south-east': [0, 1] };
  return {
    walker: () => ({ ...pos }),
    step: (id) => { pos.q += dx[id][0]; pos.r += dx[id][1]; return true; }
  };
}
test('six named controls, six distinct deterministic directions', () => {
  assert.deepEqual(UX.DIRS.map(x => x.id), [
    'north-west', 'north-east', 'west', 'east', 'south-west', 'south-east'
  ]);
  for (const dir of UX.DIRS.map(x => x.id)) {
    const a = controller(), b = controller();
    assert.deepEqual(UX.move(a, dir), UX.move(b, dir), dir);
  }
});
test('a walk uses existing controls and only accepted coordinate changes count', () => {
  const c = controller();
  const a = UX.move(c, 'north-east');
  assert.equal(a.ok, true);
  assert.deepEqual(a.after, { q: 1, r: -1 });
  const b = UX.move(c, 'west');
  assert.equal(b.ok, true);
  assert.deepEqual(b.after, { q: 0, r: -1 });
});
test('a dispatch or a method returning true is not proof of movement', () => {
  const c = { walker: () => ({ q: 2, r: 3 }), step: () => true };
  const r = UX.move(c, 'east');
  assert.equal(r.ok, false);
  assert.equal(r.cause, 'hex_not_traversed');
  assert.deepEqual(r.before, r.after);
});
test('a missing character, unverified controls, unknown direction and thrown movement fail closed', () => {
  assert.equal(UX.move(null, 'east').cause, 'character_controls_unavailable');
  assert.equal(UX.move(controller(), 'teleport').cause, 'invalid_direction');
  assert.equal(UX.move({ walker: () => null, step: () => true }, 'east').cause, 'character_not_ready');
  assert.equal(UX.move({ walker: () => ({q:0,r:0}), step: () => { throw Error('blocked'); } }, 'east').cause, 'movement_refused');
});
test('an observed visit delta is the source for resource and step feedback', () => {
  const a = UX.snapshot({ copper: 0, light: 0, step: 0, troops: [] });
  const b = UX.snapshot({ copper: 100, light: 100, step: 1, troops: [1] });
  assert.match(UX.change(null, a), /^Visit started/);
  assert.equal(UX.change(a, a), '');
  assert.match(UX.change(a, b), /copper \+100 \(now 100\)/);
  assert.match(UX.change(a, b), /steps \+1 \(now 1\)/);
  assert.match(UX.change(a, b), /troops \+1 \(now 1\)/);
});
test('missing or invalid resource counters do not masquerade as rewards', () => {
  assert.equal(UX.snapshot({ copper: '100', light: 0, step: 0 }), null);
  assert.equal(UX.snapshot({ copper: 1, light: 0, step: -1 }), null);
  assert.match(UX.change(null, null), /^NO_DATA/);
  assert.equal(UX.point({ q: 1.2, r: 3 }), null);
});
test('the derived banner is bounded; source text stays inert', () => {
  assert.equal(UX.message('  Did   a thing \n now '), 'Did a thing now');
  assert.equal(UX.message('x'.repeat(450)).length, 188);
  assert.equal(UX.message('<script>alert(1)</script>'), '<script>alert(1)</script>');
});
test('the new layer reuses native walkers without a second movement engine, network or clocks', () => {
  const js = readFileSync(new URL('../../public/game/openworld_experience.js', import.meta.url), 'utf8');
  const html = readFileSync(new URL('../../public/openworld/index.html', import.meta.url), 'utf8');
  const css = readFileSync(new URL('../../public/assets/openworld_experience.css', import.meta.url), 'utf8');
  for (const forbidden of ['Math.random(', 'Date.now(', 'setInterval(', 'fetch(', 'WebSocket(', 'XMLHttpRequest(']) {
    assert.ok(!js.includes(forbidden), 'new UI has forbidden path ' + forbidden);
  }
  assert.ok(js.includes('controls.step(direction)'), 'uses original deterministic walker');
  assert.match(html, /\/game\/openworld_experience\.js/);
  assert.match(html, /\/assets\/openworld_experience\.css/);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(css, /forced-colors/);
  assert.match(css, /min-height:48px/);
});
