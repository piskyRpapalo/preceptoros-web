(function (raiz) {
  'use strict';

  var ACCIONES = ['esperar', 'recoger', 'reparar', 'aplazar', 'bajar_a', 'mover'];
  var BANDAS = ['arrecife', 'ruinas', 'bosque', 'nucleo'];
  var DIRS = ['izq', 'arr', 'aba', 'der', 'casa', 'faro'];

  var ETIQUETAS = ['0-50', '50-150', '150-300', '300+'];

  function accion(a, banda) {
    var x = { esquema: 'atlas.accion/1', accion: a, origen: 'piloto_base' };
    if (banda) { x.banda = banda; }
    return x;
  }

  function decide(ins, c) {
    if (!ins || ins.esquema !== 'atlas.instantanea/1' || !c) { return null; }
    var r = ins.recursos || {}, g = ins.grieta || {};
    var aqui = BANDAS[ETIQUETAS.indexOf(ins.profundidad)];
    if (!aqui) { return null; }
    if (g.abierta && r.cobre >= c.COBRE_REPARAR) { return accion('reparar'); }
    if (ins.pendiente_ciclos > 0) { return accion('recoger'); }
    if (aqui !== 'arrecife') {
      if (g.abierta) { return accion('bajar_a', 'arrecife'); }
      if (r.oxigeno * 10 < c.O2_MAX) { return accion('bajar_a', 'arrecife'); }
      return accion('esperar');
    }
    if (!g.abierta && r.oxigeno * 10 >= c.O2_MAX * 9) {
      var hondo = (ins.niveles || {}).ingenieria >= c.INGENIERIA_NUCLEO ? 'nucleo' : 'bosque';
      return accion('bajar_a', hondo);
    }
    return accion('esperar');
  }

  function valida(a) {
    if (!a || a.esquema !== 'atlas.accion/1') { return false; }
    if (ACCIONES.indexOf(a.accion) < 0) { return false; }
    if (a.accion === 'bajar_a') { return BANDAS.indexOf(a.banda) >= 0 && !('dir' in a); }
    if (a.accion === 'mover') { return DIRS.indexOf(a.dir) >= 0 && !('banda' in a); }
    return !('banda' in a) && !('dir' in a);
  }

  var AtlasPiloto = { ACCIONES: ACCIONES, BANDAS: BANDAS, DIRS: DIRS, decide: decide, valida: valida };
  if (typeof module === 'object' && module.exports) { module.exports = AtlasPiloto; }
  else { raiz.AtlasPiloto = AtlasPiloto; }
})(this);
