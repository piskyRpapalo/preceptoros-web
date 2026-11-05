(function (raiz) {
  'use strict';

  // Tutorial «De Onda a Nodo Soberano» (VT5): maquina de fases F0-F3. PURO: ni DOM, ni red, ni reloj, ni azar.
  // Cada transicion la dispara un evento medido; ningun paso se salta, y la red solo se abre cuando el humano cruza.

  var PUERTAS = ['directo', 'niebla'];
  var RECORRIDO = {
    F1: ['pulso', 'disipa', 'arena101', 'recompensa'],
    F2: ['campamento', 'primer_edificio'],
    F3: ['cartas', 'salto']
  };

  function inicia() {
    return { fase: 'F0', paso: 'puerta', red: false, eventos: [], huevos: 0, primer_edificio: null };
  }

  // F0: doble puerta. «directo» lleva a las cartas (F3); «niebla» empieza la Onda (F1).
  function elige(st, puerta) {
    if (st.fase !== 'F0') { return { ok: false, motivo: 'la puerta solo existe en F0' }; }
    if (PUERTAS.indexOf(puerta) < 0) { return { ok: false, motivo: 'puerta desconocida: ' + puerta }; }
    var n = Object.assign({}, st, { eventos: st.eventos.slice() });
    if (puerta === 'niebla') { n.fase = 'F1'; n.paso = 'pulso'; }
    else { n.fase = 'F3'; n.paso = 'cartas'; }
    n.eventos.push('puerta:' + puerta);
    return { ok: true, estado: n };
  }

  // Un evento solo vale en su paso. Los datos de recompensa y del primer edificio se miden: si no hay, NO_DATA con causa.
  function evento(st, nombre, datos) {
    datos = datos || {};
    var esperado = st.paso;
    if (nombre === 'cruza') {
      if (st.fase !== 'F3' || st.paso !== 'salto') { return { ok: false, motivo: 'cruzar solo en F3 · salto' }; }
      if (datos.humano !== true) { return { ok: false, motivo: 'la red solo la abre el humano (cruza sin humano)' }; }
      var c = Object.assign({}, st, { red: true, paso: 'cruzado', eventos: st.eventos.concat(['cruza']) });
      return { ok: true, estado: c };
    }
    if (nombre !== esperado) { return { ok: false, motivo: 'evento ' + nombre + ' fuera de orden (toca ' + esperado + ')' }; }
    var n = Object.assign({}, st, { eventos: st.eventos.concat([nombre]) });
    if (nombre === 'recompensa') {
      if (!Number.isSafeInteger(datos.huevos) || datos.huevos !== 3) { return { ok: false, motivo: 'recompensa: 3 huevos medidos, no ' + datos.huevos }; }
      n.huevos = 3;
    }
    if (nombre === 'disipa') {
      n.primer_edificio = datos.dato === 'medido' ? { dato: 'medido', etiqueta: datos.etiqueta } : { dato: 'NO_DATA', causa: datos.causa || 'sin medida' };
    }
    if (nombre === 'primer_edificio' && (!datos.etiqueta || typeof datos.etiqueta !== 'string')) {
      return { ok: false, motivo: 'primer edificio sin etiqueta medida' };
    }
    if (nombre === 'primer_edificio') { n.primer_edificio = { dato: 'medido', etiqueta: datos.etiqueta }; }
    var sig = siguiente(n.fase, nombre);
    n.fase = sig.fase; n.paso = sig.paso;
    return { ok: true, estado: n };
  }

  function siguiente(fase, paso) {
    var lista = RECORRIDO[fase], i = lista.indexOf(paso);
    if (i + 1 < lista.length) { return { fase: fase, paso: lista[i + 1] }; }
    if (fase === 'F1') { return { fase: 'F2', paso: 'campamento' }; }
    if (fase === 'F2') { return { fase: 'F3', paso: 'cartas' }; }
    return { fase: 'F3', paso: 'salto' };
  }

  // La red no puede abrirse sin el cruce del humano, en ningun paso.
  function invariantes(st) {
    if (st.red && !(st.fase === 'F3' && st.paso === 'cruzado')) { return 'red abierta fuera de F3 · cruzado'; }
    return null;
  }

  var AtlasTutorial = { PUERTAS: PUERTAS, RECORRIDO: RECORRIDO, inicia: inicia, elige: elige, evento: evento, invariantes: invariantes };
  if (typeof module === 'object' && module.exports) { module.exports = AtlasTutorial; }
  else { raiz.AtlasTutorial = AtlasTutorial; }
})(this);
