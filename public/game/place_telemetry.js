
(function (raiz) {
  'use strict';
  var TOPE_ARMADURA = 20, TOPE_COMBATES = 10;


  function vector(rc, lider) {
    var g = rc && rc.g > 0 ? Math.floor(rc.g) : 0, p = rc && rc.p > 0 ? Math.floor(rc.p) : 0, n = g + p;
    if (!n) { return null; }
    var arm = lider && lider.stats && typeof lider.stats.armadura === 'number' ? lider.stats.armadura : null;
    return { vida: Math.round(g * 1000 / n), carga: Math.min(TOPE_COMBATES, n) * 100,
             escudo: arm === null ? null : Math.min(1000, Math.round(arm * 1000 / TOPE_ARMADURA)), combates: n };
  }

  function color(v) {
    if (!v) { return { h: 0, s: 0, l: 62, a: 0.45, nd: true, css: 'hsla(0, 0%, 62%, 0.45)' }; }
    var h = Math.round(v.vida * 130 / 1000), s = 25 + Math.round(v.carga * 60 / 1000), l = 38 + Math.round((v.escudo || 0) * 30 / 1000);
    return { h: h, s: s, l: l, a: 1, nd: false, css: 'hsl(' + h + ', ' + s + '%, ' + l + '%)' };
  }

  function estado(v) {
    if (!v) { return 'NO_DATA (not fought on this device)'; }
    return 'win share ' + v.vida + '/1000 · ' + v.combates + ' fights · shield ' + (v.escudo === null ? 'NO_DATA (leader without armour stat)' : v.escudo + '/1000');
  }

  var AtlasLugarNablaC = { vector: vector, color: color, estado: estado, TOPE_ARMADURA: TOPE_ARMADURA };
  if (typeof module === 'object' && module.exports) { module.exports = AtlasLugarNablaC; } else { raiz.AtlasLugarNablaC = AtlasLugarNablaC; }
})(this);
