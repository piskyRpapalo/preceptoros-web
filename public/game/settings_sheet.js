// The settings wheel (Sovereign, 2026-11-08; odd/tasks/settings-wheel.md): the gear in the gamepad opens one sheet with
// what belongs to this device rather than to a building (letters, audio only, pulse, install, typo report, notebook).
// Build left the web: an ephemeral account only conquers (Town › Conquest); only nodes build, in the app.
// Each action reuses its real piece through town_actions.js; nothing is sent. 44 px targets, aria-live line, Escape closes.
(function (root) {
  'use strict';
  var GROUPS = [
    ['Device', [['letters', 'Letters size'], ['audio', 'Audio only'], ['pulse', 'Pulse of this page'], ['install', 'Install the app']]],
    ['Notes', [['typo', 'Report a typo'], ['notebook', 'Export your notebook']]]
  ];

  var sheet = null, line = null, win = null, btn = null;
  function say(t) { line.textContent = t; }
  function run(id, label) {
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
    sheet = doc.createElement('section'); sheet.id = 'settings-sheet'; sheet.className = 'bs-sheet'; sheet.hidden = true; sheet.setAttribute('aria-labelledby', 'ss-h');
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
    sheet.hidden = false; btn.setAttribute('aria-expanded', 'true'); say('Settings · this device');
    sheet.querySelector('.bs-card').focus();
  }
  var api = { GROUPS: GROUPS, toggle: toggle };
  if (typeof module === 'object' && module.exports) { module.exports = api; }
  root.AtlasSettings = api;
})(typeof window !== 'undefined' ? window : globalThis);
