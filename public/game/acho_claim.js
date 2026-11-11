// Art is a claim (missions A9, C8, H6). One Acho frame is one statement with three readings: what is drawn
// (acho_language.js compile), what sounds (acho_sonify.js) and what a machine reads (the frame itself). This piece
// joins the three under ONE id per drawn thing, taken from the frame's own bytes, so the eye, the ear and a machine
// can point at the same row. It adds no grammar, no renderer and no sound: it only reads the three that exist.
// Pure: no clock, no randomness, no network. A frame that does not serialize, compile or line up is NO_DATA with its
// cause; a thing that cannot sound says why instead of inventing a tone.
(function (root) {
  'use strict';
  var common = typeof module === 'object' && module.exports;
  function piece(file, name) { return common ? require('./' + file) : root[name]; }

  // claim(frame) → { ok: true, id, bytes, rows: [{ id, primitive, look, listen, silent, inspect }] } | { ok: false, cause }
  // look = how many marks draw the thing; listen = its sound recipe or null; silent = why it has no sound, or null.
  function claim(frame) {
    var E = piece('acho_editor.js', 'AtlasAchoEditor'), S = piece('acho_sonify.js', 'AtlasSonifyAcho'), B = piece('acho_language.js', 'AtlasAcho');
    var text, groups;
    try { text = E.serialize(frame); groups = E.compile(frame); } catch (e) { return { ok: false, cause: 'NO_DATA: ' + (e && e.message || 'frame not readable') }; }
    var id = 'acho:' + ('0000000' + B.hash32(text).toString(16)).slice(-8), rows = [], n = 0, off = null;
    var mute = typeof frame.sound === 'string' && frame.sound.indexOf('NO_DATA') === 0;
    frame.atoms.forEach(function (atom, a) {
      (atom && Array.isArray(atom.i) ? atom.i : []).forEach(function (item, i) {
        var g = groups[n++], one = S.sonify({ atoms: [{ i: [item] }], sound: frame.sound });
        if (!g || g.o !== item.o) { off = off || (a + '.' + i); }
        rows.push({ id: id + '#' + a + '.' + i, primitive: item.o, look: g && g.items ? g.items.length : 0,
          listen: one.ok ? one.voices[0].recipe : null, inspect: item,
          silent: one.ok ? null : mute ? String(one.cause).replace(/^NO_DATA:?\s*/, '') : 'this ' + item.o + ' carries no harmonics' });
      });
    });
    if (off || n !== groups.length) { return { ok: false, cause: 'NO_DATA: the drawing and the frame do not line up at ' + (off || 'the end') }; }
    return { ok: true, id: id, bytes: E.byteLength(text), rows: rows };
  }

  // line(row) → the one sentence a screen, a screen reader and a log all show for that row.
  function line(row) {
    return row.id + ' · ' + row.primitive + ' · drawn with ' + row.look + (row.look === 1 ? ' mark' : ' marks') + ' · ' +
      (row.listen ? 'sounds at ' + row.listen.carrier + ' Hz' : 'silent: ' + row.silent);
  }

  // ── The three readings on a page (creation.html). Look draws the compiled marks, one group per row, each named by
  // its row line; Listen plays what acho_sonify.js derives, only after the press; Inspect shows the frame's own bytes.
  var NS = 'http:' + '//' + 'www.w3.org/2000/svg';
  function mark(doc, it) {
    var kind = it.op === 'group' ? 'g' : it.op === 'circle' ? 'circle' : it.op === 'text' ? 'text' : it.op === 'path' ? 'path' : null;
    if (!kind) { return null; }
    var e = doc.createElementNS(NS, kind), set = function (k, v) { if (v !== undefined && v !== null) { e.setAttribute(k, String(v)); } };
    if (kind === 'g') { set('transform', 'translate(' + (it.x || 0) + ' ' + (it.y || 0) + ')'); (it.items || []).forEach(function (x) { var c = mark(doc, x); if (c) { e.appendChild(c); } }); return e; }
    set('fill', it.fill || 'none');
    if (kind === 'text') { set('x', it.x); set('y', it.y); set('font-size', it.size); set('font-weight', it.weight); set('text-anchor', it.align === 'center' ? 'middle' : 'start'); e.textContent = it.text; return e; }
    set('stroke', it.stroke || 'none'); set('stroke-width', it.lw || 0); set('stroke-linecap', 'round'); set('stroke-linejoin', 'round');
    if (kind === 'circle') { set('cx', it.x); set('cy', it.y); set('r', it.r); } else { set('d', it.d); }
    return e;
  }
  // picture(doc, frame, result) → an <svg> whose top groups carry data-claim = the row id and a <title> = the row line.
  function picture(doc, frame, result) {
    var E = piece('acho_editor.js', 'AtlasAchoEditor'), B = piece('acho_language.js', 'AtlasAcho'), groups = E.compile(frame);
    var svg = doc.createElementNS(NS, 'svg'); svg.setAttribute('viewBox', '0 0 ' + frame.cv[0] + ' ' + frame.cv[1]);
    svg.setAttribute('role', 'img'); svg.setAttribute('aria-label', 'Drawing ' + result.id + ' · ' + result.rows.length + ' things');
    var paper = doc.createElementNS(NS, 'rect'); paper.setAttribute('width', '100%'); paper.setAttribute('height', '100%'); paper.setAttribute('fill', B.band('paper')); svg.appendChild(paper);
    groups.forEach(function (g, i) {
      var e = mark(doc, { op: 'group', x: g.x, y: g.y, items: g.items }), t = doc.createElementNS(NS, 'title');
      e.setAttribute('data-claim', result.rows[i].id); t.textContent = line(result.rows[i]); e.insertBefore(t, e.firstChild); svg.appendChild(e);
    });
    return svg;
  }
  // summary(result, reading) → the status sentence of one reading. Pure.
  function summary(result, reading) {
    if (!result.ok) { return result.cause; }
    var heard = result.rows.filter(function (r) { return r.listen; }), head = result.id + ' · ' + reading + ' · ';
    if (reading === 'listen') {
      return head + (heard.length ? heard.length + ' of ' + result.rows.length + ' sound: ' + heard.map(function (r) { return r.id.split('#')[1] + ' at ' + r.listen.carrier + ' Hz'; }).join(', ')
        : 'NO_DATA · silent: ' + (result.rows[0] ? result.rows[0].silent : 'the drawing is empty'));
    }
    return head + result.rows.length + (result.rows.length === 1 ? ' thing · ' : ' things · ') + result.bytes + ' of 1024 bytes';
  }
  function mount(doc, win) {
    var box = doc.getElementById('claim-panel'); if (!box) { return null; }
    var status = doc.getElementById('claim-status'), rows = doc.getElementById('claim-rows'), art = doc.getElementById('claim-art'), machine = doc.getElementById('claim-machine');
    var frame = null, name = 'your drawing', ctx = null, S = piece('acho_sonify.js', 'AtlasSonifyAcho');
    function read(reading) {
      if (!frame) { status.textContent = 'NO_DATA · no drawing yet: draw a ribbon above, or read the example'; return; }
      var r = claim(frame);
      status.textContent = name + ' · ' + summary(r, reading);
      rows.textContent = ''; art.textContent = ''; machine.hidden = reading !== 'inspect'; machine.textContent = '';
      if (!r.ok) { return; }
      r.rows.forEach(function (x) { var li = doc.createElement('li'); li.textContent = line(x); li.setAttribute('data-claim', x.id); rows.appendChild(li); });
      if (reading === 'look') { art.appendChild(picture(doc, frame, r)); }
      if (reading === 'inspect') { machine.textContent = JSON.stringify({ id: r.id, bytes: r.bytes, rows: r.rows.map(function (x) { return x.id; }), frame: frame }, null, 1); }
      if (reading === 'listen' && r.rows.some(function (x) { return x.listen; })) {
        var AC = win.AudioContext || win.webkitAudioContext;
        if (!AC) { status.textContent += ' · NO_DATA · this browser has no audio'; return; }
        ctx = ctx || new AC(); S.play(S.sonify(frame), ctx);
      }
    }
    ['look', 'listen', 'inspect'].forEach(function (reading) {
      var b = doc.getElementById('claim-' + reading); if (b) { b.addEventListener('click', function () { read(reading); }); }
    });
    var ex = doc.getElementById('claim-example');
    if (ex) { ex.addEventListener('click', function () {
      win.fetch('/game/acho_low_tide.json', { credentials: 'omit' }).then(function (x) { return x.ok ? x.json() : null; }).catch(function () { return null; }).then(function (f) {
        if (!f) { status.textContent = 'NO_DATA · example_not_loaded'; return; }
        frame = f; name = 'low tide'; read('look');
      });
    }); }
    var mine = doc.getElementById('claim-mine');
    var drawn = null; // the visitor's own drawing, as acho_paint.js last reported it (creation_flow.js relays it)
    if (mine) { mine.addEventListener('click', function () { name = 'your drawing'; frame = drawn; read('look'); }); }
    doc.addEventListener('acho:frame', function (e) { drawn = e.detail || null; if (name === 'your drawing') { frame = drawn; } });
    return { read: read };
  }

  var api = { claim: claim, line: line, summary: summary, picture: picture, mount: mount };
  if (common) { module.exports = api; } else { root.AtlasAchoClaim = api; }
  if (!common && root.document && root.document.getElementById) { mount(root.document, root); }
})(typeof module === 'object' && module.exports ? this : (this || window));
