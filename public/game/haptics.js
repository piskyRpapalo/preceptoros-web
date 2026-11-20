// Felt in the hand (Sovereign 2026-11-15: «what the carbon feels, visual and functional»). On a phone that can vibrate
// (Android Chrome; elsewhere nothing happens), the game answers the thumb: a tick for a key, a rising pattern for a won
// battle, a double knock for a raid, one long pulse for a building lost, a little tune when a building becomes yours.
// One choice in Settings («Vibration · on/off»), kept on this device only; off until explicitly enabled.
// Presentation only: it reads events and never changes the visit.
(function (root) {
  'use strict';
  var KEY = 'ow:haptics';
  // Pure: PATTERNS[kind] → the vibration pattern (ms on, off, on…). Short: the longest lasts under half a second.
  var PATTERNS = { tap: [8], win: [30, 40, 70], loss: [90], raid: [50, 30, 50], lost: [120], yours: [20, 30, 20, 30, 60], held: [25, 25, 25] };
  // Pure: kindOf(event) → which pattern an acho:event or a battle result plays, or null.
  function kindOf(e) {
    if (!e) { return null; }
    if (e.combat) { return e.practice ? null : e.combat.gana === 'asalto' ? 'win' : 'loss'; }
    if (e.envelope && e.envelope.kind === 'node.state') {
      if (e.frame.status === 'LIVE') { return 'tap'; }
      if (e.frame.status === 'STALE') { return 'loss'; }
      return null;
    }
    var k = e.event && e.event.kind; return { 'holding.raid': 'raid', 'holding.lost': 'lost', 'holding.won': 'held', 'building.yours': 'yours' }[k] || null;
  }
  function read() { try { return root.localStorage.getItem(KEY); } catch (x) { return null; } }
  function on() { return read() === 'on'; }
  function buzz(kind) { var n = root.navigator; if (on() && n && typeof n.vibrate === 'function' && PATTERNS[kind]) { try { n.vibrate(PATTERNS[kind]); } catch (x) { /* not allowed yet */ } } }
  function card(doc, sheet) { // one card in Settings, added once
    if (!sheet || sheet.querySelector('#set-haptics')) { return; }
    var lists = sheet.querySelectorAll('.bs-list'), ul = lists[lists.length - 1]; if (!ul) { return; }
    var li = doc.createElement('li'), b = doc.createElement('button'); b.type = 'button'; b.className = 'bs-card'; b.id = 'set-haptics';
    var paint = function () { var v = on(); b.textContent = 'Vibration · ' + (v ? 'on' : 'off'); b.setAttribute('aria-pressed', String(v)); };
    b.addEventListener('click', function () { try { root.localStorage.setItem(KEY, on() ? 'off' : 'on'); } catch (x) { /* private window */ } paint(); buzz('tap'); });
    paint(); li.appendChild(b); ul.appendChild(li);
  }
  function mount(doc) {
    doc.addEventListener('pointerdown', function (e) { if (e.target.closest && e.target.closest('#gamepad button, .cats button, .bs-card, .mk-keep')) { buzz('tap'); } }, true);
    doc.addEventListener('acho:event', function (e) { var k = kindOf(e.detail); if (k) { buzz(k); } });
    var box = doc.getElementById('visitor-play'); if (box) { box.addEventListener('visitor:battle', function (e) { var k = kindOf(e.detail); if (k) { buzz(k); } }); }
    if (root.MutationObserver) { new root.MutationObserver(function () { card(doc, doc.getElementById('settings-sheet')); }).observe(doc.body, { childList: true, subtree: true }); }
  }
  var api = { PATTERNS: PATTERNS, kindOf: kindOf };
  if (typeof module === 'object' && module.exports) { module.exports = api; }
  root.AtlasHaptics = api;
  if (root.document && root.document.getElementById && !(typeof module === 'object' && module.exports)) { mount(root.document); }
})(typeof window !== 'undefined' ? window : globalThis);
