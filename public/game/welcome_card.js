// OpenWorld welcome · SQUEEZE · one panel (HITL 2026-11-20 Grok)
// Single CTA: Sign HITL, and take a piece. One Skip tutorial checkbox. No stacked sheets.
(function (root) {
  'use strict';
  var doc = root.document, card = doc.getElementById('sheet-welcome'), play = doc.getElementById('visitor-play');
  if (!card || !play) { return; }
  var go = doc.getElementById('welcome-play'), look = doc.getElementById('welcome-look'), said = doc.getElementById('welcome-result');
  var lore = doc.getElementById('welcome-lore');
  var skip = doc.getElementById('welcome-skip-tutorial');
  if (lore) {
    lore.textContent = 'You are an ephemeral crab: sign on this device, walk the map, conquer and talk. Crabs do not host services; nodes do (after the Sovereign activates them).';
  }
  if (go) { go.textContent = 'Sign HITL, and take a piece'; }
  if (look) { look.textContent = 'Look around'; }
  var liveStatus = doc.getElementById('welcome-live');
  if (!liveStatus) {
    liveStatus = doc.createElement('p'); liveStatus.id = 'welcome-live'; liveStatus.setAttribute('role', 'status');
    if (lore) { lore.after(liveStatus); }
  }
  liveStatus.textContent = 'Live nodes: NO_DATA · waiting. Visitors share presence only when an open authority is on.';
  doc.addEventListener('world:summary', function (event) {
    var data = event.detail || {};
    liveStatus.textContent = (data.ok ? 'Live nodes: ' + data.live + '.' : 'Live nodes: NO_DATA · ' + (data.cause || 'publisher unavailable') + '.') +
      ' Shared visitors: NO_DATA unless open authority is measured.';
  });
  var TUTORIAL = 'Visit active. Walk the map with your crab.';
  function close() { card.hidden = true; }
  function next(test) { return new Promise(function (ok) { function on(e) { if (test(e.detail || {})) { play.removeEventListener('visitor:render', on); ok(e.detail); } } play.addEventListener('visitor:render', on); }); }
  function press(id) { var b = doc.getElementById(id); if (!b || b.disabled) { throw new Error(id + ' is not available'); } b.click(); }
  function ready(d) { return !!(d.state && d.controls && d.controls.querySelector('#visitor-step')); }
  play.addEventListener('visitor:render', function () { if (go && !go.disabled) { close(); } });
  if (look) {
    look.addEventListener('click', function () { close(); var t = doc.getElementById('play-now'); if (t && !t.hidden) { t.focus({ preventScroll: true }); } });
  }
  card.addEventListener('keydown', function (e) { if (e.key === 'Escape') { e.preventDefault(); if (look) { look.click(); } } });
  if (go) {
    go.addEventListener('click', async function () {
      go.disabled = true; if (said) { said.textContent = 'Signing on this device…'; }
      try {
        var started = next(function (d) { return ready(d) && !d.state.claimed; });
        press('visitor-start'); await started;
        var claimed = next(function (d) { return ready(d) && d.state.claimed; });
        press('visitor-beacon'); var d = await claimed;
        if (root.AtlasTerminalTabs) { root.AtlasTerminalTabs.select('tab-summons'); }
        var n = Math.floor(d.state.copper / root.AtlasGacha.TCS.tc1.coste.cobre);
        var stateEl = doc.getElementById('state');
        if (stateEl) {
          stateEl.textContent = 'Visit started · signed on this device · ' + d.state.copper + ' copper · summon ' + (n === 2 ? 'twice' : n + ' times') + '. ' +
            ((skip && skip.checked) ? 'Tutorial skipped.' : TUTORIAL);
        }
        if (said) { said.textContent = (skip && skip.checked) ? 'Tutorial skipped. Explore the map.' : TUTORIAL; }
        close();
        var reef = doc.getElementById('visitor-summon-tc1'); if (reef) { reef.focus({ preventScroll: true }); }
      } catch (error) { if (said) { said.textContent = 'NO_DATA: ' + error.message; } go.disabled = false; }
    });
  }
  if (doc.getElementById('visitor-beacon')) { close(); } else { card.hidden = false; if (go) { go.focus({ preventScroll: true }); } }
})(globalThis);
