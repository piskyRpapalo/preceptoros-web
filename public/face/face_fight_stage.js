// P3 (2026-10-26, Sovereign decree): combat fills the whole map area, inside its own panel. The
// [W] O1b (2026-10-27): the ONE combat face, the wave duel, plays LIVE on this canvas. The
// fight draws on THIS canvas, to the right of the battle texts; the world map underneath is never
// painted by combat. Every panel that covers the map gets an "×" that closes it and returns to the
// map (a running fight is withdrawn first, as "Back to the Army" does).
(function (root) {
  'use strict';
  var doc = root.document, H = root.PreceptorFaceHooks, Bt = root.PreceptorBattle;
  if (!H || !Bt || !H.battle || !H.battle.duel) { return; }
  var escena = null, actual = null;
  var fight = doc.querySelector('#sheet-battle .fight');
  if (!fight) { return; }

  var lienzo = doc.createElement('canvas');
  lienzo.id = 'b-stage'; lienzo.className = 'fight-stage';
  lienzo.setAttribute('role', 'img'); lienzo.setAttribute('aria-label', 'The battle, drawn in its own panel; the map underneath stays clean.');
  fight.appendChild(lienzo);

  function quieto() { return !!(root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches); }
  // A fight starting (or a new one) mounts the wave duel over its live state; the fight ending stops it.
  function sigue() {
    var on = H.battle.on(), d = on ? H.battle.duel() : null, W = root.AtlasWaveDuel;
    if (d && W && actual !== d.semilla) {
      if (escena) { escena.para(); }
      actual = d.semilla;
      escena = W.escena(lienzo, d.def, d.asa, d.combate, { vivo: true, semilla: d.semilla, yo: 1, emulado: 0, ronda: 'Round {r}', quieto: quieto() });
    }
    if (!on && escena) { escena.para(); escena = null; actual = null; }
  }
  new root.MutationObserver(sigue).observe(doc.body, { attributes: true, attributeFilter: ['data-battle', 'data-view'] });
  sigue();

  // An "×" on every panel that covers the map.
  Array.prototype.forEach.call(doc.querySelectorAll('.stage-sheet .sheet-head'), function (cab) {
    var x = doc.createElement('button');
    x.type = 'button'; x.className = 'sheet-x'; x.textContent = '×';
    x.setAttribute('aria-label', 'Close and return to the map');
    x.addEventListener('click', function () {
      if (cab.parentNode.id === 'sheet-battle' && H.battle.on()) { H.battle.back(); }
      var mapa = doc.getElementById('tab-map');
      if (mapa) { mapa.click(); }
    });
    cab.appendChild(x);
  });
})(window);
