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
    lore.textContent = 'You are an ephemeral crab: sign on this device, walk the map, conquer and talk. Signing also shares your temporary crab key and map position with nearby visitors (never chat); Players lets you disconnect. Look around: a ghost crab that only watches. Crabs do not host services; nodes do.';
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
  function close() { card.hidden = true; }
  // One signature (Sovereign 2026-11-24): without HITL the visitor only looks, as a ghost crab; the signed account ends it.
  root.AtlasVisitorGhost = true;
  play.addEventListener('visitor:render', function (e) { root.AtlasVisitorGhost = !(e.detail && e.detail.account); });
  play.addEventListener('visitor:end', function () { root.AtlasVisitorGhost = true; });
  play.addEventListener('visitor:render', function () { if (go && !go.disabled) { close(); } });
  if (look) {
    look.addEventListener('click', function () { close(); var t = doc.getElementById('play-now'); if (t && !t.hidden) { t.focus({ preventScroll: true }); } });
  }
  card.addEventListener('keydown', function (e) { if (e.key === 'Escape') { e.preventDefault(); if (look) { look.click(); } } });
  async function enter(consent, skipTutorial) {
    if (consent !== true || go.disabled) { throw new Error('Visit unavailable'); }
    go.disabled = true;
    if (said) { said.textContent = 'Signing on this device…'; }
    try {
      var receipt = await root.AtlasVisitorPlay.enter(consent);
      if (skipTutorial) {
        var skipAction = doc.getElementById('fa-skip');
        if (skipAction) { skipAction.click(); }
      }
      var message = 'Visit signed on this device · ' + receipt.state.copper + ' copper.';
      if (said) { said.textContent = message; }
      var stateEl = doc.getElementById('state');
      if (stateEl) { stateEl.textContent = message; }
      close();
      if (root.AtlasTerminalTabs) { root.AtlasTerminalTabs.select('tab-summons'); }
      var reef = doc.getElementById('visitor-summon-tc1');
      if (reef) { reef.focus({ preventScroll: true }); }
      return receipt;
    } catch (error) {
      if (said) { said.textContent = 'NO_DATA: ' + error.message; }
      throw error;
    } finally { go.disabled = false; }
  }
  root.AtlasWelcome = { enter: enter, look: close };
  if (go) { go.addEventListener('click', function () { enter(true, skip && skip.checked).catch(function () {}); }); }
  if (doc.getElementById('visitor-beacon')) { close(); } else { card.hidden = false; if (go) { go.focus({ preventScroll: true }); } }
})(globalThis);
