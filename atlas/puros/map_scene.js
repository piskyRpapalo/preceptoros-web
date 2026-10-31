// M1-1 · the one isometric map: scene composition (odd/tasks/single-map-isometric-3d.md). Pure: no random numbers,
// no clock reads, no network. The elements are drawn by depth: the one behind is drawn first. Ties are broken by x,
// then by id, so the order is the same in every run. Each element is a bubble frame under 1,024 bytes (frame law).
(function (root) {
  'use strict';
  var common = typeof module === 'object' && module.exports;
  var LIMITE = 1024;

  function fail(causa) { throw new Error('map_scene: ' + causa); }

  // compose(items) → the same elements, sorted back to front. Each item: { id, x, y, frame }.
  // An item with no id, no finite x and y, or a frame over 1,024 UTF-8 bytes is refused.
  function compose(items) {
    if (!Array.isArray(items)) { fail('items must be a list'); }
    var vistos = {};
    var ok = items.map(function (it) {
      if (!it || typeof it.id !== 'string' || it.id === '') { fail('an element has no id'); }
      if (vistos[it.id]) { fail('repeated id ' + it.id); }
      vistos[it.id] = true;
      if (!Number.isFinite(it.x) || !Number.isFinite(it.y)) { fail(it.id + ' has no finite position'); }
      var bytes = new TextEncoder().encode(JSON.stringify(it.frame)).length;
      if (bytes >= LIMITE) { fail(it.id + ' frame is ' + bytes + ' bytes, limit 1024'); }
      return { id: it.id, x: it.x, y: it.y, frame: it.frame };
    });
    ok.sort(function (a, b) {
      if (a.y !== b.y) { return a.y - b.y; }
      if (a.x !== b.x) { return a.x - b.x; }
      return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
    });
    return Object.freeze(ok.map(Object.freeze));
  }

  // inOrder(scene) → true when the scene is already back to front (the check the gate runs on the output).
  function inOrder(scene) {
    for (var i = 1; i < scene.length; i++) {
      var a = scene[i - 1], b = scene[i];
      if (a.y > b.y || (a.y === b.y && a.x > b.x)) { return false; }
    }
    return true;
  }

  var AtlasMapScene = { LIMITE: LIMITE, compose: compose, inOrder: inOrder };
  if (common) { module.exports = AtlasMapScene; }
  else { root.AtlasMapScene = AtlasMapScene; }
})(typeof globalThis === 'object' ? globalThis : this);
