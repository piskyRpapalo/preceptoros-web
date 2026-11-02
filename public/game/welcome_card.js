// The first-run welcome card of /openworld/ (two clicks from the landing to play): it covers the map while no visit is
// active. «Play now» runs the existing visit flow in one click: start (consent + Ed25519 keys signed on this device),
// claim the beacon (+100 copper, two reef summons), open the Summons tab, say it in #state. Any visit start closes it.
(function (root) {
  'use strict';
  var doc = root.document, card = doc.getElementById('sheet-welcome'), play = doc.getElementById('visitor-play');
  if (!card || !play) { return; }
  var go = doc.getElementById('welcome-play'), look = doc.getElementById('welcome-look'), said = doc.getElementById('welcome-result');
  var TUTORIAL = 'Play the tutorial by walking to the beacon, or press Skip tutorial.';
  function close() { card.hidden = true; }
  function next(test) { return new Promise(function (ok) { function on(e) { if (test(e.detail || {})) { play.removeEventListener('visitor:render', on); ok(e.detail); } } play.addEventListener('visitor:render', on); }); }
  function press(id) { var b = doc.getElementById(id); if (!b || b.disabled) { throw new Error(id + ' is not available'); } b.click(); }
  function ready(d) { var b = d.controls && d.controls.querySelector('#visitor-step'); return !!(d.state && b && !b.disabled); }
  play.addEventListener('visitor:render', function () { if (!go.disabled) { close(); } });
  look.addEventListener('click', function () { close(); var t = doc.getElementById('tab-map'); if (t) { t.focus(); } });
  card.addEventListener('keydown', function (e) { if (e.key === 'Escape') { e.preventDefault(); look.click(); } });
  go.addEventListener('click', async function () {
    go.disabled = true; said.textContent = 'Signing on this device…';
    try {
      var started = next(function (d) { return ready(d) && !d.state.claimed; });
      press('visitor-start'); await started;
      var claimed = next(function (d) { return ready(d) && d.state.claimed; });
      press('visitor-beacon'); var d = await claimed;
      if (root.AtlasTerminalTabs) { root.AtlasTerminalTabs.select('tab-summons'); }
      var n = Math.floor(d.state.copper / root.AtlasGacha.TCS.tc1.coste.cobre);
      doc.getElementById('state').textContent = 'Visit started · signed on this device · ' + d.state.copper + ' copper from the beacon · you can summon ' + (n === 2 ? 'twice' : n + ' times') + '. ' + TUTORIAL;
      said.textContent = TUTORIAL; close();
      var reef = doc.getElementById('visitor-summon-tc1'); if (reef) { reef.focus(); }
    } catch (error) { said.textContent = 'NO_DATA: ' + error.message; go.disabled = false; }
  });
  if (doc.getElementById('visitor-beacon')) { close(); } else { card.hidden = false; go.focus({ preventScroll: true }); }
})(globalThis);
