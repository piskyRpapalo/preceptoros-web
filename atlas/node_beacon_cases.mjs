// node_beacon_cases.mjs · the live node on the map (public/game/node_beacon.js, 2026-11-15): honest words, honest lamp.
import { test } from 'node:test'; import assert from 'node:assert/strict'; import { createRequire } from 'node:module'; import {runInNewContext} from 'node:vm'; import {readFileSync} from 'node:fs';
const B = createRequire(import.meta.url)('../public/game/node_beacon.js');
test('label: the Beelink host by its public name, Node 0; LIVE says live, STALE says asleep with its last heartbeat day', () => {
  assert.equal(B.label({ id: 'primer-ancla', seal: 'LIVE', since: '2026-11-15' }), '💬 Node 0 · LIVE · measured day 2026-11-15');
  assert.equal(B.label({ id: 'primer-ancla', seal: 'STALE', since: '2026-11-09' }), '💬 Node 0 · asleep 11-09');
  assert.equal(B.label({ id: 'onexstation', seal: 'STALE', since: '' }), 'Onexstation · asleep NO_DATA');
});
test('pick: only measured LIVE nodes enter the map; STALE, unknown and pending stay in publisher history', () => {
  const d = { colonia: { nodes: [{ id: 'primer-ancla', q: 0, r: 0, alive: true, seal: 'LIVE', since: '2026-11-18' },
    { id: 'onexstation', q: 1, r: 0, alive: true, seal: 'STALE', since: '2026-11-04' },
    { id: 'doggee-s110', q: 2, r: 0, alive: true, seal: 'STALE', since: '2026-11-09' },
    { id: 'x', q: 1.5, r: 0, alive: true, seal: 'LIVE', since: '2026-11-18' },
    { id: 'y', q: 2, r: 0, alive: false, seal: 'LIVE', since: '2026-11-18' },
    { id: 'z', q: 3, r: 0, alive: true, seal: 'BRIGHT' },
    { id: 'undated', q: 4, r: 0, alive: true, seal: 'LIVE', since: null }],
    buildings: [], units: [] }, admissions:[{node:'pending-owner',state:'pending'}] };
  assert.deepEqual(B.pick(d).map((n) => n.id + ':' + n.seal), ['primer-ancla:LIVE']);
  assert.equal(d.colonia.nodes.length, 7, 'projection must not erase historical publisher records');
  assert.deepEqual(B.pick({colonia:{nodes:[]},admissions:[{node:'not-admitted',state:'pending'}]}), []);
  assert.deepEqual(B.pick(null), []); assert.deepEqual(B.pick({ colonia: {} }), []);
});
test('a future verified LIVE collaborator is visible but never inherits the Node 0 Hexelion chatbot', () => {
  const source = { colonia: { nodes: [
    { id: 'primer-ancla', q: 0, r: 0, alive: true, seal: 'LIVE', since: '2026-11-18' },
    { id: 'collaborator-test-only', q: 1, r: 0, alive: true, seal: 'LIVE', since: '2026-11-18' }
  ] } };
  const visible = B.pick(source);
  assert.deepEqual(visible.map(n => n.id), ['primer-ancla', 'collaborator-test-only']);
  assert.deepEqual(Object.keys(B.TALKS), ['primer-ancla'], 'only Node 0 has an actually declared gateway chat');
  const collaborator = visible[1];
  assert.match(B.label(collaborator), /LIVE.*measured day 2026-11-18/);
  assert.match(B.describe(collaborator, '2026-11-18'), /declares no chatbot \(NO_DATA\)/);
  assert.doesNotMatch(B.describe(collaborator, '2026-11-18'), /Hexelion/);
  assert.equal(B.frame(collaborator, '2026-11-18').talks, null);
});

test('describe: state, cause and age in words; talk only for the node that declares a chatbot', () => {
  const s = B.describe({ id: 'primer-ancla', seal: 'STALE', since: '2026-11-09' }, '2026-11-15');
  assert.match(s, /^Node 0, asleep: no heartbeat in the last 5 minutes; the last one was 2026-11-09, 6 days ago\./); assert.match(s, /Hexelion/);
  assert.match(B.describe({ id: 'primer-ancla', seal: 'LIVE', since: '2026-11-15' }, '2026-11-15'), /^Node 0, LIVE:.*last reported measurement day 2026-11-15/);
  const o = B.describe({ id: 'onexstation', seal: 'STALE', since: '' }, '2026-11-15');
  assert.match(o, /never measured \(NO_DATA\)/); assert.match(o, /declares no chatbot \(NO_DATA\)/); assert.doesNotMatch(o, /live/);
});
test('frame: the machine reads the same truth (status, source, age, talks) in under 1,024 bytes', () => {
  const f = B.frame({ id: 'primer-ancla', seal: 'STALE', since: '2026-11-09' }, '2026-11-15');
  assert.equal(f.status, 'STALE'); assert.equal(f.age_days, 6); assert.equal(f.talks, 'Node 0'); assert.equal(f.source, 'gateway:/api/world-state');
  assert.equal(f.change[0], B.describe({ id: 'primer-ancla', seal: 'STALE', since: '2026-11-09' }, '2026-11-15'));
  assert.ok(new TextEncoder().encode(JSON.stringify(f)).length < 1024);
  assert.equal(B.frame({ id: 'doggee-s110', seal: 'STALE', since: '2026-11-09' }, '2026-11-15').talks, null);
});

test('persisted offline building has an honest map silhouette, keyboard door, Acho event frame, and no LIVE promotion', () => {
  const beforePlan = globalThis.AtlasTownPlan, beforeState = globalThis.AtlasOpenworldState;
  let measured = null, caption = '';
  globalThis.AtlasOpenworldState = createRequire(import.meta.url)('../public/game/openworld_state.js');
  globalThis.AtlasTownPlan = { hall(_g, x, y, step, _sq, _H, lit) {
    measured = { x, y, step, lit }; return { x0: x - step, x1: x + step, y0: y - step * 3, y1: y + step };
  } };
  const g = { save(){}, restore(){}, fillText(t){caption=t;}, fillRect(){}, strokeRect(){}, measureText(t){return {width:t.length*7};} };
  const data = { esquema: 'preceptoros.openworld-estado/2', colonia: { nodes: [], buildings: [], units: [] },
    edificios_principales: [{ id: 'casa-tank-3', node: 'tank-3', q: 3, r: 0, estado: 'OFFLINE' }] };
  try {
    B.use(data);
    const view = { P: (q, r) => ({ x: q, y: r }), turn: (x, y) => ({ x, y }),
      world: { cells: { at: {} } }, G: { cx: 195, cy: 420, k: 1, tilt: 1 }, height: () => 0, HSTEP: 7,
      H: { T: { FRONT_DOOR: { 'PROPUESTA.base': '#ffee77' }, NEUTRAL: { ink: '#171321', paper: '#fff' } },
        css: String, rgbOf: x => x, shade: x => x } };
    B.draw(g, view, { width: 390, clientWidth: 390, height: 844 });
    assert.deepEqual(measured, { x: 198, y: 420, step: 8, lit: false });
    assert.match(caption, /casa-tank-3.*Tank 3.*OFFLINE/);
    assert.equal(B.buildings()[0].estado, 'OFFLINE');
    assert.equal(B.nodes().length, 0, 'the persisted structure must not materialize an offline node');
    assert.equal(B.hitAt(198, 420).principal.estado, 'OFFLINE');
  } finally {
    if (beforePlan === undefined) delete globalThis.AtlasTownPlan; else globalThis.AtlasTownPlan = beforePlan;
    if (beforeState === undefined) delete globalThis.AtlasOpenworldState; else globalThis.AtlasOpenworldState = beforeState;
  }
});

test('airplane-mode node beacon refuses API traffic and does not keep stale LIVE nodes', () => {
  const src = readFileSync(new URL('../public/game/node_beacon.js', import.meta.url), 'utf8');
  let calls = 0;
  const context = { module: { exports: {} }, Date, navigator: { onLine: false },
    fetch: () => { calls++; return Promise.resolve({ok: false}); },
    document: { getElementById: () => null } };
  runInNewContext(src, context);
  context.module.exports.draw({}, {}, {});
  assert.equal(calls, 0, 'offline must attempt zero network calls');
  assert.equal(context.module.exports.nodes().length, 0, 'offline must not retain old LIVE');
});
