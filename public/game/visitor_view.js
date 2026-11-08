// The visitor view: a non-technical visitor sees only what they can enjoy. Panels marked data-depth="tech" (map
// counts, floor loading, walkers, zoom readout) stay in the page for builders and tests, but are veiled until the
// visitor asks for them with one button. A technical panel that carries something to press (a HITL «Needs you») is never
// veiled: the CSS rule skips it, and the button counts only the panels it really hides. The choice is kept on this device only (localStorage), never sent.
(function (root) {
  'use strict';
  var KEY = 'preceptoros.view.depth';

  // depth(stored) → 'visitor' | 'builder'. Anything unknown is the visitor view.
  function depth(stored) { return stored === 'builder' ? 'builder' : 'visitor'; }
  function label(d, n) { return d === 'builder' ? 'Hide the ' + n + ' technical panels' : 'Show the ' + n + ' technical panels'; }

  // The four panels a visitor gains nothing from; the page keeps them, this piece marks them and adds its button.
  var TECH = ['Map', 'Floor', 'Walkers', 'Zoom'];
  function mount(doc, store) {
    var list = doc.getElementById('voices');
    if (!list) { return null; }
    TECH.forEach(function (s) { var e = list.querySelector('[data-speaker="' + s + '"]'); if (e) { e.setAttribute('data-depth', 'tech'); } });
    var li = doc.createElement('li'), btn = doc.createElement('button');
    li.className = 'voice depth'; li.setAttribute('data-speaker', 'Builders'); li.setAttribute('data-cat', 'Welcome'); // the panel's category for Builders
    btn.type = 'button'; btn.id = 'depth-toggle'; btn.setAttribute('aria-controls', 'voices');
    li.appendChild(btn); list.appendChild(li);
    var d = 'visitor';
    function veiled() { return [].filter.call(list.querySelectorAll('[data-depth="tech"]'), function (e) { return !e.querySelector('button'); }).length; }
    try { d = depth(store && store.getItem(KEY)); } catch (e) { d = 'visitor'; }
    function apply() {
      list.classList.toggle('visitor', d === 'visitor');
      btn.setAttribute('aria-pressed', d === 'builder' ? 'true' : 'false');
      var text = label(d, veiled()); if (btn.textContent !== text) { btn.textContent = text; }
    }
    btn.addEventListener('click', function () {
      d = d === 'builder' ? 'visitor' : 'builder';
      try { if (store) { store.setItem(KEY, d); } } catch (e) { /* private window: the choice lasts this visit */ }
      apply();
    });
    apply();
    // panels draw their buttons later (HITL «Needs you»): recount when the list changes; writes only on a real change
    var MO = doc.defaultView && doc.defaultView.MutationObserver;
    if (MO) { new MO(apply).observe(list, { childList: true, subtree: true }); }
    return { depth: function () { return d; }, count: veiled };
  }

  // Tools · the app on this phone (2026-11-08). No APK is published (INSTALL_ANDROID.md §4), so the honest Android
  // format is the installed web app: the browser's own install offer, kept by /assets/pwa.js, made in one press.
  function install(pwa) {
    if (pwa && pwa.instalada && pwa.instalada()) { return { mode: 'installed', text: 'The app is installed on this phone.' }; }
    if (pwa && pwa.instalable && pwa.instalable()) { return { mode: 'offer', text: 'Install the app on this phone' }; }
    return { mode: 'menu', text: 'Your browser has not offered to install yet: open its ⋮ menu and choose Install app or Add to Home screen.' };
  }
  function installCard(doc, list, win) {
    var li = doc.createElement('li'), p = doc.createElement('p'), btn = doc.createElement('button'), a = doc.createElement('a');
    li.className = 'voice'; li.setAttribute('data-speaker', 'App'); li.setAttribute('data-cat', 'Tools');
    btn.type = 'button'; btn.id = 'app-install'; a.href = '/get-the-app/'; a.textContent = 'Other systems and the Termux path';
    li.appendChild(btn); li.appendChild(p); li.appendChild(a); list.appendChild(li);
    function draw() {
      var r = install(win && win.PreceptorPwa);
      btn.hidden = r.mode !== 'offer'; if (r.mode === 'offer') { btn.textContent = r.text; }
      p.hidden = r.mode === 'offer'; if (p.textContent !== r.text && r.mode !== 'offer') { p.textContent = r.text; }
    }
    btn.addEventListener('click', function () { win.PreceptorPwa.instala().then(draw); });
    if (win && win.addEventListener) { win.addEventListener('pwa-oferta', draw); }
    draw();
    return li;
  }

  var api = { KEY: KEY, TECH: TECH, depth: depth, label: label, mount: mount, install: install, installCard: installCard };
  if (typeof module === 'object' && module.exports) { module.exports = api; }
  root.AtlasVisitorView = api;
  if (root.document) {
    var go = function () { var s = null; try { s = root.localStorage; } catch (e) { s = null; } mount(root.document, s); var l = root.document.getElementById('voices'); if (l) { installCard(root.document, l, root); } };
    if (root.document.readyState === 'loading') { root.document.addEventListener('DOMContentLoaded', go); } else { go(); }
  }
})(typeof window !== 'undefined' ? window : globalThis);

// The House as a game board (2026-11-08 · D15 slice, Sovereign: «summons fluid and showing the stats; fights spectacular»).
// visitor_play.js and visitor_battle_ui.js keep the game; this piece only dresses what they draw on each visitor:render:
// a purse of chips, eggs coloured by tier, the squad drawn as Fourier figures (the PR #15 language: a troop IS its harmonics)
// with its stats, the six places as hex tiles (locked until a troop exists), and the rules, odds and pity moved under
// «Technical details». No game rule lives here. Pure helpers (stats, figure) are exported for the cases.
(function (root) {
  'use strict';
  var STAT = [['vida', 'Life'], ['armadura', 'Armour'], ['velocidad', 'Speed'], ['sigilo', 'Stealth'], ['inercia', 'Inertia'], ['profundidad', 'Depth'], ['aura', 'Aura']];
  var RANK = { normal: 'Common', magico: 'Magic', raro: 'Rare', unico: 'Unique' };

  // [[label, value]] for every stat above zero, the rank first: what a child reads on the card.
  function stats(troop) {
    var t = troop || {}, s = t.stats || {};
    var out = [['Rank', RANK[t.rareza] || 'NO_DATA']];
    STAT.forEach(function (p) { if (s[p[0]] > 0) { out.push([p[1], s[p[0]]]); } });
    return out;
  }
  // The troop's own figure: x = Σ a·cos(k·t + φ), y = Σ b·sin(k·t + φ) over its harmonics [k, a, b, φ°]; an SVG path in a 0..100 box.
  function figure(troop) {
    var h = (troop && troop.armonicos) || [], pts = [], N = 96, m = 0;
    if (!h.length) { return ''; }
    for (var i = 0; i <= N; i++) {
      var t = i / N * Math.PI * 2, x = 0, y = 0;
      h.forEach(function (c) { var f = c[0] * t + c[3] * Math.PI / 180; x += c[1] * Math.cos(f); y += c[2] * Math.sin(f); });
      pts.push([x, y]); m = Math.max(m, Math.abs(x), Math.abs(y));
    }
    return pts.map(function (p, i) { return (i ? 'L' : 'M') + (50 + p[0] / m * 44).toFixed(1) + ' ' + (50 + p[1] / m * 44).toFixed(1); }).join('') + 'Z';
  }

  function chips(doc, list, cls) {
    var ul = doc.createElement('ul'); ul.className = 'chips ' + (cls || '');
    list.forEach(function (p) { var li = doc.createElement('li'), b = doc.createElement('b'); b.textContent = p[1]; li.append(p[0] + ' ', b); ul.append(li); });
    return ul;
  }
  function card(doc, troop) {
    var t = troop || {}, li = doc.createElement('li'), d = figure(t), NS = 'http://www.w3.org/2000/svg';
    li.className = 'troop r-' + (t.rareza || 'none');
    if (d) {
      var svg = doc.createElementNS(NS, 'svg'), path = doc.createElementNS(NS, 'path');
      svg.setAttribute('viewBox', '0 0 100 100'); svg.setAttribute('aria-hidden', 'true'); path.setAttribute('d', d); svg.append(path); li.append(svg);
    }
    li.append(chips(doc, stats(t)));
    return li;
  }

  function dress(box, detail) {
    var doc = box.ownerDocument, s = detail.state, c = detail.controls;
    if (!s || !c) { return; }
    box.classList.add('board');
    // the fine print, once: the visit notice, the data lines and the battle legend go under «Technical details»
    var tech = box.querySelector(':scope > details.tech');
    if (!tech) {
      tech = doc.createElement('details'); tech.className = 'tech';
      var sum = doc.createElement('summary'); sum.textContent = 'Technical details'; tech.append(sum);
      var data = c.nextElementSibling, notice = box.querySelector(':scope > h2 + p');
      if (notice) { tech.append(notice); }
      if (data) { tech.append(data); }
      box.append(tech);
    }
    [].forEach.call(c.querySelectorAll(':scope > p'), function (p) { if (/^Practice battles/.test(p.textContent)) { tech.append(p); } });
    c.prepend(chips(doc, [['Copper', s.copper], ['Light', s.light], ['Steps', s.step], ['Troops', s.troops.length]], 'purse'));
    [].forEach.call(c.querySelectorAll('[id^=visitor-summon-]'), function (b) { b.classList.add('egg', 't' + b.id.slice(-1)); });
    [].forEach.call(c.querySelectorAll('[id^=visitor-hatch-]'), function (b) { b.classList.add('nest'); });
    var fights = c.querySelectorAll('[id^=visitor-fight-]');
    if (fights.length) {
      var ring = doc.createElement('div'); ring.className = 'places'; ring.setAttribute('role', 'group'); ring.setAttribute('aria-label', 'Places to fight');
      fights[0].before(ring);
      [].forEach.call(fights, function (b) { b.classList.add('place'); b.classList.toggle('locked', !s.troops.length); ring.append(b); });
    }
    if (s.troops.length) {
      var squad = doc.createElement('ul'); squad.className = 'squad'; squad.setAttribute('aria-label', 'Your squad');
      (detail.squad || []).slice(-6).forEach(function (x) { squad.append(card(doc, x)); });
      if (ring) { ring.before(squad); } else { c.append(squad); }
    }
  }

  var api = { stats: stats, figure: figure, dress: dress };
  root.AtlasVisitorBoard = api;
  var box = root.document && root.document.getElementById('visitor-play');
  if (box) { box.addEventListener('visitor:render', function (e) { dress(box, e.detail); }); }
})(typeof window !== 'undefined' ? window : globalThis);
