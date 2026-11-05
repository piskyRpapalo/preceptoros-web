// The first-run welcome card of /openworld/ (two clicks from the landing to play): the Welcome voice at the top of the
// panel while no visit is active (compact terminal, 2026-11-02: it no longer covers the map; the Summons tab is retired). «Play now» runs the existing visit flow in one click: start (consent + Ed25519 keys signed on this device),
// then asks how to begin; it never claims rewards on the visitor’s behalf.
(function (root) {
  'use strict';
  var doc = root.document, card = doc.getElementById('sheet-welcome'), play = doc.getElementById('visitor-play');
  if (!card || !play) { return; }
  var go = doc.getElementById('welcome-play'), look = doc.getElementById('welcome-look'), said = doc.getElementById('welcome-result');
  var lore = doc.getElementById('welcome-lore');
  lore.textContent = 'Welcome to a world of waves: AI models live on equipment their owners control, under a human protocol. Owners can create buildings; you can explore and interact during your visit.';
  var liveStatus = doc.createElement('p'); liveStatus.id = 'welcome-live'; liveStatus.setAttribute('role', 'status');
  liveStatus.textContent = 'Live nodes: NO_DATA · waiting for the map. Live visitors: NO_DATA · no shared count is available.';
  lore.after(liveStatus);
  doc.addEventListener('world:summary', function (event) {
    var data = event.detail || {};
    liveStatus.textContent = (data.ok ? 'Live nodes: ' + data.live + '.' : 'Live nodes: NO_DATA · ' + (data.cause || 'publisher unavailable') + '.') +
      ' Live visitors: NO_DATA · no shared count is available.';
  });
  var TUTORIAL = 'Play the tutorial by walking to the beacon, or press Skip tutorial.';
  function close() { card.hidden = true; }
  function next(test) { return new Promise(function (ok) { function on(e) { if (test(e.detail || {})) { play.removeEventListener('visitor:render', on); ok(e.detail); } } play.addEventListener('visitor:render', on); }); }
  function press(id) { var b = doc.getElementById(id); if (!b || b.disabled) { throw new Error(id + ' is not available'); } b.click(); }
  function ready(d) { var b = d.controls && d.controls.querySelector('#visitor-step'); return !!(d.state && b && !b.disabled); }
  play.addEventListener('visitor:render', function () { if (!go.disabled) { close(); } });
  look.addEventListener('click', function () { close(); var t = doc.getElementById('play-now'); if (t && !t.hidden) { t.focus({ preventScroll: true }); } });
  card.addEventListener('keydown', function (e) { if (e.key === 'Escape') { e.preventDefault(); look.click(); } });
  go.addEventListener('click', async function () {
    go.disabled = true; said.textContent = 'Signing on this device…';
    try {
      var started = next(function (d) { return ready(d) && !d.state.claimed; });
      press('visitor-start'); await started;
      go.hidden = true; look.hidden = true;
      said.textContent = 'Choose how to begin your visit.';
      var choices = doc.createElement('div'); choices.className = 'acts'; choices.setAttribute('role', 'group'); choices.setAttribute('aria-label', 'Choose how to begin');
      function choice(label, id, action) {
        var button = doc.createElement('button'); button.type = 'button'; button.id = id; button.textContent = label;
        button.addEventListener('click', function () {
          try { action(); choices.remove(); close(); doc.getElementById('state').textContent = 'Visit started · ' + label + '.'; }
          catch (error) { said.textContent = 'NO_DATA: ' + error.message; }
        });
        choices.appendChild(button); return button;
      }
      var tutorial = choice('Tutorial', 'welcome-tutorial', function () {});
      choice('Free walk', 'welcome-free-walk', function () { var free = doc.getElementById('free-walk'); if (!free) throw new Error('free walk unavailable'); if (!free.checked) free.click(); });
      choice('Skip tutorial', 'welcome-skip-tutorial', function () { press('skip-tutorial'); });
      card.appendChild(choices); tutorial.focus({ preventScroll: true });
    } catch (error) { said.textContent = 'NO_DATA: ' + error.message; go.disabled = false; }
  });
  if (doc.getElementById('visitor-beacon')) { close(); } else { card.hidden = false; go.focus({ preventScroll: true }); }
})(globalThis);
