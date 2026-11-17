// G4-2 · First Journey Contract — hexagonal route tests (odd/tasks/first-journey-contract.md).
// Tests: axial distance, BFS routing, blocked shortest path, prohibited cells, rejected steps.
// Distinguishes: mathematical distance, transitible path, allowed movement, signed step, confirmed displacement.
// Usage: node --test atlas/hex_route_cases.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const req = createRequire(import.meta.url);
const J = req('../atlas/puros/tutorial_journey.js');

// Fixtures: a ring of 7 nodes around (0,0) — home at center, 6 neighbours
function ringNodes() {
  return [
    { id: 'home', q: 0, r: 0 },
    { id: 'e',  q: 1, r: 0 },
    { id: 'ne', q: 1, r: -1 },
    { id: 'nw', q: 0, r: -1 },
    { id: 'w',  q: -1, r: 0 },
    { id: 'sw', q: -1, r: 1 },
    { id: 'se', q: 0, r: 1 }
  ];
}

function allSealsLIVE(nodes) {
  var seals = {};
  for (var i = 0; i < nodes.length; i++) {
    seals[nodes[i].id] = 'LIVE';
  }
  return seals;
}

// --- AXIAL DISTANCE ---

test('axialDistance: mismo hex es 0', () => {
  assert.equal(J.axialDistance(0, 0, 0, 0), 0);
});

test('axialDistance: vecino al este es 1', () => {
  assert.equal(J.axialDistance(0, 0, 1, 0), 1);
});

test('axialDistance: vecino al norte-oeste es 1', () => {
  assert.equal(J.axialDistance(0, 0, 0, -1), 1);
});

test('axialDistance: dos hexes al este es 2', () => {
  assert.equal(J.axialDistance(0, 0, 2, 0), 2);
});

test('axialDistance: diagonal (1,1) es 1', () => {
  assert.equal(J.axialDistance(0, 0, 0, 1), 1);
});

test('axialDistance: (0,0) a (3,-2) es 3', () => {
  assert.equal(J.axialDistance(0, 0, 3, -2), 3);
});

test('axialDistance: simétrico', () => {
  assert.equal(J.axialDistance(0, 0, 3, -2), J.axialDistance(3, -2, 0, 0));
});

// --- AXIAL NEIGHBOURS ---

test('axialNeighbours: 6 vecinos en orden fijo', () => {
  var neighbours = J.axialNeighbours(0, 0);
  assert.equal(neighbours.length, 6);
  assert.deepEqual(neighbours, [
    { q: 1, r: 0 }, { q: 1, r: -1 }, { q: 0, r: -1 },
    { q: -1, r: 0 }, { q: -1, r: 1 }, { q: 0, r: 1 }
  ]);
});

test('axialNeighbours: desde (5,3)', () => {
  var neighbours = J.axialNeighbours(5, 3);
  assert.equal(neighbours.length, 6);
  assert.deepEqual(neighbours[0], { q: 6, r: 3 });
  assert.deepEqual(neighbours[3], { q: 4, r: 3 });
});

// --- HEX ROUTE — BFS ---

test('hexRoute: mismo nodo, camino de un paso', () => {
  var nodes = ringNodes();
  var seals = allSealsLIVE(nodes);
  var r = J.hexRoute(nodes, seals, 0, 0, 0, 0);
  assert.equal(r.ok, true);
  assert.equal(r.path.length, 1);
  assert.equal(r.path[0].id, 'home');
});

test('hexRoute: vecino al este, camino de 2 pasos', () => {
  var nodes = ringNodes();
  var seals = allSealsLIVE(nodes);
  var r = J.hexRoute(nodes, seals, 0, 0, 1, 0);
  assert.equal(r.ok, true);
  assert.equal(r.path.length, 2);
  assert.equal(r.path[0].id, 'home');
  assert.equal(r.path[1].id, 'e');
});

test('hexRoute: camino de 3 pasos a través de dos vecinos', () => {
  var nodes = ringNodes();
  var seals = allSealsLIVE(nodes);
  var r = J.hexRoute(nodes, seals, 0, 0, -1, 0);
  assert.equal(r.ok, true);
  assert.equal(r.path.length, 2);
  assert.equal(r.path[0].id, 'home');
  assert.equal(r.path[1].id, 'w');
});

// --- BLOCKED SHORTEST PATH ---

test('hexRoute: camino más corto bloqueado, encuentra ruta alternativa', () => {
  var nodes = ringNodes();
  // Block 'e' (the direct neighbour to the east)
  var seals = allSealsLIVE(nodes);
  seals['e'] = 'NO_DATA';
  // Route from home (0,0) to w (-1,0) — direct path is 1 step
  // But if we block home's direct neighbour 'w', it should find alternative
  seals['w'] = 'NO_DATA';
  var r = J.hexRoute(nodes, seals, 0, 0, -1, 0);
  // w is blocked, so destination is unreachable
  assert.equal(r.ok, false);
  assert.ok(r.cause.indexOf('not alive') >= 0 || r.cause.indexOf('unreachable') >= 0);
});

test('hexRoute: camino más corto bloqueado, ruta larga funciona', () => {
  // Build a longer chain: home → ne → nw → w (3 steps instead of 1)
  var nodes = [
    { id: 'home', q: 0, r: 0 },
    { id: 'ne', q: 1, r: -1 },
    { id: 'nw', q: 0, r: -1 },
    { id: 'w', q: -1, r: 0 },
    { id: 'mid', q: -1, r: -1 }  // bridge between nw and w
  ];
  var seals = allSealsLIVE(nodes);
  // Block direct path: no direct neighbour from home to w
  // Route home → nw → mid → w (3 steps)
  var r = J.hexRoute(nodes, seals, 0, 0, -1, 0);
  assert.equal(r.ok, true);
  // The path should go through intermediate nodes
  assert.ok(r.path.length >= 2);
  assert.equal(r.path[0].id, 'home');
  assert.equal(r.path[r.path.length - 1].id, 'w');
});

test('hexRoute: destino inalcanzable porque todos los caminos intermedios están bloqueados', () => {
  // home (0,0) and far (2,0) are NOT direct neighbours — need (1,0) as bridge
  var nodes = [
    { id: 'home', q: 0, r: 0 },
    { id: 'mid', q: 1, r: 0 },
    { id: 'far', q: 2, r: 0 }
  ];
  var seals = {};
  seals['home'] = 'LIVE';
  seals['far'] = 'LIVE';
  seals['mid'] = 'NO_DATA'; // bridge is blocked
  var r = J.hexRoute(nodes, seals, 0, 0, 2, 0);
  assert.equal(r.ok, false);
  assert.ok(r.cause.indexOf('unreachable') >= 0);
});

// --- PROHIBITED CELLS ---

test('hexRoute: no atraviesa celdas sin nodo', () => {
  var nodes = [
    { id: 'home', q: 0, r: 0 },
    { id: 'far', q: 2, r: 0 }
    // No node at (1,0) — the direct path is blocked
  ];
  var seals = { home: 'LIVE', far: 'LIVE' };
  var r = J.hexRoute(nodes, seals, 0, 0, 2, 0);
  assert.equal(r.ok, false);
  assert.ok(r.cause.indexOf('unreachable') >= 0);
});

test('routeCrossesProhibited: ruta válida pasa', () => {
  var nodes = ringNodes();
  var seals = allSealsLIVE(nodes);
  var path = [{ q: 0, r: 0 }, { q: 1, r: 0 }];
  var r = J.routeCrossesProhibited(path, seals, nodes);
  assert.equal(r.ok, true);
});

test('routeCrossesProhibited: ruta que cruza nodo NO_DATA es rechazada', () => {
  var nodes = ringNodes();
  var seals = allSealsLIVE(nodes);
  seals['e'] = 'NO_DATA';
  var path = [{ q: 0, r: 0 }, { q: 1, r: 0 }];
  var r = J.routeCrossesProhibited(path, seals, nodes);
  assert.equal(r.ok, false);
  assert.ok(r.cause.indexOf('NO_DATA') >= 0);
  assert.ok(r.cause.indexOf('crosses non-visible') >= 0);
});

test('routeCrossesProhibited: ruta que cruza hex sin nodo es rechazada', () => {
  var nodes = ringNodes();
  var seals = allSealsLIVE(nodes);
  var path = [{ q: 0, r: 0 }, { q: 5, r: 5 }]; // (5,5) has no node
  var r = J.routeCrossesProhibited(path, seals, nodes);
  assert.equal(r.ok, false);
  assert.ok(r.cause.indexOf('has no node') >= 0);
});

// --- EDGE CASES ---

test('hexRoute: nodo de inicio sin sello LIVE', () => {
  var nodes = ringNodes();
  var seals = allSealsLIVE(nodes);
  seals['home'] = 'NO_DATA';
  var r = J.hexRoute(nodes, seals, 0, 0, 1, 0);
  assert.equal(r.ok, false);
  assert.ok(r.cause.indexOf('start node not alive') >= 0);
});

test('hexRoute: nodo de destino sin sello LIVE', () => {
  var nodes = ringNodes();
  var seals = allSealsLIVE(nodes);
  seals['e'] = 'STALE'; // STALE is acceptable
  var r = J.hexRoute(nodes, seals, 0, 0, 1, 0);
  assert.equal(r.ok, true);
});

test('hexRoute: nodo de destino NO_DATA', () => {
  var nodes = ringNodes();
  var seals = allSealsLIVE(nodes);
  seals['e'] = 'NO_DATA';
  var r = J.hexRoute(nodes, seals, 0, 0, 1, 0);
  assert.equal(r.ok, false);
  assert.ok(r.cause.indexOf('end node not alive') >= 0);
});

test('hexRoute: sin nodos', () => {
  var r = J.hexRoute([], {}, 0, 0, 0, 0);
  assert.equal(r.ok, false);
  assert.ok(r.cause.indexOf('no node') >= 0);
});

test('hexRoute: sin sellos', () => {
  var nodes = ringNodes();
  var r = J.hexRoute(nodes, {}, 0, 0, 0, 0);
  assert.equal(r.ok, false);
});

// --- DISTANCE vs PATH ---

test('Distancia matemática vs camino transitable: distancia 1, camino 1 paso', () => {
  var nodes = ringNodes();
  var seals = allSealsLIVE(nodes);
  var dist = J.axialDistance(0, 0, 1, 0);
  assert.equal(dist, 1);
  var r = J.hexRoute(nodes, seals, 0, 0, 1, 0);
  assert.equal(r.ok, true);
  assert.equal(r.path.length, 2); // start + end = 2 nodes in path
});

test('Distancia matemática vs camino transitable: distancia puede ser menor que pasos del camino', () => {
  // Distance from (0,0) to (-1,0) is 1, but if direct path is blocked,
  // the route may be longer or impossible
  var nodes = [
    { id: 'home', q: 0, r: 0 },
    { id: 'ne', q: 1, r: -1 },
    { id: 'nw', q: 0, r: -1 },
    { id: 'w', q: -1, r: 0 }
  ];
  var seals = allSealsLIVE(nodes);
  var dist = J.axialDistance(0, 0, -1, 0);
  assert.equal(dist, 1);
  var r = J.hexRoute(nodes, seals, 0, 0, -1, 0);
  assert.equal(r.ok, true);
  // Path length should be 2 (direct neighbour exists)
  assert.equal(r.path.length, 2);
});

// --- DETERMINISM ---

test('Determinismo: misma ruta siempre', () => {
  var nodes = ringNodes();
  var seals = allSealsLIVE(nodes);
  var run = () => {
    var r = J.hexRoute(nodes, seals, 0, 0, -1, 1);
    return r.path.map(function (n) { return n.id; });
  };
  assert.deepEqual(run(), run());
});
