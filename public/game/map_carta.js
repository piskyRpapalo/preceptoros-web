// atlas.carta/1 · the map cut into hex chunks (odd/tasks/mapa-25d-aldea.md, F3/P1). PURE: no DOM, no network, no clock,
// no randomness. A chunk is a hexagon of radius R in axial (q, r); chunks tile the plane exactly (3R²+3R+1 cells each)
// on the lattice a = (2R+1, -R), b = (R, R+1). A position is asked for only as its chunk key (quantized area), never as
// exact coordinates, and the neighbourhood is always the same 7 keys. Validation keeps every graphic inside its
// bubble-language frame (< 1,024 UTF-8 bytes, a name and a text description).
(function (root) {
  'use strict';
  var V = { carta: 'atlas.carta/1', chunk: 'atlas.chunk/1', asset: 'atlas.asset/1' };
  var FRAME_MAX = 1024, KINDS = ['water', 'floor', 'keepout'], ASSET_KINDS = ['wave', 'palette', 'texture', 'sound'];

  function dist(q, r) { return (Math.abs(q) + Math.abs(r) + Math.abs(q + r)) / 2; }
  function center(i, j, R) { return [i * (2 * R + 1) + j * R, -i * R + j * (R + 1)]; }
  function key(c) { return c[0] + '_' + c[1]; }

  // chunkOf(q, r, R) → the centre [cq, cr] of the one chunk holding cell (q, r).
  function chunkOf(q, r, R) {
    var n = 3 * R * R + 3 * R + 1;                       // lattice determinant
    var fi = (q * (R + 1) - r * R) / n, fj = (q * R + r * (2 * R + 1)) / n;
    var i0 = Math.floor(fi), j0 = Math.floor(fj);
    for (var di = -1; di <= 2; di++) for (var dj = -1; dj <= 2; dj++) {
      var c = center(i0 + di, j0 + dj, R);
      if (dist(q - c[0], r - c[1]) <= R) { return c; }
    }
    return null;                                         // unreachable for integer cells (exact tiling)
  }
  // neighbourhood(c, R) → the 7 chunk centres around c (c first), the only chunks a page asks for.
  function neighbourhood(c, R) {
    var a = [2 * R + 1, -R], b = [R, R + 1], steps = [[0, 0], a, b, [b[0] - a[0], b[1] - a[1]], [-a[0], -a[1]], [-b[0], -b[1]], [a[0] - b[0], a[1] - b[1]]];
    return steps.map(function (s) { return [c[0] + s[0], c[1] + s[1]]; });
  }

  function bytes(o) { var s = JSON.stringify(o); return root.TextEncoder ? new root.TextEncoder().encode(s).length : unescape(encodeURIComponent(s)).length; }
  function frameCause(f) {
    if (!f || typeof f.t !== 'string' || !f.t || typeof f.d !== 'string' || !f.d) { return 'frame without a name and a text description'; }
    return bytes(f) < FRAME_MAX ? null : 'frame of ' + bytes(f) + ' bytes (limit ' + FRAME_MAX + ')';
  }
  function isInt(x) { return typeof x === 'number' && x === Math.floor(x) && isFinite(x); }
  function isC(c) { return Array.isArray(c) && c.length === 2 && isInt(c[0]) && isInt(c[1]); }

  // check*(o) → null when the object keeps the contract, else the cause (shown to the person, never a guess).
  function checkCarta(o) {
    if (!o || o.v !== V.carta) { return 'not ' + V.carta; }
    if (!isInt(o.radius) || o.radius < 1) { return 'radius must be a positive integer'; }
    var f = frameCause(o.frame); if (f) { return 'carta ' + f; }
    if (!Array.isArray(o.chunks) || !o.chunks.length) { return 'carta without chunks'; }
    var b = o.budget, seen = {};                        // budget amendment (2026-11-01): bytes per chunk and per visible area
    if (!b || !isInt(b.chunk_bytes_max) || !isInt(b.visible_bytes_max) || b.chunk_bytes_max < 1 || b.visible_bytes_max < b.chunk_bytes_max || b.chunk_bytes_max > 25 * 1024 * 1024) { return 'carta without a valid budget'; }
    for (var i = 0; i < o.chunks.length; i++) {
      var c = o.chunks[i];
      if (!isC(c.c) || c.id !== key(c.c)) { return 'chunk ' + i + ': id is not its quantized key'; }
      var k = chunkOf(c.c[0], c.c[1], o.radius); if (!k || key(k) !== c.id) { return 'chunk ' + c.id + ' is not a lattice centre'; }
      if (!/^[0-9a-f]{64}$/.test(c.sha256 || '')) { return 'chunk ' + c.id + ': sha256 missing'; }
      if (!isInt(c.bytes) || c.bytes < 1 || c.bytes > 25 * 1024 * 1024) { return 'chunk ' + c.id + ': bytes outside 1..25 MiB'; }
      f = frameCause(c.frame); if (f) { return 'chunk ' + c.id + ' ' + f; }
      if (c.bytes > b.chunk_bytes_max) { return 'chunk ' + c.id + ' over budget: ' + c.bytes + ' bytes (limit ' + b.chunk_bytes_max + ')'; }
      seen[c.id] = c.bytes;
    }
    for (i = 0; i < o.chunks.length; i++) {           // what one visit sees: the 7 around any baked chunk
      var sum = 0; neighbourhood(o.chunks[i].c, o.radius).forEach(function (n) { sum += seen[key(n)] || 0; });
      if (sum > b.visible_bytes_max) { return 'area ' + o.chunks[i].id + ' over visible budget: ' + sum + ' bytes (limit ' + b.visible_bytes_max + ')'; }
    }
    return null;
  }
  function checkChunk(o, R) {
    if (!o || o.v !== V.chunk || !isC(o.c)) { return 'not ' + V.chunk; }
    var f = frameCause(o.frame); if (f) { return 'chunk ' + f; }
    if (!Array.isArray(o.cells)) { return 'chunk without cells'; }
    for (var i = 0; i < o.cells.length; i++) {
      var x = o.cells[i];
      if (!Array.isArray(x) || x.length !== 4 || !isInt(x[0]) || !isInt(x[1]) || !isInt(x[2])) { return 'cell ' + i + ' malformed'; }
      if (KINDS.indexOf(x[3]) < 0) { return 'cell ' + i + ': unknown kind ' + x[3]; }
      if (dist(x[0] - o.c[0], x[1] - o.c[1]) > R) { return 'cell ' + i + ' outside its chunk'; }
    }
    if (!Array.isArray(o.assets) || o.assets.some(function (a) { return typeof a !== 'string' || !a; })) { return 'assets must be ids'; }
    return null;
  }
  function checkAsset(o) {
    if (!o || o.v !== V.asset || typeof o.id !== 'string' || !/^[a-z0-9-]+$/.test(o.id)) { return 'not ' + V.asset; }
    if (ASSET_KINDS.indexOf(o.kind) < 0) { return 'unknown asset kind'; }
    return frameCause(o.frame) ? 'asset ' + frameCause(o.frame) : null;
  }

  var api = { V: V, FRAME_MAX: FRAME_MAX, chunkOf: chunkOf, neighbourhood: neighbourhood, key: key, dist: dist,
    checkCarta: checkCarta, checkChunk: checkChunk, checkAsset: checkAsset, frameCause: frameCause };
  root.AtlasMapCarta = api;
  if (typeof module !== 'undefined' && module.exports) { module.exports = api; }
})(typeof self !== 'undefined' ? self : this);
