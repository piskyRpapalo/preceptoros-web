/* preceptoros.org · LA PORTADA ES EL JUEGO (mudanza firmada 2026-10-11, bloque 1).

   Cabezal arriba y UN SOLO panel debajo, a la maxima anchura util: el juego se monta DENTRO de
   `#juego-panel` (thegame.js), no encima de otra pagina. `#thegame/<pestana>` abre esa pestana;
   sin direccion, tu casa. Nada mas: ni red mas alla de este sitio, ni almacen, ni reloj. */
(function () {
  'use strict';
  var RUTA = /^#thegame(?:\/(\w+))?$/;
  function abre() {
    if (!window.TheGame) { return; }
    var m = RUTA.exec(location.hash);
    window.TheGame.abre(null, (m && m[1]) || 'casa');
  }
  window.addEventListener('hashchange', abre);
  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', abre); } else { abre(); }
})();
