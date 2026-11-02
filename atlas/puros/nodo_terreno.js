// NO-1 · a node draws its own terrain from its heartbeat (odd/tasks/nodo-online-harness.md). Level: CUADRO.
// Seven hex tiles (the node's cell and its six neighbours). Each tile's kind comes from the house hash (FNV-1a 32,
// docs/acho-language.md §5) over the node's id, the day it was born (`since`) and the tile's offset: the same
// heartbeat gives the same tiles, everywhere. Water tiles carry a wave, so they sound; the rest say why they are silent.
// Every tile is an Acho frame under 1,024 B. Not served yet. Pure: no DOM, no network, no clock, no Math.random.
(function (raiz) {
  'use strict';

  var V = 'preceptoros.acho/1';
  var VECINOS = [[0, 0], [1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];
  var TIPOS = ['water', 'mountain', 'plain'];
  var BANDA = { water: 'cyan', mountain: 'ink', plain: 'paper' };
  var TRAZO = { water: 'ink', mountain: 'paper', plain: 'ink' };
  var SELLOS = ['LIVE', 'STALE', 'STATIC', 'SIMULATED', 'NO_DATA', 'ERROR'];
  var DIAMANTE = [[160, 24], [208, 48], [160, 72], [112, 48]];

  function hash32(s) {
    var h = 0x811c9dc5;
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
    return h;
  }

  // latido → { id, q, r, seal, since } only when it can be read; otherwise null (never a guessed node).
  function lee(n) {
    if (!n || typeof n.id !== 'string' || !/^[a-z0-9-]{1,40}$/.test(n.id)) { return null; }
    if (!Number.isInteger(n.q) || !Number.isInteger(n.r)) { return null; }
    if (typeof n.since !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(n.since)) { return null; }
    return { id: n.id, q: n.q, r: n.r, since: n.since, seal: SELLOS.indexOf(n.seal) >= 0 ? n.seal : 'NO_DATA' };
  }

  // tesela(n, k) → the frame of tile k (0 = the node's own cell). The kind ignores the seal: a STALE node keeps its land.
  function tesela(n, k) {
    var d = VECINOS[k], q = n.q + d[0], r = n.r + d[1];
    var h = hash32(n.id + '|' + n.since + '|' + d[0] + ',' + d[1]);
    var tipo = TIPOS[h % 3];
    var frase = (k === 0 ? 'the home tile' : 'tile ' + k) + ' of ' + n.id + ' at (' + q + ',' + r + '): ' + tipo +
      ' · seal ' + n.seal + ' since ' + n.since;
    var items = [{ o: 'ribbon', pts: DIAMANTE, closed: true, f: BANDA[tipo], s: TRAZO[tipo], lw: 2 }];
    var f = {
      v: V, id: 'terreno-' + n.id + '-' + k, t: 0, cv: [320, 96], seal: n.seal,
      atoms: [{ k: 'terrain.' + tipo, r: frase, i: items }],
      bands: ['paper', 'ink', 'cyan'], change: [frase]
    };
    if (tipo === 'water') {
      // The sea's voice: a low ring and one harmonic from the same hash (integers, as the troops' spectra).
      var k2 = 3 + ((h >>> 4) % 5), a = 2 + ((h >>> 8) % 4);
      items.push({ o: 'wave', x: 160, y: 48, sc: 1, h: [[1, 14, 10, 0], [k2, a, a, (h >>> 12) % 7]], s: 'ink', lw: 1 });
      f.sound = 'ok';
    } else {
      f.sound = 'NO_DATA: ' + tipo + ' declares no waves; only water sounds';
    }
    return f;
  }

  // terreno(latido) → { ok, frames } or { ok: false, causa }.
  function terreno(latido) {
    var n = lee(latido);
    if (!n) { return { ok: false, causa: 'heartbeat unreadable: id, q, r and since are required' }; }
    var frames = [];
    for (var k = 0; k < VECINOS.length; k++) { frames.push(tesela(n, k)); }
    return { ok: true, frames: frames };
  }

  var AtlasNodoTerreno = Object.freeze({ VECINOS: VECINOS, TIPOS: TIPOS, hash32: hash32, lee: lee, terreno: terreno });
  if (typeof module === 'object' && module.exports) { module.exports = AtlasNodoTerreno; } else { raiz.AtlasNodoTerreno = AtlasNodoTerreno; }
})(typeof module === 'object' && module.exports ? this : (this || window));
