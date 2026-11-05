(function (root) {
  'use strict';
  var node = typeof module === 'object' && module.exports;
  function lib(name, path) {
    if (root[name]) { return root[name]; }
    if (node) { try { return require(path); } catch (e) { return null; } }
    return null;
  }
  function frame(word, x, y, r, eye) {
    if (['star', 'octo'].indexOf(word) < 0 || ![x, y, r].every(function (v) { return typeof v === 'number' && isFinite(v); }) || r <= 0) { return null; }
    var item = { o: word, x: x, y: y, r: r, eye: eye === 'shut' ? 'shut' : 'open' };
    return { v: 'preceptoros.bubble/1', id: 'MAP-' + word, t: 0, cv: [412, 515], bands: ['cyan', 'ink', 'paper'], change: ['map'], sound: 'NO_DATA', soundCause: 'map illustration', motion: 'NO_DATA', atoms: [{ k: word, r: word, i: [item] }] };
  }
  function draw(ctx, word, x, y, r, eye, deps) {
    var f = frame(word, x, y, r, eye), b = deps && deps.bubble || lib('AtlasBubble', './bubble_language.js');
    var p = deps && deps.painter || lib('AtlasComicAtoms', './comic_atoms.js');
    if (!f || !b || !p || typeof b.compile !== 'function' || typeof p.paint !== 'function') { return false; }
    try { p.paint(ctx, b.compile(f)); return true; } catch (e) { return false; }
  }
  var api = Object.freeze({ frame: frame, draw: draw });
  if (node) { module.exports = api; } else { root.AtlasMapBubbleFigures = api; }
})(typeof module === 'object' && module.exports ? this : this);
