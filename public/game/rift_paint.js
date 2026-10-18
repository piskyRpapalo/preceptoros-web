(function (root) {
  'use strict';
  var V = 'preceptoros.bubble/1', TOPE = 192, cache = Object.create(null), orden = [];

  function sprite(item, box, scale) {
    var A = root.AtlasBubble, P = root.AtlasComicAtoms, doc = root.document;
    if (!A || !P || !doc || !item || typeof item.o !== 'string') { return null; }
    var key = JSON.stringify(item) + '|' + box + '|' + scale;
    if (cache[key] !== undefined) { return cache[key]; }
    var it = {}, k;
    for (k in item) { if (Object.prototype.hasOwnProperty.call(item, k)) { it[k] = item[k]; } }
    it.x = box / 2; it.y = box / 2;
    var out = null;
    try {
      var items = A.compile({ v: V, id: 'RIFT', t: 0, cv: [box, box], bands: ['cyan', 'ink', 'ocean', 'paper'], change: ['sprite'],
        sound: 'NO_DATA', soundCause: 'sprite', motion: 'NO_DATA', atoms: [{ k: it.o, r: it.o, i: [it] }] });
      if (!(A.compile.notes && A.compile.notes.length)) {
        out = doc.createElement('canvas');
        out.width = out.height = Math.ceil(box * scale);
        var g = out.getContext('2d');
        g.setTransform(scale, 0, 0, scale, 0, 0);
        P.paint(g, items);
      }
    } catch (e) { out = null; }
    cache[key] = out;
    orden.push(key);
    if (orden.length > TOPE) { delete cache[orden.shift()]; }
    return out;
  }

  function word(g, item, x, y, size, opts) {
    var box = (opts && opts.box) || 128, scale = Math.max(1, Math.min(3, (opts && opts.scale) || 2));
    var c = sprite(item, box, scale);
    if (!c || !g || typeof g.drawImage !== 'function') { return false; }
    var w = size * box;
    g.drawImage(c, x - w / 2, y - w / 2, w, w);
    return true;
  }

  function clear() { cache = Object.create(null); orden = []; }

  var AtlasRiftPaint = { word: word, sprite: sprite, clear: clear, TOPE: TOPE };
  if (typeof module === 'object' && module.exports) { module.exports = AtlasRiftPaint; } else { root.AtlasRiftPaint = AtlasRiftPaint; }
})(typeof module === 'object' && module.exports ? this : (this || window));
