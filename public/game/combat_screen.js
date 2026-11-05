// Combat as its own screen (P2, 2026-10-26). A fight no longer runs on the map page: entering
// combat pushes its own route (#thegame/battle) and turns the page into the battle screen (the map,
// the menu and the drawer are not shown, and the map stops painting). Leaving, by the screen's own
// "back to the map" button, Escape, or the browser's Back, returns to the map and ends the fight's
// lifecycle exactly once (the caller settles and stops it in `alSalir`).
// The environment is injected so node can check the lifecycle without a browser.
(function (raiz) {
  'use strict';
  var RUTA = '#thegame/battle', MAPA = '#thegame/map', CLASE = 'con-combate';

  function crea(env) {
    var activo = null, empujado = false;
    function raizHtml() { return env.doc.documentElement; }

    function entra(op) {
      if (activo) {
        // A new fight while one is on screen: the old one is settled first; the screen stays.
        var viejo = activo; activo = null;
        if (viejo.alSalir) { viejo.alSalir(); }
        activo = { alSalir: op && op.alSalir };
        return;
      }
      activo = { alSalir: op && op.alSalir };
      raizHtml().classList.add(CLASE);
      if (env.loc.hash !== RUTA) { env.hist.pushState(null, '', RUTA); empujado = true; } else { empujado = false; }
      env.ve('batalla');
    }

    function sale() {
      if (!activo) { return; }
      var a = activo; activo = null;
      raizHtml().classList.remove(CLASE);
      if (a.alSalir) { a.alSalir(); }
      env.ve(null);
      if (env.loc.hash === RUTA) {
        if (empujado) { env.hist.back(); } else { env.hist.replaceState(null, '', MAPA); }
      }
      empujado = false;
    }

    // The browser's Back (or any hash change) leaves the battle route: leave the screen too.
    function alCambiarRuta() { if (activo && env.loc.hash !== RUTA) { empujado = false; sale(); } }
    // The sheet was closed by its own button, Escape or a tap outside: same exit.
    function alOcultarse(hoja) { if (activo && hoja && hoja.hidden) { sale(); } }
    // Opened on the battle route with no fight on screen: there is nothing to show, go to the map.
    function alCargar() { if (!activo && env.loc.hash === RUTA) { env.hist.replaceState(null, '', MAPA); } }

    return { entra: entra, sale: sale, alCambiarRuta: alCambiarRuta, alOcultarse: alOcultarse, alCargar: alCargar,
             activo: function () { return !!activo; } };
  }

  var API = { RUTA: RUTA, MAPA: MAPA, CLASE: CLASE, crea: crea };
  if (typeof module === 'object' && module.exports) { module.exports = API; return; }

  var w = raiz, pantalla = crea({ doc: w.document, loc: w.location, hist: w.history,
    ve: function (id) { if (w.TheGame && w.TheGame.ve) { w.TheGame.ve(id); } } });
  w.addEventListener('hashchange', pantalla.alCambiarRuta);
  w.addEventListener('popstate', pantalla.alCambiarRuta);
  function vigila() {
    var hoja = w.document.getElementById('thegame-batalla');
    if (!hoja) { return false; }
    new w.MutationObserver(function () { pantalla.alOcultarse(hoja); }).observe(hoja, { attributes: true, attributeFilter: ['hidden'] });
    return true;
  }
  if (!vigila()) { w.document.addEventListener('DOMContentLoaded', vigila); }
  pantalla.alCargar();
  w.AtlasCombatScreen = { RUTA: RUTA, entra: pantalla.entra, sale: pantalla.sale, activo: pantalla.activo };
})(typeof module === 'object' && module.exports ? this : (this || window));
