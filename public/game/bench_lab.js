// The Benchmark Lab (Laboratory quarter of the one map, 2026-11-01). Each model listed in /cerebros.json is a building
// whose GEOMETRY IS ITS MEASUREMENT, in frame units (one unit = one hex unit of hex_projection.js times the zoom):
//   prism height  h = 6 * sqrt(gen)      gen  = measured generation speed, tok/s (cerebros.json `generacion`)
//   base width    w = 8 + 6 * sqrt(gib)  gib  = size on disk in GiB = `bytes` / 2^30
//   halo          a = 3 * sqrt(load)     load = measured first-load time, s (`carga_s`)
// sqrt keeps the order strict (more speed, higher; never equal for different values) and keeps a 30B model inside its
// hex. Points are rounded to whole units, so the same file draws the same building on every device.
// A value that is missing, not a positive number, or measured without its machine is NO_DATA with its cause: the part
// is drawn as an outline crossed by a hatch pattern and the button over it says NO_DATA in text, never colour alone.
// Pure part: no DOM, no clock, no random numbers. The browser part draws on visitor:draw (the one placement of
// colonia_pagina.js), lists one 44 px door per building under the map and opens its scripted chat (building_chat.js).
// «Run on this device» asks the web node brain for a local run; the result is shown next to the rack number and is
// never written back anywhere.
(function (root) {
  'use strict';
  var common = typeof module === 'object' && module.exports;
  // Reserve floor cells of odd/tasks/lugares-del-rack.md, then two more cells measured as floor on chunk 0_0.
  var CELLS = [[6, -5], [-4, -2], [-1, 6], [4, 2], [-6, 2], [3, 3], [2, -4]];
  var CV = [80, 120], BASE = [40, 100], SOURCE = '/cerebros.json';

  function num(v) { return typeof v === 'number' && isFinite(v) && v > 0 ? v : null; }
  function r1(v) { return Math.round(v * 10) / 10; }
  function height(gen) { return 6 * Math.sqrt(gen); }
  function width(gib) { return 8 + 6 * Math.sqrt(gib); }
  function halo(load) { return 3 * Math.sqrt(load); }

  // machine(file) → the hardware every number was measured on, or null when the file does not say it.
  function machine(file) { return file && typeof file.backend === 'string' && file.backend.trim() ? file.backend.trim() : null; }

  // measure(model, file) → { id, name, gen, gib, load, date, machine, missing: [{ part, cause }] }.
  function measure(model, file) {
    var m = machine(file), date = file && typeof file.medido === 'string' ? file.medido : null, missing = [];
    var gen = num(model.generacion), bytes = num(model.bytes), load = num(model.carga_s);
    if (!m) { missing.push({ part: 'machine', cause: 'cerebros.json names no machine' }); }
    if (!date) { missing.push({ part: 'date', cause: 'cerebros.json carries no measure date' }); }
    if (gen === null) { missing.push({ part: 'height', cause: 'generation speed not measured' }); }
    if (bytes === null) { missing.push({ part: 'width', cause: 'size on disk not measured' }); }
    if (load === null) { missing.push({ part: 'halo', cause: 'load time not measured' }); }
    var off = !m || !date;   // a number without its machine or its date is not a measure of this hardware
    return {
      id: String(model.id), name: String(model.modelo || model.id), machine: m, date: date, missing: missing,
      gen: off ? null : gen, gib: off || bytes === null ? null : bytes / 1073741824, load: off ? null : load
    };
  }

  // shape(ms) → the whole-unit geometry: { h, w, a } with null for each NO_DATA part.
  function shape(ms) {
    return {
      h: ms.gen === null ? null : Math.round(height(ms.gen)),
      w: ms.gib === null ? null : Math.round(width(ms.gib)),
      a: ms.load === null ? null : Math.round(halo(ms.load))
    };
  }

  function sentence(ms) {
    var parts = [ms.name,
      ms.gen === null ? 'generation NO_DATA' : r1(ms.gen) + ' tok/s generation',
      ms.gib === null ? 'size NO_DATA' : r1(ms.gib) + ' GiB on disk',
      ms.load === null ? 'load NO_DATA' : r1(ms.load) + ' s first load'];
    var tail = 'source ' + SOURCE + (ms.date ? ' measured ' + ms.date : '') + ' on ' + (ms.machine || 'NO_DATA machine');
    var nd = ms.missing.length ? ' · NO_DATA: ' + ms.missing.map(function (x) { return x.cause; }).join('; ') : '';
    return (parts.join(' · ') + ' · ' + tail + nd).slice(0, 300);
  }

  // frame(ms, t) → a bubble frame under 1,024 B: its sentence names the model and its ribbons ARE the building.
  function frame(ms, t) {
    var s = shape(ms), bx = BASE[0], by = BASE[1], hatch = s.h === null || s.w === null;
    var h = s.h === null ? 24 : s.h, w = s.w === null ? 14 : s.w, d = Math.round(w / 4), x0 = bx - Math.round(w / 2), x1 = x0 + w;
    var it = [];
    if (s.a !== null) {
      var R = Math.round(w / 2) + s.a + d;
      it.push({ o: 'ribbon', pts: [[bx - R, by], [bx, by - Math.round(R / 2)], [bx + R, by], [bx, by + Math.round(R / 2)]], closed: true, s: 'cyan', lw: 2 });
    }
    it.push({ o: 'ribbon', pts: [[x0, by], [x0, by - h], [x1, by - h], [x1, by]], closed: true, f: hatch ? undefined : 'paper', s: 'ink', lw: 2 });
    it.push({ o: 'ribbon', pts: [[x0, by - h], [x0 + d, by - h - d], [x1 + d, by - h - d], [x1, by - h]], closed: true, f: hatch ? undefined : 'cyan', s: 'ink', lw: 2 });
    it.push({ o: 'ribbon', pts: [[x1, by], [x1 + d, by - d], [x1 + d, by - h - d], [x1, by - h]], closed: true, f: hatch ? undefined : 'ink', s: 'ink', lw: 2 });
    if (hatch) { for (var y = by - h + 6; y < by; y += 12) { it.push({ o: 'ribbon', pts: [[x0, y + 4], [x1, y - 4]], closed: false, s: 'ink', lw: 1 }); } }
    var said = sentence(ms);
    return {
      v: 'preceptoros.bubble/1', id: 'lab-' + ms.id, t: t, cv: CV, seal: ms.missing.length ? 'NO_DATA' : 'LIVE',
      atoms: [{ k: 'lab-' + ms.id, r: said, i: it }], bands: ['paper', 'ink', 'cyan'], change: [ms.name + (ms.missing.length ? ' NO_DATA' : ' measured')],
      sound: 'NO_DATA: a building declares no waves', soundCause: 'a measure is not a sound'
    };
  }

  // script(ms, file) → the building_chat.js script of one building: what was measured, where, and by which command.
  function script(ms, file) {
    // The contract prose is not English: only its machine parts are shown (the endpoint and the `counters`).
    var raw = file && file.contrato && typeof file.contrato.como_se_mide === 'string' ? file.contrato.como_se_mide : '';
    var ep = (raw.match(/\/api\/[a-z]+/) || [])[0], ctr = (raw.match(/`[^`]+`/g) || []).map(function (x) { return x.slice(1, -1); });
    var how = ep ? 'POST ' + ep + ' to Ollama on the rack, read from its counters ' + ctr.join(', ') + '.' : 'NO_DATA · the file names no command';
    var nd = ms.missing.length ? ' NO_DATA: ' + ms.missing.map(function (x) { return x.cause; }).join('; ') + '.' : '';
    var nums = sentence(ms);
    return {
      name: 'Lab · ' + ms.name,
      greeting: 'This building is ' + ms.name + '. Its height is its generation speed, its width its size, its halo its load time.',
      measures: 'Measured: ' + nums,
      offers: ('Command: ' + how.slice(0, 200) + nd).slice(0, 300) + ' Press «Run on this device» to compare.',
      replies: {
        help: 'Ask me: what, status or offer. Escape or the Leave building button takes you out.',
        what: 'h = 6·√(tok/s), w = 8 + 6·√GiB, halo = 3·√s. No number is borrowed from another machine.',
        status: ms.missing.length ? ('NO_DATA ·' + nd).slice(0, 300) : 'Every part is measured on ' + ms.machine + ' (' + ms.date + ').',
        offer: 'I can run a short fixed prompt on this device with the web node brain. The result stays on this screen.'
      }
    };
  }

  // buildings(file) → [{ ms, cell, frame }] for every model of the file, on the reserve cells in file order.
  function buildings(file) {
    var list = file && Array.isArray(file.cerebros) ? file.cerebros : [];
    return list.slice(0, CELLS.length).map(function (m, i) { var ms = measure(m, file); return { ms: ms, cell: CELLS[i], frame: frame(ms, 0) }; });
  }

  // bars(rack, here) → the two text bars of the comparison, scaled to the larger of the two. here = null → NO_DATA.
  function bars(rack, here, cause) {
    var top = Math.max(rack || 0, here || 0) || 1, n = function (v) { return Math.round(20 * v / top); };
    var bar = function (v) { return new Array(n(v) + 1).join('█') + new Array(21 - n(v)).join('░'); };
    return [
      'Rack   ' + (rack === null ? 'NO_DATA' : bar(rack) + ' ' + r1(rack) + ' tok/s'),
      'This device ' + (here === null ? 'NO_DATA · ' + (cause || 'not run') : bar(here) + ' ' + r1(here) + ' tok/s · web node brain, not written anywhere')
    ];
  }

  var api = { CELLS: CELLS, SOURCE: SOURCE, height: height, width: width, halo: halo, measure: measure, shape: shape, frame: frame, script: script, buildings: buildings, bars: bars, attach: null, drawn: 0 };

  // attach(win): the browser layer.
  api.attach = function (win) {
    var doc = win.document, surface = doc.getElementById('surface');
    if (!surface || !win.fetch) { return; }
    var file = null, list = [], btns = {}, say = doc.createElement('p'), inside = null, run = null, out = null;
    say.id = 'lab-state'; say.className = 'state'; say.setAttribute('aria-live', 'polite');
    // The doors: one 44 px button per building, in a folded group under the map, so the keyboard reaches every
    // building even when its cell is outside the current view (the map has no camera pan).
    var doors = doc.createElement('details'), sum = doc.createElement('summary'), row = doc.createElement('div');
    doors.id = 'lab-doors'; sum.textContent = 'Benchmark Lab buildings'; sum.style.minHeight = '44px'; sum.style.lineHeight = '44px';
    row.setAttribute('role', 'group'); row.setAttribute('aria-label', 'Enter a lab building'); row.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px';
    doors.appendChild(sum); doors.appendChild(row);
    var anchor = doc.getElementById('floor-state') || surface; anchor.after(say); say.after(doors);
    function leave() { inside = null; if (run) { run.hidden = true; out.hidden = true; } }
    function enter(b) {
      var v = win.AtlasOpenworldView && win.AtlasOpenworldView();
      if (!v || !v.chat) { say.textContent = 'NO_DATA · the map cannot open buildings'; return; }
      inside = b;
      v.chat({ id: 'lab-' + b.ms.id, node: 'lab-' + b.ms.id, lab: script(b.ms, file) });
      if (!run) {
        run = doc.createElement('button'); run.type = 'button'; run.id = 'lab-run'; run.textContent = 'Run on this device';
        run.style.minHeight = run.style.minWidth = '44px';
        out = doc.createElement('pre'); out.id = 'lab-bars'; out.setAttribute('aria-live', 'polite');
        var en = doc.getElementById('entry'); if (en) { en.before(run); } else { surface.after(run); } run.after(out);
        doc.addEventListener('click', function (e) { if (e.target && e.target.id === 'leave-building') { leave(); } });
        doc.addEventListener('keydown', function (e) { if (e.key === 'Escape') { leave(); } });
        run.addEventListener('click', function () { bench(inside); });
      }
      run.hidden = false; out.hidden = false; out.textContent = bars(inside.ms.gen, null, 'press Run on this device').join('\n');
    }
    function bench(b) {
      if (!b) { return; }
      var W = win.AtlasWebNodeBrain;
      if (!W || !W.bench || W.status() !== 'ready') { out.textContent = bars(b.ms.gen, null, 'model_not_installed · load the web node brain from the radio first').join('\n'); return; }
      run.disabled = true; out.textContent = bars(b.ms.gen, null, 'running a fixed prompt on this device…').join('\n');
      W.bench().then(function (r) { out.textContent = bars(b.ms.gen, r.rate, '').join('\n') + '\n' + r.count + ' pieces in ' + r1(r.seconds) + ' s · model ' + r.model + ', smaller than the rack model: compare devices, not models'; },
        function (e) { out.textContent = bars(b.ms.gen, null, e.cause || 'model_unavailable').join('\n'); })
        .then(function () { run.disabled = false; });
    }
    function button(b) {
      var x = btns[b.ms.id];
      if (!x) {
        x = btns[b.ms.id] = doc.createElement('button'); x.type = 'button'; x.className = 'lab-building'; x.dataset.model = b.ms.id;
        x.style.minHeight = '44px'; x.style.minWidth = '44px';
        x.addEventListener('click', function () { enter(b); });
        row.appendChild(x);
      }
      x.textContent = b.ms.name + (b.ms.missing.length ? ' · NO_DATA' : '');
      x.setAttribute('aria-label', 'Enter lab building: ' + b.frame.atoms[0].r.slice(0, 200));
      return x;
    }
    surface.addEventListener('visitor:draw', function () {
      var v = win.AtlasOpenworldView ? win.AtlasOpenworldView() : null, CP = win.AtlasColoniaPagina, P = win.HexProjection, MP = win.AtlasMapPainter;
      if (!list.length || !v || !v.colony || !CP || !CP.geometry || !P) { return; }
      var G = CP.geometry(CP.scene(v.colony, v.t, false, v.looks, v.seals), surface), g = surface.getContext('2d');
      var w = MP && MP.world(), at = w ? w.cells.at : {}, step = MP ? MP.HSTEP : 7;
      api.drawn = 0;
      g.setTransform(1, 0, 0, 1, 0, 0);
      list.forEach(function (b) {
        var p = P(b.cell[0], b.cell[1]), c = at[b.cell[0] + ',' + b.cell[1]], lift = c ? c[2] * step : 0;
        var x = G.cx + p.x * G.k, y = G.cy + (p.y - lift) * G.k, k = G.k * 1.2;
        g.save(); g.translate(x - BASE[0] * k, y - BASE[1] * k); g.scale(k, k); win.AtlasComicAtoms.paint(g, win.AtlasBubble.compile(b.frame)); g.restore();
        api.drawn++;
      });
    });
    win.fetch(SOURCE, { credentials: 'omit' }).then(function (r) { return r.ok ? r.json() : null; }).then(function (d) {
      if (!d || d.estado !== 'MEDIDO') { say.textContent = 'Lab: NO_DATA · ' + SOURCE + ' is not a measured file'; return; }
      file = d; list = buildings(d); list.forEach(button);
      var nd = list.filter(function (b) { return b.ms.missing.length; }).length;
      say.textContent = 'Lab: ' + list.length + ' model buildings, height = speed, width = size, halo = load · ' + nd + ' NO_DATA';
      surface.dispatchEvent(new CustomEvent('visitor:draw'));
    }, function () { say.textContent = 'Lab: NO_DATA · ' + SOURCE + ' unavailable'; });
  };

  if (common) { module.exports = api; }
  else { root.AtlasBenchLab = api; if (root.document) { api.attach(root); } }
})(typeof globalThis === 'object' ? globalThis : this);
