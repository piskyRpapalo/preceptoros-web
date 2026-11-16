// OpenWorld, calm (Mission A, 2026-11-16: «reduce visual complexity, never a capability»). One phase on <html>, read by
// the pieces that draw on the map, so each thing appears when it can be used:
//   arrive (no visit yet) → one primary action, Play; the crab's step buttons, the guardian arrow and the mission
//                           embers wait (none of them can act before a visit);
//   visit  (a visit, the first adventure not finished) → the important buildings named; the others named as you walk
//                           near them (CLOSE hexes), so the map is revealed by exploring;
//   free   (the first adventure finished or skipped: localStorage preceptoros.tour) → everything, as before.
// Every middle gamepad button shows its name in words under its icon; its accessible name begins with those words.
// Presentation only: reads the visit's own events, never changes its state.
(function (root) {
  'use strict';
  var KEY = ['hostel', 'coliseum', 'doctor'], CLOSE = 3, TOUR = 'preceptoros.tour';
  var NAMES = { 'gp-play': 'Play', Welcome: 'Help', Profile: 'Profile', Communication: 'Talk', 'gp-town': 'Node', 'gp-letters': 'Settings' };
  // Pure: phase(visit, tour) → 'arrive' | 'visit' | 'free'.
  function phase(visit, tour) { return !visit ? 'arrive' : tour === 'done' || tour === 'skipped' ? 'free' : 'visit'; }
  // Pure: named(id, dist, ph) → whether a town building's name pill is drawn (map_chunks.js names()).
  function named(id, dist, ph) { return ph === 'free' || KEY.indexOf(id) >= 0 || dist <= CLOSE; }
  // Pure: shows(what, ph) → whether a map layer that only acts during a visit is drawn: 'arrow' (the guardian arrow,
  // map_fog_layer.js) from the visit on; 'embers' (mission_hotspots.js, builders' gaps) once the visitor is free.
  function shows(what, ph) { return what === 'embers' ? ph === 'free' : ph !== 'arrive'; }
  // Pure: label(name, aria) → the accessible name, beginning with the visible name (WCAG 2.5.3, label in name).
  function label(name, aria) { aria = String(aria || ''); return aria.toLowerCase().indexOf(name.toLowerCase()) === 0 ? aria : name + ' · ' + aria; }
  var api = { KEY: KEY, CLOSE: CLOSE, TOUR: TOUR, NAMES: NAMES, phase: phase, named: named, shows: shows, label: label, now: function () { return 'free'; } };
  if (typeof module === 'object' && module.exports) { module.exports = api; return; }
  root.AtlasOwCalm = api;
  var doc = root.document, html = doc.documentElement, play = doc.getElementById('visitor-play');
  function tour() { try { return root.localStorage.getItem(TOUR) || ''; } catch (e) { return ''; } }
  var visit = !!doc.getElementById('visitor-beacon');
  function set() { var p = phase(visit, tour()); if (html.dataset.owPhase !== p) { html.dataset.owPhase = p; doc.dispatchEvent(new CustomEvent('ow:phase', { detail: { phase: p } })); } }
  api.now = function () { return html.dataset.owPhase || 'arrive'; };
  api.refresh = set;
  if (play) {
    play.addEventListener('visitor:render', function (e) { var d = e.detail || {}; visit = !!(d.state || doc.getElementById('visitor-beacon')); set(); });
    play.addEventListener('visitor:end', function () { visit = false; set(); });
  }
  root.addEventListener('storage', function (e) { if (e.key === TOUR) { set(); } });
  set();
  var css = doc.createElement('link'); css.rel = 'stylesheet'; css.href = '/game/ow_calm.css'; doc.head.appendChild(css);
  function caption() {
    Array.prototype.forEach.call(doc.querySelectorAll('#gamepad .gp-mid button'), function (b) {
      var name = NAMES[b.id] || NAMES[b.dataset.cat]; if (!name || b.dataset.name === name) { return; }
      b.dataset.name = name; b.setAttribute('aria-label', label(name, b.getAttribute('aria-label') || b.title || name));
    });
  }
  caption();
  var mid = doc.querySelector('#gamepad .gp-mid'); // Node and Settings join the middle later (building_sheet.js, type_scale.js)
  if (mid && root.MutationObserver) { new root.MutationObserver(caption).observe(mid, { childList: true, subtree: true }); }
})(typeof window !== 'undefined' ? window : globalThis);
