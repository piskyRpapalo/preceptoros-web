// C8 live (Sovereign, 2026-11-08: «la Army defensora a pesar de ganar pierde un 10 % de la vida»; «el reloj son los pasos»).
// The bridge between the game and the Rust ledger: a won fight puts the winning squad in the building as its garrison
// (at 95 % life: the fight spent its 5 %); every step walked is one tick of the ledger (yield, oxygen upkeep, a raid every
// 20 steps, the NPC retaking an unguarded building after 60). The first win opens the building's stores (30 oxygen, 10
// copper, 5 biomass) so a garrison can breathe while the visitor walks. Nothing is stored or sent: the holdings live for
// this visit, like its conquests. Every event is told in words in the panel; every failure is NO_DATA with its cause.
(function (root) {
  'use strict';
  var STORES = [[3, 30], [0, 10], [2, 5]], LIFE_AFTER_WIN = 950;
  var KINDS = ['workshop', 'lottery', 'customs', 'hostel', 'tower', 'choir', 'agora', 'doctor', 'coliseum', 'visitor-house']; // the contract's order
  // key(place): a stable u32 for a building key, FNV-1a over its text (the same key always gives the same id).
  function key(place) {
    var h = 2166136261;
    for (var i = 0; i < place.length; i++) { h ^= place.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
    return h >>> 0;
  }
  // kindOf('b:workshop:3,1') -> 'workshop'; an unknown kind holds as a visitor house (it yields a little of each).
  function kindOf(place, kinds) {
    var m = /^b:([a-z-]+):/.exec(String(place || '')), k = m ? m[1] : '';
    return kinds.indexOf(k) >= 0 ? k : 'visitor-house';
  }
  function title(k) { return k.charAt(0).toUpperCase() + k.slice(1).replace(/-/g, ' '); }
  // won(st, led, result): a won fight becomes a holding; returns the sentence to tell (or null when it was not a win).
  function won(st, led, result) {
    if (!result || !result.combat || result.combat.gana !== 'asalto') { return null; }
    var k = kindOf(result.place, KINDS), n = Math.max(1, Math.min(10, (result.attackers || []).length));
    if (!st.opened) { STORES.forEach(function (s) { led.grant(s[0], s[1], st.step); }); st.opened = true; }
    if (!led.conquer(key(result.place), k, n, LIFE_AFTER_WIN)) { return 'NO_DATA: the ledger refused the ' + k; }
    st.names[key(result.place)] = title(k);
    return title(k) + ' is yours: ' + n + ' wave' + (n === 1 ? '' : 's') + ' stay as its garrison at 95 % life.';
  }
  // walked(st, led): one step is one tick; returns the sentences of what happened on this step.
  function walked(st, led) {
    st.step += 1;
    var e = led.tick(st.step), out = [];
    if (e.raided) { out.push('Step ' + st.step + ': the NPC raided your buildings; each garrison lost 10 % even though it held.'); }
    if (e.starved) { out.push('Step ' + st.step + ': no oxygen left; the garrisons weaken.'); }
    if (e.fell) { out.push('Step ' + st.step + ': a garrison fell to zero; its waves came home to your army.'); }
    if (e.retaken) { out.push('Step ' + st.step + ': an unguarded building went back to the NPC.'); }
    return out;
  }
  function boot(doc, led) {
    var V = root.AtlasHoldingsView, box = doc.getElementById('visitor-play'), st = { step: 0, opened: false, names: {} };
    function paint(lines) {
      if (!V) { return; }
      var sec = V.mount(doc, led, st.step);
      if (sec && lines && lines.length) {
        var p = doc.createElement('p'); p.className = 'holdings-news'; p.setAttribute('role', 'status');
        p.textContent = lines.join(' '); sec.insertBefore(p, sec.children[1] || null);
      }
    }
    paint();
    if (!box || led.estado === 'NO_DATA') { return; }
    box.addEventListener('visitor:battle', function (ev) { var s = won(st, led, ev.detail); if (s) { paint([s]); } });
    box.addEventListener('visitor:advance', function () { var lines = walked(st, led); if (lines.length || led.holdings().length) { paint(lines); } });
  }
  var api = { key: key, kindOf: kindOf, won: won, walked: walked, STORES: STORES, LIFE_AFTER_WIN: LIFE_AFTER_WIN };
  if (typeof module === 'object' && module.exports) { module.exports = api; }
  root.AtlasHoldingsLive = api;
  // On the page: load the ledger and its panel in order, then boot (nothing outside this origin).
  function need(doc, src, done) { var s = doc.createElement('script'); s.src = src; s.onload = done; doc.head.appendChild(s); }
  if (root.document && !(typeof module === 'object' && module.exports)) {
    need(root.document, '/game/holdings_wasm.js', function () {
      need(root.document, '/game/holdings_view.js', function () { root.AtlasHoldings.load().then(function (led) { boot(root.document, led); }); });
    });
  }
})(typeof window !== 'undefined' ? window : globalThis);
