(function (root) {
  'use strict';
  var VERSION = 'preceptoros.bubble/1', LIMIT = 1024;
  var PRIMITIVES = Object.freeze(['wave', 'blob', 'ribbon', 'arcs', 'field', 'wall', 'text', 'keep', 'neck']);
  var STYLES = Object.freeze(['volume', 'etch', 'clear']);
  var NEUTRALS = Object.freeze(['ink', 'paper', 'ocean', 'cyan']);
  var common = typeof module === 'object' && module.exports;
  function bubble() { return common ? require('./bubble_language.js') : root.AtlasBubble; }
  function fail(reason) { var e = new Error(reason); e.name = 'BubbleEditorError'; throw e; }
  function object(v) { return !!v && typeof v === 'object' && !Array.isArray(v); }
  function jsonBytes(v) {
    var s;
    try { s = JSON.stringify(v); } catch (e) { fail('frame cannot be serialized'); }
    if (typeof s !== 'string' || BufferBytes(s) >= LIMIT) fail('frame is 1024 bytes or larger');
    return s;
  }
  function BufferBytes(s) { return typeof Buffer !== 'undefined' ? Buffer.byteLength(s, 'utf8') : new TextEncoder().encode(s).length; }
  function bandName(name) {
    if (NEUTRALS.indexOf(name) >= 0) return name;
    if (typeof name !== 'string') fail('unknown semantic band');
    var comicTokenTable = common ? require('./comic_tokens.js') : root.AtlasComicTokens;
    var accents = common ? require('./comic_accents.js').ACCENTS : root.AtlasComicAccents.ACCENTS;
    var semantics = common ? require('./tabla_semantica.js') : root.AtlasSemantica;
    var cut = name.lastIndexOf('.'), head = name.slice(0, cut), sub = name.slice(cut + 1), bands;
    if (cut < 1 || ['brillo', 'base', 'sombra', 'contorno'].indexOf(sub) < 0) fail('unknown semantic band');
    if (Object.prototype.hasOwnProperty.call(accents, head)) bands = accents[head].bands;
    else if (Object.prototype.hasOwnProperty.call(semantics.TABLA, head)) bands = semantics.bandas(semantics.TABLA[head], semantics.SAT, semantics.LUZ);
    if (!bands || typeof bands[sub] !== 'string') fail('unknown semantic band');
    return name;
  }
  function bands() {
    var comicTokenTable = common ? require('./comic_tokens.js') : root.AtlasComicTokens;
    var accents = common ? require('./comic_accents.js').ACCENTS : root.AtlasComicAccents.ACCENTS;
    var semantics = common ? require('./tabla_semantica.js') : root.AtlasSemantica;
    var out = NEUTRALS.slice(), subs = ['brillo', 'base', 'sombra', 'contorno'];
    comicTokenTable.SEALS.forEach(function (name) { subs.forEach(function (sub) { out.push(name + '.' + sub); }); });
    Object.keys(accents).forEach(function (name) { subs.forEach(function (sub) { out.push(name + '.' + sub); }); });
    Object.keys(semantics.TABLA).forEach(function (name) { subs.forEach(function (sub) { out.push(name + '.' + sub); }); });
    return Array.from(new Set(out));
  }
  function template(o) {
    var x = o.x, y = o.y, f = o.band, s = o.stroke || 'ink', p = o.primitive;
    if (object(o.item)) return Object.assign({}, o.item, { o: p, f: f, s: s });
    var base = { o: p, f: f, s: s, d: 0, lw: 2.5 };
    if (p === 'wave') return Object.assign(base, { x: x, y: y, h: [[1, 20, 16, 0]] });
    if (p === 'blob') return Object.assign(base, { x: x, y: y, rx: 22, ry: 18 });
    if (p === 'ribbon') return Object.assign(base, { pts: [[x - 18, y], [x, y - 14], [x + 18, y]] });
    if (p === 'arcs') return Object.assign(base, { x: x, y: y, n: 2, arc: 240, ph: 0, r: [12, 22] });
    if (p === 'field') return Object.assign(base, { kind: 'bubbles', x: x, y: y, n: 3, h: 38, r: [3, 6] });
    if (p === 'wall') return Object.assign(base, { x: [x - 18, x + 18], y: [y - 18, y + 18], side: 'right' });
    if (p === 'text') return Object.assign(base, { x: x, y: y, tx: 'Bubble', sz: 16 });
    if (p === 'keep') return Object.assign(base, { k: 'source' });
    if (p === 'neck') return Object.assign(base, { a: [x - 18, y], b: [x + 18, y], k: 8, p: 0.5 });
    fail('unknown primitive');
  }
  function create(options) {
    var o = options || {}, p = o.primitive || 'blob', style = o.style || 'volume';
    if (PRIMITIVES.indexOf(p) < 0) fail('unknown primitive');
    if (STYLES.indexOf(style) < 0) fail('unknown style');
    var x = Number(o.x === undefined ? 206 : o.x), y = Number(o.y === undefined ? 258 : o.y);
    if (!Number.isFinite(x) || !Number.isFinite(y)) fail('position must be finite');
    var item = template({ primitive: p, band: bandName(o.band || 'cyan'), stroke: bandName(o.stroke || 'ink'), x: x, y: y, item: o.item });
    var frame = { v: VERSION, id: String(o.id || 'KEEPSAKE').slice(0, 32), cv: [412, 515], style: style,
      atoms: [{ k: 'keepsake', i: [item] }] };
    if (object(o.prev)) frame.prev = o.prev;
    else if (p === 'keep') frame.prev = { source: { v: VERSION, id: 'SOURCE', cv: [412, 515], style: style,
      atoms: [{ k: 'source', i: [{ o: 'blob', x: x, y: y, rx: 18, ry: 14, f: item.f, s: item.s, d: 0 }] }] } };
    if (o.sound) frame.sound = o.sound;
    jsonBytes(frame);
    return frame;
  }
  function serialize(frame) {
    if (!object(frame) || frame.v !== VERSION || !Array.isArray(frame.atoms)) fail('invalid Bubble frame');
    var encoded = jsonBytes(frame);
    return encoded;
  }
  function compile(frame) {
    var B = bubble();
    if (!B || typeof B.compile !== 'function') fail('Bubble compiler unavailable');
    var copy = JSON.parse(serialize(frame)), result = B.compile(copy);
    if (B.compile.notes && B.compile.notes.length) fail(B.compile.notes[0].cause || 'Bubble compilation failed');
    return result;
  }
  function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }
  function make(doc, tag, text) {
    var n = doc.createElement(tag);
    if (text != null) n.textContent = text;
    return n;
  }
  function field(doc, labelText, key, type, value) {
    var label = make(doc, 'label', labelText + ' '), input = make(doc, type === 'select' ? 'select' : 'input');
    input.setAttribute('data-field', key);
    input.setAttribute('aria-label', labelText);
    if (type === 'select') {
      input.value = value;
    } else {
      input.type = 'number'; input.min = '0'; input.max = key === 'x' ? '412' : '515'; input.value = value;
    }
    label.appendChild(input);
    return { label: label, input: input };
  }
  function selectField(doc, labelText, key, values, selected) {
    var made = field(doc, labelText, key, 'select', selected), select = made.input;
    values.forEach(function (value) {
      var option = make(doc, 'option', value);
      option.value = value; option.setAttribute('value', value);
      select.appendChild(option);
    });
    select.value = selected;
    return made.label;
  }
  function mount(target, initial) {
    if (!target) fail('editor target required');
    var doc = target.ownerDocument, opts = Object.assign({}, initial || {}), current = create(opts);
    if (!doc || typeof doc.createElement !== 'function') fail('editor document unavailable');
    var section = make(doc, 'section'); section.className = 'bubble-editor';
    section.setAttribute('aria-label', 'Bubble object editor');
    var controls = [
      selectField(doc, 'Primitive', 'primitive', PRIMITIVES, opts.primitive || 'blob'),
      selectField(doc, 'Style', 'style', STYLES, opts.style || 'volume'),
      selectField(doc, 'Band', 'band', bands(), opts.band || 'cyan'),
      field(doc, 'X position', 'x', 'number', current.atoms[0].i[0].x || 206).label,
      field(doc, 'Y position', 'y', 'number', current.atoms[0].i[0].y || 258).label
    ];
    controls.forEach(function (control) { section.appendChild(control); });
    var refreshButton = make(doc, 'button', 'Update object');
    refreshButton.type = 'button'; refreshButton.style.minHeight = '44px';
    refreshButton.setAttribute('data-action', 'refresh'); section.appendChild(refreshButton);
    var statusNode = make(doc, 'output', VERSION); statusNode.setAttribute('aria-live', 'polite');
    statusNode.setAttribute('data-output', 'status'); section.appendChild(statusNode);
    var frameNode = make(doc, 'pre'); frameNode.setAttribute('data-output', 'frame'); section.appendChild(frameNode);
    clear(target); target.appendChild(section);
    var frameOut = target.querySelector && target.querySelector('[data-output="frame"]');
    var status = target.querySelector && target.querySelector('[data-output="status"]');
    function refresh() {
      var fields = target.querySelectorAll ? target.querySelectorAll('[data-field]') : [], values = {};
      Array.prototype.forEach.call(fields, function (el) { values[el.getAttribute('data-field')] = el.type === 'number' ? Number(el.value) : el.value; });
      opts = Object.assign(opts, values); current = create(opts); compile(current);
      if (frameOut) frameOut.textContent = serialize(current);
      if (status) status.textContent = 'Bubble frame ready · ' + BufferBytes(serialize(current)) + ' bytes';
      return current;
    }
    function click(e) { if (e.target && e.target.getAttribute('data-action') === 'refresh') refresh(); }
    if (target.addEventListener) target.addEventListener('change', refresh);
    if (target.addEventListener) target.addEventListener('click', click);
    if (frameOut) frameOut.textContent = serialize(current);
    return Object.freeze({ frame: function () { return current; }, refresh: refresh, destroy: function () {
      if (target.removeEventListener) { target.removeEventListener('change', refresh); target.removeEventListener('click', click); }
      clear(target);
    } });
  }
  var API = Object.freeze({ VERSION: VERSION, LIMIT: LIMIT, PRIMITIVES: PRIMITIVES, STYLES: STYLES, bands: bands, byteLength: BufferBytes, create: create, serialize: serialize, compile: compile, mount: mount });
  if (common) module.exports = API; else root.AtlasBubbleEditor = API;
})(typeof module === 'object' && module.exports ? this : (this || window));
