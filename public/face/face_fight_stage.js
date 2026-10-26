// P3 (2026-10-26, Sovereign decree): combat fills the whole map area, inside its own panel. The
// fight draws on THIS canvas, to the right of the battle texts; the world map underneath is never
// painted by combat. Every panel that covers the map gets an "×" that closes it and returns to the
// map (a running fight is withdrawn first, as "Back to the Army" does).
(function (root) {
  'use strict';
  var doc = root.document, H = root.PreceptorFaceHooks, Bt = root.PreceptorBattle;
  if (!H || !Bt || !H.battle || !H.battle.paint) { return; }
  var F = Bt.field, ANCHO = 420, ALTO = 300, raf = 0;
  var fight = doc.querySelector('#sheet-battle .fight');
  if (!fight) { return; }

  var lienzo = doc.createElement('canvas');
  lienzo.id = 'b-stage'; lienzo.className = 'fight-stage';
  lienzo.setAttribute('role', 'img'); lienzo.setAttribute('aria-label', 'The battle, drawn in its own panel; the map underneath stays clean.');
  fight.appendChild(lienzo);

  // The battle field is a fixed box of world units around Bt.field; it is fitted into the canvas.
  function pinta() {
    raf = 0;
    if (!H.battle.on() || lienzo.offsetParent === null) { return; }
    var dpr = Math.min(2, root.devicePixelRatio || 1), w = Math.max(200, lienzo.clientWidth), h = Math.max(160, lienzo.clientHeight);
    if (lienzo.width !== Math.round(w * dpr)) { lienzo.width = Math.round(w * dpr); }
    if (lienzo.height !== Math.round(h * dpr)) { lienzo.height = Math.round(h * dpr); }
    var g = lienzo.getContext('2d'), s = Math.min(w / ANCHO, h / ALTO), ox = (w - ANCHO * s) / 2, oy = (h - ALTO * s) / 2;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, w, h);
    H.battle.paint(g, function (x, y) { return [ox + (x - (F[0] - ANCHO / 2)) * s, oy + (y - (F[1] - ALTO / 2)) * s]; }, s);
    raf = root.requestAnimationFrame(pinta);
  }
  function sigue() { if (!raf && H.battle.on()) { raf = root.requestAnimationFrame(pinta); } }
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
