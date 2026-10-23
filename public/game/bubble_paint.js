(function (root) {
  'use strict';
  var common = typeof module === 'object' && module.exports;
  function editor() { return common ? require('./bubble_editor.js') : root.AtlasBubbleEditor; }
  function copy(points) { return points.map(function (p) { return [p[0], p[1]]; }); }
  function create(options) {
    var E = editor(), o = Object.assign({}, options || {}), points = [], undo = [], redo = [];
    if (!E) throw new Error('Bubble editor unavailable');
    function snapshot() { undo.push(copy(points)); redo.length = 0; }
    function frameFor(ps) { return E.create(Object.assign({}, o, { primitive: 'ribbon', item: {
      o: 'ribbon', f: o.band || 'cyan', s: o.stroke || 'ink', d: 0, lw: 2.5, pts: copy(ps)
    } })); }
    function addPoint(x, y) {
      if (!Number.isFinite(x) || !Number.isFinite(y)) throw new Error('point coordinates must be finite');
      var next = points.concat([[Math.round(x * 100) / 100, Math.round(y * 100) / 100]]);
      try { E.serialize(frameFor(next)); } catch (e) { return { ok: false, cause: e.message }; }
      snapshot(); points = next; return api;
    }
    function undoPoint() { if (!undo.length) return api; redo.push(copy(points)); points = undo.pop(); return api; }
    function redoPoint() { if (!redo.length) return api; undo.push(copy(points)); points = redo.pop(); return api; }
    function tryFrame() {
      try { var frame = frameFor(points); E.compile(frame); return { ok: true, frame: frame, bytes: E.byteLength(E.serialize(frame)) }; }
      catch (e) { return { ok: false, cause: e.message }; }
    }
    function frame() { var result = tryFrame(); if (!result.ok) throw new Error(result.cause); return result.frame; }
    var api = { addPoint: addPoint, undo: undoPoint, redo: redoPoint, frame: frame, tryFrame: tryFrame,
      points: function () { return copy(points); }, describe: function () { return 'ribbon · ' + (o.band || 'cyan') + ' · ' + points.length + ' points'; } };
    return api;
  }
  function mount(target, options) {
    if (!target) throw new Error('Paint target required');
    var paint = create(options), active = false, status;
    target.innerHTML = '<section class="bubble-paint" aria-label="Paint Bubble composition">' +
      '<p>Draw with a pointer or keyboard. The same Bubble frame drives the description and composition.</p>' +
      '<div data-surface="paint" role="application" tabindex="0" aria-label="Paint surface; use arrow keys to add points" style="min-height:180px;touch-action:none;border:1px solid currentColor"></div>' +
      '<button type="button" data-action="undo" style="min-height:44px">Undo</button><button type="button" data-action="redo" style="min-height:44px">Redo</button>' +
      '<output aria-live="polite" data-status></output><pre data-frame></pre></section>';
    var surface = target.querySelector && target.querySelector('[data-surface="paint"]');
    status = target.querySelector && target.querySelector('[data-status]');
    var out = target.querySelector && target.querySelector('[data-frame]');
    function update() {
      var r = paint.tryFrame();
      if (!r.ok) { if (status) status.textContent = 'NO_DATA · ' + r.cause; return r; }
      if (status) status.textContent = paint.describe();
      if (out) out.textContent = JSON.stringify(r.frame);
      if (surface) surface.innerHTML = '<svg viewBox="0 0 412 515" role="img" aria-label="' + paint.describe() + '" style="width:100%;height:180px"><polyline points="' + paint.points().map(function (p) { return p[0] + ',' + p[1]; }).join(' ') + '" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" /></svg>';
      return r;
    }
    function point(e) { var box = surface.getBoundingClientRect(), x = (e.clientX - box.left) * 412 / Math.max(box.width, 1), y = (e.clientY - box.top) * 515 / Math.max(box.height, 1); var r = paint.addPoint(x, y); if (r && r.ok === false) { if (status) status.textContent = 'NO_DATA · ' + r.cause; } else update(); }
    function key(e) { var n = paint.points(), p = n.length ? n[n.length - 1] : [206, 258], d = 4; if (!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)) return; e.preventDefault(); var r = paint.addPoint(Math.max(0, Math.min(412, p[0] + (e.key === 'ArrowRight' ? d : e.key === 'ArrowLeft' ? -d : 0))), Math.max(0, Math.min(515, p[1] + (e.key === 'ArrowDown' ? d : e.key === 'ArrowUp' ? -d : 0)))); if (r && r.ok === false && status) status.textContent = 'NO_DATA · ' + r.cause; update(); }
    function click(e) { var action = e.target && e.target.getAttribute('data-action'); if (action === 'undo') paint.undo(); if (action === 'redo') paint.redo(); update(); }
    if (surface && surface.addEventListener) {
      surface.addEventListener('pointerdown', function (e) { active = true; if (surface.setPointerCapture) surface.setPointerCapture(e.pointerId); point(e); });
      surface.addEventListener('pointermove', function (e) { if (active && (e.buttons || e.pointerType === 'touch')) point(e); });
      surface.addEventListener('pointerup', function () { active = false; }); surface.addEventListener('keydown', key);
    }
    if (target.addEventListener) target.addEventListener('click', click);
    update();
    return Object.freeze({ frame: paint.frame, paint: paint, refresh: update });
  }
  var API = Object.freeze({ LIMIT: 1024, create: create, mount: mount });
  if (common) module.exports = API; else root.AtlasBubblePaint = API;
})(typeof module === 'object' && module.exports ? this : (this || window));
