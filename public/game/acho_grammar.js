// Acho grammar (Sovereign, 2026-11-23): the inside of the panels speaks in shape before words. Every card of a sheet
// (.bs-sheet .bs-card) wears the closed harmonic figure of its own name: k = 1..3, the phases of AtlasGamepad.spectrum,
// x = Σ cos(k·t + φk)/k, y = Σ sin(k·t + 2φk)/k. Same name, same figure, forever. The seal is a glyph with its word
// kept for the screen reader (○ LIVE, □ NO_DATA); a building with several options still asleep says it once, folded
// («4 still asleep · NO_DATA»), and each one keeps its cause when pressed. The pad buttons wear their figure as a halo.
// Pure core (figure, plan) + a small DOM pass. No clock, no random, no network. Reduced motion: nothing moves here.
(function (root) {
  'use strict';
  var TAU = Math.PI * 2, NS = 'http://www.w3.org/2000/svg';
  var GLYPH = { LIVE: '○', NO_DATA: '□' };
  function G() { return root.AtlasGamepad; }
  function spec(name) {
    var g = G(); if (g && g.spectrum) { return g.spectrum(name); }
    var h = 0x811c9dc5, s = String(name), ph = [];
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
    for (var k = 1; k <= 3; k++) { ph.push(((h >>> (8 * k)) & 255) / 256 * TAU); }
    return { amps: [1, 0.5, 0.333], phases: ph, color: 'currentColor' };
  }
  // figure(name, r, n) → the SVG path of the closed figure, centred on 0,0 with radius r (one decimal).
  function figure(name, r, n) {
    var s = spec(name), c = Math.max(8, n | 0), norm = s.amps[0] + s.amps[1] + s.amps[2], d = '';
    for (var i = 0; i <= c; i++) {
      var t = i / c * TAU, x = 0, y = 0;
      for (var k = 0; k < 3; k++) { x += s.amps[k] * Math.cos((k + 1) * t + s.phases[k]); y += s.amps[k] * Math.sin((k + 1) * t + 2 * s.phases[k]); }
      d += (i ? 'L' : 'M') + Math.round(x / norm * r * 10) / 10 + ' ' + Math.round(y / norm * r * 10) / 10;
    }
    return d + 'Z';
  }
  // ring(name, r) → a closed ring whose radius breathes with the name: r·(1 + 0.09·Σ sin((k+1)·θ + φk)/k / Σ 1/k).
  // It never crosses inside r·0.91, so a halo around a button never covers its icon.
  function ring(name, r, n) {
    var s = spec(name), c = Math.max(12, n | 0), norm = s.amps[0] + s.amps[1] + s.amps[2], d = '';
    for (var i = 0; i <= c; i++) {
      var t = i / c * TAU, v = 0;
      for (var k = 0; k < 3; k++) { v += s.amps[k] * Math.sin((k + 2) * t + s.phases[k]); }
      var q = r * (1 + 0.09 * v / norm);
      d += (i ? 'L' : 'M') + Math.round(Math.cos(t) * q * 10) / 10 + ' ' + Math.round(Math.sin(t) * q * 10) / 10;
    }
    return d + 'Z';
  }
  // plan(seals) → which cards fold: only when at least one is LIVE and two or more are asleep (one asleep stays in sight).
  function plan(seals) {
    var live = seals.filter(function (s) { return s === 'LIVE'; }).length, asleep = seals.length - live;
    return { live: live, asleep: asleep, fold: live > 0 && asleep > 1 };
  }
  function mark(doc, name, r, cls, round) {
    var s = doc.createElementNS(NS, 'svg'), p = doc.createElementNS(NS, 'path');
    s.setAttribute('viewBox', [-r - 2, -r - 2, 2 * r + 4, 2 * r + 4].join(' ')); s.setAttribute('aria-hidden', 'true');
    s.setAttribute('focusable', 'false'); s.setAttribute('class', cls);
    p.setAttribute('d', round ? ring(name, r, 96) : figure(name, r, 72)); s.appendChild(p); s.style.setProperty('--ag', spec(name).color);
    return s;
  }
  function nameOf(b) { return (b.firstChild && b.firstChild.nodeType === 3 ? b.firstChild.textContent : b.textContent).trim(); }
  // A card: the figure after its words (the first text node stays first: tests and readers start there), the seal as glyph.
  function card(doc, b) {
    if (b.dataset.ag) { return; }
    b.dataset.ag = '1'; b.classList.add('ag-card');
    b.appendChild(mark(doc, nameOf(b), 20, 'ag-fig'));
    var seal = b.querySelector('.bs-seal');
    if (seal && GLYPH[seal.textContent]) {
      var g = doc.createElement('span'); g.className = 'ag-glyph'; g.setAttribute('aria-hidden', 'true'); g.textContent = GLYPH[seal.textContent];
      seal.classList.add('ag-sr'); b.insertBefore(g, seal);
    }
  }
  // The building list: asleep options stay in their contract order but out of sight, behind one toggle that says
  // them once («3 still asleep · NO_DATA»). Open, each one shows its own seal and says its cause when pressed.
  function fold(doc, ul) {
    var lis = [].filter.call(ul.children, function (li) { return !!li.querySelector(':scope > .bs-card[data-seal]'); });
    var key = lis.map(function (li) { return nameOf(li.firstElementChild); }).join('|');
    if (ul.dataset.ag === key) { return; }
    ul.dataset.ag = key; ul.classList.remove('ag-open');
    var old = ul.querySelector(':scope > .ag-fold'); if (old) { old.remove(); }
    var p = plan(lis.map(function (li) { return li.firstElementChild.dataset.seal; }));
    if (!p.fold) { return; }
    var li = doc.createElement('li'), t = doc.createElement('button'), w = doc.createElement('span'), sr = doc.createElement('span');
    li.className = 'ag-fold'; t.type = 'button'; t.className = 'bs-tool ag-card ag-sum'; t.setAttribute('aria-expanded', 'false');
    t.textContent = p.asleep + ' still asleep'; w.className = 'ag-glyph'; w.setAttribute('aria-hidden', 'true'); w.textContent = GLYPH.NO_DATA;
    sr.className = 'ag-sr'; sr.textContent = ' · NO_DATA · show each cause'; t.appendChild(w); t.appendChild(sr);
    if (G() && G().paint) { G().paint(t, 'Still asleep'); } // every control of the sheet is an Acho button
    t.addEventListener('click', function () { var o = ul.classList.toggle('ag-open'); t.setAttribute('aria-expanded', String(o)); });
    lis.forEach(function (x) { if (x.firstElementChild.dataset.seal !== 'LIVE') { x.classList.add('ag-asleep'); } });
    li.appendChild(t); ul.appendChild(li);
    var a = doc.activeElement; if (a && a.closest && a.closest('.ag-asleep')) { var f = ul.querySelector('li:not(.ag-asleep) button'); if (f) { f.focus(); } }
  }
  function halo(doc, b) {
    if (b.dataset.agHalo) { return; }
    b.dataset.agHalo = '1'; var n = b.getAttribute('aria-label') || b.textContent || b.id; b.appendChild(mark(doc, b.dataset.name || n.split(/[:.]/)[0].trim(), 26, 'ag-halo', true));
  }
  // slots(n, primary) → grid cells [row, col] for the face buttons, like a controller's: a diamond for four (the one
  // to press next at the bottom, where a thumb rests), a diamond and its centre for five, three across for three.
  var CELLS = { 1: [[2, 2]], 2: [[2, 1], [2, 3]], 3: [[1, 2], [2, 1], [2, 3]], 4: [[1, 2], [2, 1], [2, 3], [3, 2]], 5: [[1, 2], [2, 1], [2, 3], [3, 2], [2, 2]] };
  function slots(n, primary) {
    var c = (CELLS[n] || []).slice(); if (!c.length) { return null; }
    if (primary >= 0 && n >= 4) { var a = c[3]; c[3] = c[primary]; c[primary] = a; }
    return c;
  }
  function face(doc) {
    var mid = doc.querySelector('#gamepad .gp-mid'); if (!mid) { return; }
    var bs = [].filter.call(mid.querySelectorAll('.gp-b,.cats button'), function (b) { return !b.hidden; });
    var p = bs.findIndex(function (b) { return b.id === 'gp-play' || b.hasAttribute('data-fa-next'); }), c = slots(bs.length, p);
    mid.classList.toggle('ag-face', !!c);
    bs.forEach(function (b, i) { var v = c ? c[i][0] + ' / ' + c[i][1] : ''; if (b.style.gridArea !== v) { b.style.gridArea = v; } });
  }
  function pass(doc) {
    face(doc);
    [].forEach.call(doc.querySelectorAll('.bs-sheet .bs-card:not([data-ag])'), function (b) { if (b.tagName !== 'SUMMARY') { card(doc, b); } });
    var town = doc.querySelector('#building-sheet > .bs-list'), back = doc.querySelector('#building-sheet .bs-bar .bs-tool');
    if (town && back && !back.hidden) { fold(doc, town); } // inside a building only: the nine doors never fold
    [].forEach.call(doc.querySelectorAll('#gamepad :is(.gp-mid .gp-b,.gp-mid .cats button,.view-stick):not([data-ag-halo])'), function (b) { halo(doc, b); });
  }
  function mount(doc, w) {
    if (!doc.getElementById('ag-css')) { var l = doc.createElement('link'); l.id = 'ag-css'; l.rel = 'stylesheet'; l.href = '/game/acho_grammar.css'; doc.head.appendChild(l); }
    var queued = false, raf = (w && w.requestAnimationFrame) ? w.requestAnimationFrame.bind(w) : function (f) { setTimeout(f, 16); };
    function soon() { if (queued) { return; } queued = true; raf(function () { queued = false; pass(doc); }); }
    pass(doc);
    if (w && w.MutationObserver) { new w.MutationObserver(soon).observe(doc.body, { childList: true, subtree: true }); }
  }
  var api = { figure: figure, ring: ring, plan: plan, slots: slots, GLYPH: GLYPH, mount: mount };
  if (typeof module === 'object' && module.exports) { module.exports = api; }
  root.AtlasAchoGrammar = api;
  if (root.document && root.document.body) { mount(root.document, root); }
})(typeof window !== 'undefined' ? window : globalThis);
