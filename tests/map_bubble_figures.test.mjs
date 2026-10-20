import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
const require = createRequire(import.meta.url);
const root = new URL('..', import.meta.url);
const read = f => readFileSync(new URL(f, root), 'utf8');

test('map figures compile bestiary words at the supplied point and state', () => {
  const figures = require('../public/game/map_bubble_figures.js');
  const frame = figures.frame('star', 31, 47, 12, 'shut');
  assert.deepEqual([frame.atoms[0].i[0].x, frame.atoms[0].i[0].y, frame.atoms[0].i[0].r, frame.atoms[0].i[0].eye], [31, 47, 12, 'shut']);
  const calls = [];
  assert.equal(figures.draw({}, 'star', 31, 47, 12, 'shut', {
    bubble: { compile: f => { calls.push(f); return [{ op: 'path' }]; } },
    painter: { paint: (ctx, items) => calls.push(items) }
  }), true);
  assert.equal(calls.length, 2);
});

test('map layer and reef coral route their visible figures through the bestiary adapter', () => {
  const nodeCalls = [], nodeContext = {
    AtlasMapBubbleFigures: { draw: (...args) => { nodeCalls.push(args); return true; } }
  };
  vm.runInNewContext(read('public/game/map_nodes_layer.js'), nodeContext);
  const nodePositions = [];
  nodeContext.AtlasMapNodes.pinta({ beginPath() {}, arc() {}, stroke() {}, save() {}, restore() {} }, (x, y) => [x * 2, y * 3], {
    H0: [{ nodo: 'node', x: 5, y: 7, gen: { estado: 'MEDIDO' } }], col: { tuya: 'x' }, t: 0, dpr: 1,
    pon: (x, y, paint, ficha) => { nodePositions.push([x, y, ficha()]); paint(); }
  });
  assert.deepEqual(nodePositions[0].slice(0, 2), [5, 7]);
  assert.equal(nodePositions[0][2].que, 'node');
  assert.equal(nodePositions[0][2].estado, 'MEDIDO');
  assert.deepEqual(nodeCalls[0].slice(1, 5), ['star', 10, 21, 18.72]);
  assert.equal(nodeCalls[0][5], 'open');

  const coralCalls = [], coralContext = {
    AtlasMapBubbleFigures: { draw: (...args) => { coralCalls.push(args); return true; } },
    AtlasNiebla: { sitioNodo: () => ({ x: 10, y: 20 }) }, AtlasNodeProjection: { select: () => [{ nodo: 'node', aparato: { medidas: { ram: { estado: 'MEDIDO' } } } }] },
    AtlasPlaceCards: { ficha: (kind, data) => ({ kind, data }) }
  };
  vm.runInNewContext(read('public/game/reef_corals.js'), coralContext);
  const coralPositions = [];
  coralContext.AtlasCorales.pinta({ save() {}, restore() {}, beginPath() {}, ellipse() {}, fill() {}, stroke() {}, setLineDash() {}, moveTo() {}, lineTo() {}, arc() {} }, (x, y) => [x * 2, y * 3], {
    projection: {}, dpr: 1, pon: (x, y, paint, ficha) => { coralPositions.push([x, y, ficha()]); paint(); }
  });
  assert.deepEqual(coralPositions[0].slice(0, 2), [56, 66]);
  assert.equal(coralPositions[0][2].kind, 'coral');
  assert.ok(coralCalls.length > 0);
  assert.equal(coralCalls[0][1], 'star');
  assert.equal(coralCalls[0][5], 'open');
});

test('arena loads bestiary before either map painter', () => {
  const source = read('public/assets/thegame.js');
  const arena = source.match(/var ARENA = \[([\s\S]*?)\];/)[1];
  assert.ok(arena.indexOf('/game/bubble_bestiary.js') >= 0);
  assert.ok(arena.indexOf('/game/bubble_bestiary.js') < arena.indexOf('/game/reef_corals.js'));
  assert.ok(arena.indexOf('/game/bubble_bestiary.js') < arena.indexOf('/game/map_nodes_layer.js'));
});

test('map bubble renderer stays under the per-file ceiling', () => {
  const bytes = readFileSync(new URL('public/game/map_bubble_figures.js', root)).length;
  assert.ok(bytes < 16384, 'map_bubble_figures.js over ceiling: ' + bytes);
});
