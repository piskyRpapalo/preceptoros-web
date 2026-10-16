(function (raiz) {
  'use strict';
  function monta(boton) {
    var punto = document.createElement('span'); punto.className = 'killswitch-dot'; punto.setAttribute('aria-hidden', 'true'); boton.appendChild(punto);
    var modo = document.createElement('span'); modo.className = 'killswitch-shape'; modo.setAttribute('aria-hidden', 'true'); boton.appendChild(modo);
    return { punto: punto, modo: modo };
  }
  function crea(opts) {
    var m = monta(opts.boton), punto = m.punto, modo = m.modo;
    function pinta(on) {
      var SEM = raiz.AtlasSemantica || raiz.AtlasToon, BUS = SEM && SEM.SELLOS, hue = function (s) { return BUS ? BUS[s] : null; };
      var S = opts.sintesis;
      var estado = !on ? 'apagado' : (S && S.activa && S.activa(true) ? 'vivo' : 'necesita_gesto');
      var mapa = {
        apagado: { sello: 'ERROR', forma: '\u25a0', etiqueta: opts.T('kill_rojo', 'Off \u00b7 no audio in this browser') },
        necesita_gesto: { sello: 'STALE', forma: '\u25b2', etiqueta: opts.T('kill_amarillo', 'On \u00b7 waiting for your tap to start') },
        vivo: { sello: 'LIVE', forma: '\u25cf', etiqueta: opts.T('kill_verde', 'On \u00b7 sound is live') }
      };
      var e = mapa[estado] || mapa.apagado, h = hue(e.sello);
      punto.style.background = h == null ? 'transparent' : 'hsl(' + h + ' 70% 55%)';
      punto.classList.toggle('con-anillo', estado === 'vivo' && S && !S.receta);
      modo.textContent = e.forma;
      opts.boton.setAttribute('aria-label', e.etiqueta);
    }
    return { pinta: pinta };
  }
  var AtlasKillswitchDot = { crea: crea, monta: monta };
  if (typeof module === 'object' && module.exports) { module.exports = AtlasKillswitchDot; }
  else { raiz.AtlasKillswitchDot = AtlasKillswitchDot; }
})(typeof module === 'object' && module.exports ? this : (this || window));
