// OpenWorld, calm (Mission A, 2026-11-16: «reduce visual complexity, never a capability»). One phase on <html>, read by
// the pieces that draw on the map, so each thing appears when it can be used:
//   arrive (no visit yet) → one primary action, Play; the crab's step buttons, the guardian arrow and the mission
//                           embers wait (none of them can act before a visit);
//   visit  (a visit, any state of the first adventure) → the important buildings named; the others named as you walk
//                           near them (CLOSE hexes), so the map is revealed by exploring.
// The town grows (Mission E): before a conquest only the hall, the hostel (welcome), the coliseum (practice) and the
// doctor (accessibility: never locked) stand; the other seven are foundations. The first real conquest of this visit
// opens three, each further one opens one more. Entering, walking, closing a panel, finishing or skipping a tutorial
// does not build buildings or unlock the colony. Four states, never mixed up: available · locked ·
// built (this device's own record) · accredited (only from a signed source; none reaches the web today: NO_DATA).
// A visit's win is a conquest of this visit, never permanent ownership.
// Every middle gamepad button shows its name in words under its icon; its accessible name begins with those words.
// Presentation only: reads the visit's own events, never changes its state.
(function (root) {
  'use strict';
  var KEY = ['hostel', 'coliseum', 'doctor'], CLOSE = 3, TOUR = 'preceptoros.tour';
  var NAMES = { 'gp-play': 'Play', Welcome: 'Help', Profile: 'Profile', Communication: 'Talk', 'gp-town': 'Node', 'gp-letters': 'Settings' };
  // Pure: phase(visit, tour) → 'arrive' | 'visit'. Finishing or skipping the tutorial stays 'visit'; only real
  // conquests open buildings (state/wins). The tour value is no longer consulted for the phase.
  function phase(visit, tour) { return !visit ? 'arrive' : 'visit'; }
  // Pure: named(id, dist, ph) → whether a town building's name pill is drawn (map_chunks.js names()).
  function named(id, dist, ph) { return KEY.indexOf(id) >= 0 || dist <= CLOSE; }
  // Pure: shows(what, ph) → whether a map layer that only acts during a visit is drawn: 'arrow' (the guardian arrow,
  // map_fog_layer.js) from the visit on; 'embers' (mission_hotspots.js, builders' gaps) is no longer phase-gated
  // (the caller checks wins). With only 'arrive' and 'visit' phases, embers behave like the arrow.
  function shows(what, ph) { return ph !== 'arrive'; }
  // Pure: label(name, aria) → the accessible name, beginning with the visible name (WCAG 2.5.3, label in name).
  function label(name, aria) { aria = String(aria || ''); return aria.toLowerCase().indexOf(name.toLowerCase()) === 0 ? aria : name + ' · ' + aria; }
  var OPEN = ['hostel', 'coliseum', 'doctor'], ORDER = ['workshop', 'agora', 'visitor-house', 'lottery', 'choir', 'customs', 'tower'];
  // Pure: state(m, ph, wins, signed) → 'accredited' | 'built' | 'available' | 'locked' for one of the node's buildings.
  function state(m, ph, wins, signed) {
    if (!m || !m.town) { return m && m.own ? 'built' : 'available'; }
    if (signed && signed.indexOf(m.id) >= 0) { return 'accredited'; }
    if (m.own) { return 'built'; }
    var i = ORDER.indexOf(m.id);
    return OPEN.indexOf(m.id) >= 0 || i < 0 || (wins > 0 && i < 2 + wins) ? 'available' : 'locked';
  }
  // Pure: why(id, wins) → the sentence a locked building says when tapped.
  function why(id, wins) { var i = ORDER.indexOf(id); return wins > 0 ? 'opens after ' + (i - 1 - wins) + ' more conquest' + (i - 1 - wins === 1 ? '' : 's') + '.' : 'opens after your first conquest.'; }
  var api = { OPEN: OPEN, ORDER: ORDER, state: state, why: why, KEY: KEY, CLOSE: CLOSE, TOUR: TOUR, NAMES: NAMES, phase: phase, named: named, shows: shows, label: label, now: function () { return 'arrive'; } };
  if (typeof module === 'object' && module.exports) { module.exports = api; return; }
  root.AtlasOwCalm = api;
  var doc = root.document, html = doc.documentElement, play = doc.getElementById('visitor-play');
  function tour() { try { return root.localStorage.getItem(TOUR) || ''; } catch (e) { return ''; } }
  var visit = !!doc.getElementById('visitor-beacon');
  function set() { var p = phase(visit, tour()); if (html.dataset.owPhase !== p) { html.dataset.owPhase = p; doc.dispatchEvent(new CustomEvent('ow:phase', { detail: { phase: p } })); } }
  api.now = function () { return html.dataset.owPhase || 'arrive'; };
  api.refresh = set;
  function wins() { var MP = root.AtlasMapPainter, V = MP && MP.view && MP.view(); return V && V.world && V.world.markList ? V.world.markList.filter(function (m) { return m.won; }).length : 0; }
  api.wins = wins; api.stateOf = function (m) { return state(m, api.now(), wins(), []); }; // signed: none reaches the web (NO_DATA)
  api.locked = function (m) { return !!(m && m.town && api.stateOf(m) === 'locked'); };
  // plot(g, x, top, o, H): a locked building's foundation, a dashed hex on the ground (map_chunks.js building()).
  api.plot = function (g, x, top, o, H) {
    var k = o.k; g.save(); g.strokeStyle = H.css(H.rgbOf(H.T.NEUTRAL.ink)); g.globalAlpha = 0.55; g.lineWidth = Math.max(0.8, 1.4 * k);
    if (g.setLineDash) { g.setLineDash([4 * k, 3 * k]); } g.beginPath(); o.corner.forEach(function (q, i) { g[i ? 'lineTo' : 'moveTo'](x + q[0] * 0.45, top - 2 * k + q[1] * 0.45); }); g.closePath(); g.stroke(); g.restore();
  };
  // tell(m, name): a tap on a foundation: the preceptor says what opens it (talk_head.js speaks it).
  api.tell = function (m, name) { var PT = root.AtlasPreceptorTalk && root.AtlasPreceptorTalk.view, t = (name || m.id) + ' is locked: it ' + why(m.id, wins());
    if (PT && PT.news) { PT.news(t, 'Node'); } return t; };
  function redraw() { var MP = root.AtlasMapPainter; if (MP && MP.resetCache) { MP.resetCache(); } }
  doc.addEventListener('ow:phase', redraw);
  if (play) {
    play.addEventListener('visitor:render', function (e) { var d = e.detail || {}; visit = !!(d.state || doc.getElementById('visitor-beacon')); set(); });
    play.addEventListener('visitor:end', function () { visit = false; set(); });
    play.addEventListener('visitor:battle', function () { root.setTimeout(redraw, 0); }); // a conquest may open the town
  }
  root.addEventListener('storage', function (e) { if (e.key === TOUR) { set(); } });
  set();
  // UX-VISIBILITY-01 (Mesa #39, 2026-11-16): content before the sticks. With a panel, a card or a dialog open the CSS
  // folds the two sticks and keeps one row of named buttons; while the visitor writes in a field there and the screen
  // has shrunk (a phone's keyboard), the gamepad steps aside entirely and comes back when the field is left.
  function typing() {
    var a = doc.activeElement, vv = root.visualViewport, h = vv ? vv.height : root.innerHeight;
    var field = !!(a && (a.tagName === 'TEXTAREA' || (a.tagName === 'INPUT' && !/^(range|checkbox|radio|button|submit)$/.test(a.type))) && a.closest && a.closest('#voices, .bs-sheet, dialog'));
    var t = field && (h < 0.75 * (root.screen && root.screen.height || h * 2) || h < 520);
    if (t) { html.dataset.owTyping = '1'; } else { delete html.dataset.owTyping; }
  }
  doc.addEventListener('focusin', typing); doc.addEventListener('focusout', function () { root.setTimeout(typing, 0); });
  if (root.visualViewport) { root.visualViewport.addEventListener('resize', typing); } root.addEventListener('resize', typing);
  api.typing = typing;
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
