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
