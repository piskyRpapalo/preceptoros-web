// BM-1 · the seeded mover of the benchmarks (odd/tasks/benchmarks-on-map.md). Pure: integer arithmetic only, no
// random numbers, no clock reads, no network. The same seed gives the same path. It only enters a colony node whose seal
// is LIVE or STALE (D7): a node without a live seal is never entered, and a walk with no seed is refused.
(function (root) {
  'use strict';
  var common = typeof module === 'object' && module.exports;
  var DIRS = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];

  function fail(causa) { throw new Error('bench_mover: ' + causa); }

  // FNV-1a over the seed text: the same seed gives the same 32-bit number everywhere.
  function fnv(texto) {
    var h = 0x811c9dc5;
    for (var i = 0; i < texto.length; i++) { h ^= texto.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
    return h >>> 0;
  }

  // mulberry32: a tiny integer generator, seeded by the FNV number. Pure integers, the same sequence every run.
  function generador(semilla) {
    var a = semilla >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function alive(seal) { return seal === 'LIVE' || seal === 'STALE'; }

  // walk(seed, start, nodes, seals, steps) → { path, stopped }. path lists the node ids entered, in order.
  // nodes: [{ id, q, r }] (colony nodes); seals: { id: seal }. A walk stops early when no neighbour is alive.
  function walk(seed, start, nodes, seals, steps) {
    if (typeof seed !== 'string' || seed === '') { fail('a walk needs a seed'); }
    if (!Number.isInteger(steps) || steps < 0) { fail('steps must be a whole number'); }
    var sig = generador(fnv(seed));
    var por = {};
    nodes.forEach(function (n) { por[n.q + ',' + n.r] = n; });
    var cur = { id: start.id, q: start.q, r: start.r };
    var path = [], stopped = '';
    for (var i = 0; i < steps; i++) {
      var opciones = DIRS.map(function (d) { return por[(cur.q + d[0]) + ',' + (cur.r + d[1])]; })
        .filter(function (n) { return n && alive((seals || {})[n.id]); });
      if (opciones.length === 0) { stopped = 'no live neighbour'; break; }
      var elegido = opciones[Math.floor(sig() * opciones.length)];
      if (!alive((seals || {})[elegido.id])) { fail('chose a node that is not alive: ' + elegido.id); }
      cur = { id: elegido.id, q: elegido.q, r: elegido.r };
      path.push(elegido.id);
    }
    return { path: path, stopped: stopped };
  }

  var AtlasBenchMover = { walk: walk, fnv: fnv, generador: generador };
  if (common) { module.exports = AtlasBenchMover; }
  else { root.AtlasBenchMover = AtlasBenchMover; }
})(typeof globalThis === 'object' ? globalThis : this);
