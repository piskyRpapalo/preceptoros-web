(function (raiz) {
  'use strict';
  var PARTES = [['caparazon', '◉', 'ondas', 'nucleo'], ['pinzas', '✦', 'ondas', 'army'], ['patas', '⸙', '', 'bosque'], ['ojos', '◈', 'faro', 'faro']];
  var DENTRO = { patas: '.atlas-dormias|.atlas-lema|.atlas-izq' };
  function rellena(p, v) { return String(p).replace(/\{(\w+)\}/g, function (m, k) { return k in v ? v[k] : m; }); }
    function medidas(s, army, nodos, T) {
    var ed = {};
    ed.nucleo = s ? { nivel: s.nivel_nucleo, medido: true, txt: rellena(T('st_nucleo'), { n: s.nivel_nucleo }) } : null;
    ed.bosque = s ? { nivel: Math.floor(s.recursos.biomasa / 2), medido: true, txt: rellena(T('st_bosque'), { b: s.recursos.biomasa, o: s.recursos.oxigeno }) } : null;
    ed.army = army != null ? { nivel: army, medido: true, txt: rellena(T('st_army'), { n: army }) } : null;
    ed.faro = nodos != null ? { nivel: nodos, medido: true, txt: rellena(T('st_faro'), { n: nodos }) } : null;
    return ed;
  }
  var AtlasCasaMedidas = { PARTES: PARTES, DENTRO: DENTRO, medidas: medidas };
  if (typeof module === 'object' && module.exports) { module.exports = AtlasCasaMedidas; } else { raiz.AtlasCasaMedidas = AtlasCasaMedidas; }
})(this);
