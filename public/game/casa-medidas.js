/* preceptoros.org · theGame · LAS PARTES DEL CANGREJO Y SU CIFRA MEDIDA (sale de `home_buildings.js` en U0, «el
   mapa unico», 2026-10-11: la lista UNA de las partes, la que leeran la casa, el riel lateral y quien mire el DOM).

   PARTES, en su orden de siempre: caparazon (Nucleo), pinzas (Army), patas (Bosque), ojos (Faro). Cada una:
   [id, icono, a donde lleva, la cifra que la explica]. «a donde»: 'taller' (la hoja del Taller), 'faro' (la
   camara a Hexelion, accion `mover faro` del piloto: una sola lista de destinos) o '' (su DENTRO, aqui). DENTRO dice que se muda al entrar en una parte que no lleva a
   otra pestana. `medidas` es PURA: de la instantanea, el tamano del Army y los nodos medidos sale cada cifra; lo que
   no se midio es null (NO_DATA), nunca un cero inventado. Sin DOM, sin red, sin azar: corre igual en node. */
(function (raiz) {
  'use strict';
  var PARTES = [['caparazon', '◉', 'taller', 'nucleo'], ['pinzas', '✦', 'taller', 'army'], ['patas', '⸙', '', 'bosque'], ['ojos', '◈', 'faro', 'faro']];
  var DENTRO = { patas: '.atlas-dormias|.atlas-lema|.atlas-mapa|.atlas-izq' };
  function rellena(p, v) { return String(p).replace(/\{(\w+)\}/g, function (m, k) { return k in v ? v[k] : m; }); }
  /* s: atlas.instantanea/1 o null; army: tropas del Army o null; nodos: nodos con alguna medida MEDIDO o null. */
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
