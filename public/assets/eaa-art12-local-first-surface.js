/* preceptoros.org · LA PORTADA ES EL JUEGO (mudanza firmada 2026-10-11, bloque 1).

   Cabezal arriba y UN SOLO panel debajo, a la maxima anchura util: el juego se monta DENTRO de
   `#juego-panel` (thegame.js), no encima de otra pagina. `#thegame/<pestana>` abre esa pestana.
   Sin direccion, al llegar, EL DESCENSO (FIRMO 2026-10-17): la caida de la Estatua en el mismo
   panel, y DESPERTAR abre tu casa. Nada mas: ni red mas alla de este sitio, ni almacen, ni reloj. */
(function () {
  'use strict';
  var RUTA = /^#thegame(?:\/(\w+))?$/;
  function abre(llegada) {
    if (!window.TheGame) { return; }
    var m = RUTA.exec(location.hash);
    if (llegada === true && !m && window.TheGame.descenso) { window.TheGame.descenso(); return; }
    if (m && m[1] === 'codex' && window.TheGame.codex && window.TheGame.codex()) { return; }
    window.TheGame.abre(null, (m && m[1]) || 'casa');
  }
  window.addEventListener('hashchange', function () { abre(false); });
  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', function () { abre(true); }); } else { abre(true); }
})();
