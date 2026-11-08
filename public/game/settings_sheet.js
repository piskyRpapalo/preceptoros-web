// The settings wheel (Sovereign, 2026-11-08; odd/tasks/settings-wheel.md): the gear in the gamepad opens one sheet with
// what belongs to this device rather than to a building (letters, audio only, pulse, install, typo report, notebook)
// and a Build section: place a town building on the crab's hex. A built building is kept on this device only
// (localStorage «preceptoros.built»), drawn by map_chunks.js landmarks() like any village building, and says so.
// Each action reuses its real piece through town_actions.js; nothing is sent. 44 px targets, aria-live line, Escape closes.
(function (root) {
  'use strict';
  var KEY = 'preceptoros.built', CAP = 12;
  var KINDS = [['hostel', 'Hostel', 'cone', 'PROPUESTA.base'], ['workshop', 'Workshop', 'chimney', 'PROPUESTA.base'],
    ['choir', 'Choir', 'dome', 'FIRMADO.base'], ['agora', 'Agora', 'dome', 'LIVE.base'], ['tower', 'Model tower', 'spire', 'cyan']];
  var GROUPS = [
    ['Device', [['letters', 'Letters size'], ['audio', 'Audio only'], ['pulse', 'Pulse of this page'], ['install', 'Install the app']]],
    ['Notes', [['typo', 'Report a typo'], ['notebook', 'Export your notebook']]],
    ['Build', KINDS.map(function (k) { return ['build:' + k[0], 'Build a ' + k[1] + ' here']; })]
  ];

  // Pure: can a building stand on this cell? → null when yes, else the cause (tested in atlas/puros/settings_cases.mjs).
  function why(cell, marks, built, q, r) {
    if (!cell) { return 'no_floor_here'; }
    if (cell[3] === 'water') { return 'water_cannot_hold_a_building'; }
    if ((Math.abs(q) + Math.abs(r) + Math.abs(q + r)) / 2 <= 2) { return 'the_cabin_clearing_stays_free'; }
    if (marks && marks[q + ',' + r]) { return 'a_building_already_stands_here'; }
    if (built.length >= CAP) { return 'this_device_holds_' + CAP + '_buildings'; }
    return null;
  }
  function read(win) { try { var a = JSON.parse(win.localStorage.getItem(KEY) || '[]'); return Array.isArray(a) ? a : []; } catch (e) { return []; } }

  var sheet = null, line = null, win = null, btn = null;
  function say(t) { line.textContent = t; }
  function build(kind) {
    var k = KINDS.filter(function (x) { return x[0] === kind; })[0], MP = root.AtlasMapPainter, V = MP && MP.view && MP.view();
    var ow = root.AtlasOpenworldView && root.AtlasOpenworldView(), w = ow && ow.controls && ow.controls.walker && ow.controls.walker();
    if (!k || !V || !w) { say('Build · NO_DATA · the crab is not on the map yet'); return; }
    var built = read(win), cause = why(V.world.cells.at[w.q + ',' + w.r], V.world.marks, built, w.q, w.r);
    if (cause) { say('Build · ' + k[1] + ' · not here: ' + cause.replace(/_/g, ' ')); return; }
    built.push({ q: w.q, r: w.r, id: k[0], roof: k[2], tone: k[3], own: 1 });
    try { win.localStorage.setItem(KEY, JSON.stringify(built)); } catch (e) { say('Build · NO_DATA · this browser keeps nothing'); return; }
    V.world.marks = null; V.world.markList = null; // landmarks() redraws the village with it
    if (ow.redraw) { ow.redraw(); }
    say('Built a ' + k[1] + ' at ' + w.q + ', ' + w.r + ' · kept on this device only (' + built.length + ' of ' + CAP + ')');
  }
  function run(id, label) {
    if (id.indexOf('build:') === 0) { build(id.slice(6)); return; }
    if (id === 'install') { var a = sheet.ownerDocument.getElementById('app-install'); if (a) { a.click(); say(label + ' · asked'); } else { win.location.assign('/get-the-app/'); } return; }
    var BS = root.AtlasBuildingSheet, load = function (src, name, then) {
      if (root[name]) { then(root[name]); return; }
      var sc = sheet.ownerDocument.createElement('script'); sc.src = src; sc.onload = function () { then(root[name] || null); }; sc.onerror = function () { then(null); };
      sheet.ownerDocument.head.appendChild(sc);
    };
    load('/game/town_actions.js', 'AtlasTownActions', function (TA) {
      if (!TA) { say(label + ' · NO_DATA · piece_not_loaded'); return; }
      TA.run(id, { win: win, doc: sheet.ownerDocument, data: BS && BS.data ? BS.data() : null, load: load }, function (t) { say(label + ' · ' + t); });
    });
  }
  function close() { sheet.hidden = true; btn.setAttribute('aria-expanded', 'false'); btn.focus(); }
  function make(doc) {
    var G = root.AtlasGamepad;
    sheet = doc.createElement('section'); sheet.id = 'settings-sheet'; sheet.hidden = true; sheet.setAttribute('aria-labelledby', 'ss-h');
    var bar = doc.createElement('div'), h = doc.createElement('h2'); bar.className = 'bs-bar'; h.id = 'ss-h'; h.textContent = 'Settings';
    var shut = doc.createElement('button'); shut.type = 'button'; shut.className = 'bs-tool'; shut.textContent = 'Close'; shut.addEventListener('click', close);
    bar.appendChild(h); bar.appendChild(shut); sheet.appendChild(bar);
    GROUPS.forEach(function (g) {
      var t = doc.createElement('h3'); t.textContent = g[0]; sheet.appendChild(t);
      var ul = doc.createElement('ul'); ul.className = 'bs-list';
      g[1].forEach(function (o) {
        var li = doc.createElement('li'), b = doc.createElement('button'); b.type = 'button'; b.className = 'bs-card'; b.id = 'set-' + o[0].replace(':', '-'); b.textContent = o[1];
        if (G && G.paint) { G.paint(b, o[1]); }
        b.addEventListener('click', function () { run(o[0], o[1]); });
        li.appendChild(b); ul.appendChild(li);
      });
      sheet.appendChild(ul);
    });
    line = doc.createElement('p'); line.className = 'bs-line'; line.setAttribute('role', 'status'); line.setAttribute('aria-live', 'polite'); sheet.appendChild(line);
    sheet.addEventListener('keydown', function (e) { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); } });
    var pad = doc.getElementById('gamepad'); pad.parentNode.insertBefore(sheet, pad);
  }
  // toggle(doc, w, gear): opens or closes the sheet; the gear button belongs to type_scale.js.
  function toggle(doc, w, gear) {
    win = w; btn = gear; if (!sheet) { make(doc); }
    if (!sheet.hidden) { close(); return; }
    var other = doc.getElementById('building-sheet'); if (other) { other.hidden = true; }
    sheet.hidden = false; btn.setAttribute('aria-expanded', 'true'); say('Settings · ' + read(w).length + ' of ' + CAP + ' buildings built on this device');
    sheet.querySelector('.bs-card').focus();
  }
  var api = { KEY: KEY, CAP: CAP, KINDS: KINDS, GROUPS: GROUPS, why: why, read: read, toggle: toggle };
  if (typeof module === 'object' && module.exports) { module.exports = api; }
  root.AtlasSettings = api;
})(typeof window !== 'undefined' ? window : globalThis);
