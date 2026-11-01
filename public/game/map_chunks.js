// P3 · loads the map by neighbourhood (odd/tasks/mapa-25d-aldea.md F3). It asks for /map/carta.json, then ONLY the
// 7 chunks around the area key of a cell (AtlasMapCarta.neighbourhood), never an exact position. Each chunk is checked
// by SHA-256 (the chunk_router.js pattern: chunk_hash_mismatch, cache_chunk_missing) and by its contract; anything
// missing or wrong is NO_DATA with its cause (honest fog). Every request is declared in the result. No server state.
(function (root) {
  'use strict';
  var C = root.AtlasMapCarta || (typeof require === 'function' ? require('./map_carta.js') : null);

  function hexOf(buf) { return Array.prototype.map.call(new Uint8Array(buf), function (b) { return ('0' + b.toString(16)).slice(-2); }).join(''); }
  function sha256(buf) {
    var R = root.AtlasChunkRouter;
    if (R && R.sha256) { return R.sha256(buf); }
    var sub = root.crypto && root.crypto.subtle;
    return sub ? sub.digest('SHA-256', buf).then(hexOf) : Promise.resolve(null);
  }
  function text(buf) { return new root.TextDecoder().decode(buf); }

  // load(cell, { fetch, base }) → { key, chunks: { key: chunk }, missing: [{ key, cause }], requests: [url], say }
  function load(cell, opts) {
    var get = (opts && opts.fetch) || root.fetch.bind(root), base = (opts && opts.base) || '/map/';
    var requests = [], out = { key: null, chunks: {}, missing: [], requests: requests, say: '' };
    function ask(url) { requests.push(url); return get(url).then(function (r) { if (!r.ok) { throw new Error('HTTP ' + r.status); } return r.arrayBuffer(); }); }
    return ask(base + 'carta.json').then(function (buf) {
      var carta = JSON.parse(text(buf)), bad = C.checkCarta(carta);
      if (bad) { throw new Error(bad); }
      var R = carta.radius, here = C.chunkOf(cell[0], cell[1], R), index = {};
      out.key = C.key(here);
      carta.chunks.forEach(function (c) { index[c.id] = c; });
      return Promise.all(C.neighbourhood(here, R).map(function (c) {
        var k = C.key(c), entry = index[k];
        if (!entry) { out.missing.push({ key: k, cause: 'cache_chunk_missing: not baked yet' }); return null; }
        return ask(base + 'chunks/' + k + '.' + entry.sha256.slice(0, 8) + '.json').then(function (b) {
          return sha256(b).then(function (hex) {
            if (hex !== entry.sha256) { out.missing.push({ key: k, cause: 'chunk_hash_mismatch' }); return; }
            var chunk = JSON.parse(text(b)), why = C.checkChunk(chunk, R);
            if (why) { out.missing.push({ key: k, cause: why }); return; }
            out.chunks[k] = chunk;
          });
        }, function (e) { out.missing.push({ key: k, cause: 'cache_chunk_missing: ' + e.message }); });
      }));
    }).then(function () {
      var n = Object.keys(out.chunks).length;
      out.say = 'Map chunks: ' + n + ' of 7 around area ' + out.key + (out.missing.length ? ' · NO_DATA ' + out.missing.map(function (m) { return m.key + ' (' + m.cause + ')'; }).join(', ') : '');
      return out;
    }, function (e) {
      out.say = 'Map chunks: NO_DATA · ' + e.message; return out;
    });
  }

  var api = { load: load };
  root.AtlasMapChunks = api;
  if (typeof module !== 'undefined' && module.exports) { module.exports = api; }
})(typeof globalThis !== 'undefined' ? globalThis : this);
