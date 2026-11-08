// Panels close (Sovereign commission 2026-11-08, piece 4 + 5; odd/tasks/crab-alive.md). Every panel has a visible 44 px
// close (✕): the voices panel gets one here; the Town and Settings sheets already carry «Close» (talk.css draws its ✕).
// Accepting an action that the crab carries out closes its panel, so the map comes back in view:
// fight and hatch only close (crab_stage.js zooms with their scene); summon and build also zoom onto the crab and the
// camera stays there until the visitor pans or zooms (a camera courtesy: render only, no state). Escape still closes.
(function (root) {
  'use strict';
  var doc = root.document;
  // Pure: what accepting a button does → 'close+look', 'close' or null. Tested in atlas/puros/panel_x_cases.mjs.
  function verdict(id) {
    if (/^visitor-(summon-|beacon$)|^set-build-/.test(id || '')) { return 'close+look'; }
    if (/^visitor-(fight-|hatch-)/.test(id || '')) { return 'close'; }
    return null;
  }
  function openCat() { return doc.querySelector('#map .cats button[aria-pressed="true"]') || doc.querySelector('#entry-tools[aria-expanded="true"]'); }
  function closeAll() {
    var b = openCat(); if (b) { b.click(); }
    ['building-sheet', 'settings-sheet'].forEach(function (id) {
      var s = doc.getElementById(id); if (s && !s.hidden) { var c = s.querySelector('.bs-bar > .bs-tool:last-child'); if (c) { c.click(); } }
    });
  }
  function mount() {
    var v = doc.getElementById('voices');
    if (!v || doc.getElementById('voices-x')) { return null; }
    var x = doc.createElement('button'); x.type = 'button'; x.id = 'voices-x'; x.className = 'panel-x'; x.textContent = '✕';
    x.setAttribute('aria-label', 'Close panel'); x.title = 'Close panel';
    x.addEventListener('click', function () { var b = openCat(); if (b) { b.click(); b.focus(); } });
    v.insertBefore(x, v.firstChild);
    doc.addEventListener('click', function (e) {
      var b = e.target && e.target.closest ? e.target.closest('button') : null, w = b && verdict(b.id);
      if (!w || b.disabled) { return; }
      root.setTimeout(function () {             // after the button's own handler has acted
        closeAll();
        var CS = root.AtlasCrabStage; if (w === 'close+look' && CS && CS.look) { CS.look(); }
      }, 0);
    });
    return x;
  }
  var api = { verdict: verdict, mount: mount };
  if (typeof module === 'object' && module.exports) { module.exports = api; }
  root.AtlasPanelX = api;
  if (doc && doc.getElementById) { if (!mount() && doc.addEventListener) { doc.addEventListener('DOMContentLoaded', mount); } }
})(typeof window !== 'undefined' ? window : globalThis);
