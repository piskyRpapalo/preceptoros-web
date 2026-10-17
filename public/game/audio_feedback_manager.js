
(function (raiz) {
  'use strict';
  var CLAVES = ['eventos', 'habilidad'];
  var ESTADOS = ['HABILITADO', 'DESHABILITADO', 'SONADO', 'INACTIVO', 'NO_DATA', 'RECHAZADO'];
  var activo = false;

  function salida(estado, frecuencia, causa) {
    var conCausa = estado === 'NO_DATA' || estado === 'RECHAZADO' || estado === 'INACTIVO';
    var frecuenciaValida = typeof frecuencia === 'number' && Number.isFinite(frecuencia) && frecuencia > 0;
    if (ESTADOS.indexOf(estado) < 0) { return { estado: 'NO_DATA', frecuencia_hz: null, causa: 'estado interno inválido' }; }
    if (estado === 'SONADO' && frecuenciaValida && causa == null) { return { estado: estado, frecuencia_hz: frecuencia, causa: null }; }
    if ((estado === 'HABILITADO' || estado === 'DESHABILITADO') && frecuencia == null && causa == null) {
      return { estado: estado, frecuencia_hz: null, causa: null };
    }
    if (conCausa && frecuencia == null && typeof causa === 'string' && causa.length) {
      return { estado: estado, frecuencia_hz: null, causa: causa };
    }
    return { estado: 'NO_DATA', frecuencia_hz: null, causa: 'salida interna fuera del contrato' };
  }

  function validar(entrada) {
    if (!entrada || typeof entrada !== 'object' || Array.isArray(entrada)) { return 'entrada debe ser objeto'; }
    var claves = Object.getOwnPropertyNames(entrada);
    if (Object.getOwnPropertySymbols && Object.getOwnPropertySymbols(entrada).length) {
      return 'entrada no admite claves symbol';
    }
    if (claves.length !== CLAVES.length || CLAVES.some(function (k) { return claves.indexOf(k) < 0; })) {
      return 'entrada requiere exactamente habilidad y eventos';
    }
    if (entrada.habilidad !== 'swim' && entrada.habilidad !== 'reach') { return 'habilidad fuera del enum'; }
    if (!Number.isInteger(entrada.eventos) || entrada.eventos < 1 || entrada.eventos > 400) {
      return 'eventos debe ser entero entre 1 y 400';
    }
    return null;
  }

  function habilitar() {
    var S = raiz.AtlasSintesis;
    if (!S || typeof S.activa !== 'function') { return salida('NO_DATA', null, 'AtlasSintesis no disponible'); }
    try {
      activo = S.activa(true) === true;
    } catch (e) {
      activo = false;
    }
    return activo ? salida('HABILITADO') : salida('NO_DATA', null, 'Web Audio no disponible');
  }

  function deshabilitar() {
    activo = false;
    return salida('DESHABILITADO');
  }

  function procesar(entrada) {
    var causa = validar(entrada);
    if (causa) { return salida('RECHAZADO', null, causa); }
    if (!activo) { return salida('INACTIVO', null, 'opt-in apagado'); }
    var R = raiz.AtlasRadio, nivel = Math.floor(Math.sqrt(entrada.eventos));
    if (!R || typeof R.tocaNota !== 'function') { return salida('NO_DATA', null, 'AtlasRadio.tocaNota no disponible'); }
    var S = raiz.AtlasSintesis, contexto = S && typeof S.contexto === 'function' ? S.contexto() : null;
    if (!contexto || contexto.state !== 'running') { return salida('NO_DATA', null, 'AudioContext no está en estado running'); }
    try {
      var grado = nivel + (entrada.habilidad === 'reach' ? 2 : 0);
      var receta = R.tocaNota(grado, Math.floor(nivel / 5));
      if (!receta || !Number.isFinite(receta.portadora)) { return salida('NO_DATA', null, 'la síntesis rechazó la nota'); }
      return salida('SONADO', receta.portadora);
    } catch (e) {
      return salida('NO_DATA', null, 'falló la síntesis local');
    }
  }

  var API = { habilitar: habilitar, deshabilitar: deshabilitar, procesar: procesar,
              activo: function () { return activo; } };
  if (typeof module === 'object' && module.exports) { module.exports = API; }
  else { raiz.AudioFeedbackManager = API; }
})(this);
