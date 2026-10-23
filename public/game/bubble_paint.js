(function (root) {
  'use strict';
  var common = typeof module === 'object' && module.exports;
  var SVG_NS = 'http:' + '//' + 'www.w3.org/2000/svg';
  function feedback() { return common ? require('./creation_feedback.js') : root.CreationFeedback; }
  function editor() { return common ? require('./bubble_editor.js') : root.AtlasBubbleEditor; }
  function make(doc, tag, text) {
    var n = doc.createElement(tag);
    if (text != null) n.textContent = text;
    return n;
  }
  function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }
  function copy(points) { return points.map(function (p) { return [p[0], p[1]]; }); }
  function create(options) {
    var E = editor(), o = Object.assign({}, options || {}), points = [], undo = [], redo = [];
    var state = { action: 'ready', x: 206, y: 258, count: 0, color: o.band || 'cyan', cause: '' };
    function announce(action, cause) {
      var last = points.length ? points[points.length - 1] : [206, 258];
      state = { action: action, x: last[0], y: last[1], count: points.length, color: o.band || 'cyan', cause: cause || '' };
      return api;
    }
    if (!E) throw new Error('Bubble editor unavailable');
    function snapshot() { undo.push(copy(points)); redo.length = 0; }
    function frameFor(ps) { return E.create(Object.assign({}, o, { primitive: 'ribbon', item: {
      o: 'ribbon', f: o.band || 'cyan', s: o.stroke || 'ink', d: 0, lw: 2.5, pts: copy(ps)
    } })); }
    function addPoint(x, y) {
      if (!Number.isFinite(x) || !Number.isFinite(y)) throw new Error('point coordinates must be finite');
      var px = Math.max(0, Math.min(412, Math.round(x))), py = Math.max(0, Math.min(515, Math.round(y)));
      var next = points.concat([[px, py]]);
      try { E.serialize(frameFor(next)); } catch (e) { announce('reject', 'limit'); return { ok: false, cause: e.message }; }
      snapshot(); points = next; return announce(px === 0 || px === 412 || py === 0 || py === 515 ? 'border' : 'add');
    }
    function undoPoint() { if (!undo.length) return announce('undo', 'empty'); redo.push(copy(points)); points = undo.pop(); return announce('undo'); }
    function redoPoint() { if (!redo.length) return announce('redo', 'empty'); undo.push(copy(points)); points = redo.pop(); return announce('redo'); }
    function tryFrame() {
      try { var frame = frameFor(points); E.compile(frame); return { ok: true, frame: frame, bytes: E.byteLength(E.serialize(frame)) }; }
      catch (e) { return { ok: false, cause: e.message }; }
    }
    function frame() { var result = tryFrame(); if (!result.ok) throw new Error(result.cause); return result.frame; }
    var api = { state: function () { return Object.assign({}, state); }, repeat: function () { return announce('repeat', state.cause); }, addPoint: addPoint, undo: undoPoint, redo: redoPoint, frame: frame, tryFrame: tryFrame,
      points: function () { return copy(points); }, describe: function () { return 'ribbon · ' + (o.band || 'cyan') + ' · ' + points.length + ' points'; } };
    return api;
  }
  function mount(target, options) {
    if (!target) throw new Error('Paint target required');
    var o = options || {}, doc = target.ownerDocument, paint = create(o), active = false, status, revision = 0, F = feedback();
    if (!doc || typeof doc.createElement !== 'function') throw new Error('Paint document unavailable');
    var section = make(doc, 'section'); section.className = 'bubble-paint';
    section.setAttribute('aria-label', 'Paint Bubble composition');
    section.appendChild(make(doc, 'p', 'Draw with a pointer or keyboard. The same Bubble frame drives the description and composition.'));
    var surface = make(doc, 'div'); surface.setAttribute('data-surface', 'paint');
    surface.setAttribute('role', 'application'); surface.setAttribute('tabindex', '0');
    surface.setAttribute('aria-label', 'Paint surface; use arrow keys to add points');
    surface.style.minHeight = '180px'; surface.style.touchAction = 'none'; surface.style.border = '1px solid currentColor';
    section.appendChild(surface);
    ['undo', 'redo', 'repeat'].forEach(function (action) {
      var button = make(doc, 'button', action === 'undo' ? 'Undo' : action === 'redo' ? 'Redo' : 'Repeat state');
      button.type = 'button'; button.style.minHeight = '44px'; button.style.minWidth = '44px'; button.setAttribute(action === 'repeat' ? 'data-feedback' : 'data-action', action);
      section.appendChild(button);
    });
    var statusNode = make(doc, 'output'); statusNode.setAttribute('aria-live', 'polite'); statusNode.setAttribute('data-status', ''); section.appendChild(statusNode);
    var detail = make(doc, 'details'); detail.appendChild(make(doc, 'summary', 'Technical details'));
    var frameNode = make(doc, 'pre'); frameNode.setAttribute('data-frame', ''); detail.appendChild(frameNode); section.appendChild(detail);
    clear(target); target.appendChild(section);
    status = target.querySelector && target.querySelector('[data-status]');
    var out = target.querySelector && target.querySelector('[data-frame]');
    function update(speak) {
      var r = paint.tryFrame(), state = paint.state(), turn = ++revision;
      var message = F ? F.describe(state).text : state.action + ' · x ' + state.x + ' · y ' + state.y + ' · ' + state.count + ' points' + (state.cause ? ' · ' + state.cause : '');
      if (status) status.textContent = message;
      if (out && r.ok) out.textContent = JSON.stringify(r.frame);
      if (speak) {
        if (o.onChange) o.onChange(r.ok ? r.frame : null, state);
        if (o.feedback) o.feedback.announce(state).catch(function (e) { if (status && turn === revision) status.textContent = message + ' · ' + (e.message || String(e)); });
        else if (status) status.textContent = message + ' · NO_DATA · voice catalog unavailable';
      }
      if (surface && doc.createElementNS) {
        clear(surface);
        var svg = doc.createElementNS(SVG_NS, 'svg');
        svg.setAttribute('viewBox', '0 0 412 515'); svg.setAttribute('role', 'img');
        svg.setAttribute('aria-label', message); svg.style.width = '100%'; svg.style.height = '180px';
        var line = doc.createElementNS(SVG_NS, 'polyline');
        line.setAttribute('points', paint.points().map(function (p) { return p[0] + ',' + p[1]; }).join(' '));
        line.setAttribute('fill', 'none'); line.setAttribute('stroke', 'currentColor'); line.setAttribute('stroke-width', '5');
        line.setAttribute('stroke-linecap', 'round'); line.setAttribute('stroke-linejoin', 'round');
        svg.appendChild(line); surface.appendChild(svg);
      }
      return r;
    }
    function point(e) {
      var box = surface.getBoundingClientRect();
      paint.addPoint((e.clientX - box.left) * 412 / Math.max(box.width, 1), (e.clientY - box.top) * 515 / Math.max(box.height, 1));
      update(true);
    }
    function key(e) {
      if (!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)) return;
      e.preventDefault(); var s = paint.state(), d = 4;
      paint.addPoint(s.x + (e.key === 'ArrowRight' ? d : e.key === 'ArrowLeft' ? -d : 0), s.y + (e.key === 'ArrowDown' ? d : e.key === 'ArrowUp' ? -d : 0));
      update(true);
    }
    function click(e) {
      var action = e.target && (e.target.getAttribute('data-action') || e.target.getAttribute('data-feedback'));
      if (['undo','redo','repeat'].indexOf(action) < 0) return;
      paint[action](); update(true);
    }
    if (surface && surface.addEventListener) {
      surface.addEventListener('pointerdown', function (e) { active = true; if (surface.setPointerCapture) surface.setPointerCapture(e.pointerId); point(e); });
      surface.addEventListener('pointermove', function (e) { if (active && (e.buttons || e.pointerType === 'touch')) point(e); });
      surface.addEventListener('pointerup', function () { active = false; });
      surface.addEventListener('pointercancel', function () { active = false; }); surface.addEventListener('keydown', key);
    }
    if (target.addEventListener) target.addEventListener('click', click);
    update();
    return Object.freeze({ frame: paint.frame, paint: paint, refresh: update });
  }
  var API = Object.freeze({ LIMIT: 1024, create: create, mount: mount });
  if (common) module.exports = API; else root.AtlasBubblePaint = API;
})(typeof module === 'object' && module.exports ? this : (this || window));
