/* preceptoros.org · theGame · PIEZA (c) FIRMADA (PR #106, Ola 0) · LA TARJETA DE NODO CANTADA.
   W3 (canal acústico, ideas14): Web Audio PURA — OscillatorNode+GainNode vía
   AtlasSintesis; CERO archivos de audio, cero assets, cero red.
   VOZ=FORMA (M14, medido): el espectro que dibuja cada forma ES su firma
   sonora. f_base = 220 + (hue/360)·660 (MOCKUP_MVP).
   W1 onda_diccionario (spec firmada, sin construir — receta aplicada aquí):
   hash FNV-1a del ID del término → frecuencia base 220–660 Hz.
   TABLA SEMÁNTICA (MEDIDA, crab_render_hd.js AtlasToon.SELLOS): LIVE 120 ·
   PROPUESTA 45 · FIRMADO 270 · ERROR 0 · NO_DATA 240 · SIMULATED 30 ·
   STALE 60. USADA, no reinventada: el sello del edificio elige su grado
   pentatónico; NO_DATA = silencio visual con causa visible.
   M17 respira al beat: 660 Hz bajado por octavas a 5,16 Hz — referencia de
   tempo si la tarjeta respira (aqui solo se declara, no se impone).
   REDUCED-MOTION / corte limpio: NADA suena sin gesto. La melodía se
   DERIVA (determinista: quien lee el mismo nodo, oye la misma tarjeta),
   pero SOLO suena tras un gesto explícito del visitante (opt-in, igual que
   audio_feedback_manager). Lo medido suena, lo no medido calla con causa. */
(function (raiz) {
  'use strict';

  /* W1: FNV-1a del id del término → frecuencia base 220–660 Hz. Puro. */
  function fnv1a(texto) {
    var h = 0x811c9dc5;
    for (var i = 0; i < texto.length; i++) { h ^= texto.charCodeAt(i); h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0; }
    return h >>> 0;
  }
  function frecuenciaBase(id) {
    var h = fnv1a(String(id || ''));
    return Math.round((220 + (h % 440 / 440) * 440) * 100) / 100;
  }
  /* VOZ=FORMA (M14): f_base = 220 + (hue/360)·660 cuando el término trae hue. */
  function vozDeForma(hue) {
    if (!Number.isFinite(hue)) { return null; }
    var h = ((hue % 360) + 360) % 360;
    return Math.round((220 + (h / 360) * 660) * 100) / 100;
  }

  /* La melodía de una tarjeta: tres notas derivadas de la tabla semántica
     (AtlasToon.SELLOS, medido) y la base FNV/hue. DETERMINISTA: mismo
     término y sello = mismas frecuencias, en el mismo orden. */
  function melodía(termino) {
    var T = (typeof module === 'object' && module.exports) ? require('./tabla_semantica.js') : (raiz.AtlasSemantica || raiz.AtlasToon);
    if (!T || !T.SELLOS) { return { estado: 'NO_DATA', causa: 'AtlasToon.SELLOS no disponible: la tabla semántica manda, no se reinventa' }; }
    var sello = termino && termino.sello;
    if (sello == null || !T.SELLOS.hasOwnProperty(sello)) {
      return { estado: 'NO_DATA', causa: 'sello "' + sello + '" sin frecuencia en la tabla semántica: lo no medido calla' };
    }
    var base = vozDeForma(termino.hue) || frecuenciaBase(termino.id);
    var sem = T.SELLOS[sello];
    var R = (typeof module === 'object' && module.exports) ? require('./aiact-art50-state-radio.js') : raiz.AtlasRadio;
    if (!R || typeof R.nota !== 'function') { return { estado: 'NO_DATA', causa: 'AtlasRadio.nota no disponible' }; }
    var idx = sem % 5;
    var notas = [R.nota(idx, Math.floor(sem / 220) % 3), R.nota(idx + 2, Math.floor(base / 440) % 3), R.nota(idx + 4, 1)];
    return { estado: 'MEDIDO', base_hz: base, sello: sello, semantico_hz: sem, notas: notas };
  }

  /* SOLO con gesto: canta la melodía si el visitante lo pide y el audio
     está habilitado. Sin gesto, sin sonido (reduced-motion: corte limpio). */
  function canta(m) {
    if (!m || m.estado !== 'MEDIDO') { return { estado: 'NO_DATA', causa: m ? m.causa : 'sin melodía' }; }
    var S = raiz.AtlasSintesis;
    if (!S || typeof S.suena !== 'function' || (S.activa && S.activa() !== true)) {
      return { estado: 'NO_DATA', causa: 'Web Audio no disponible o sin opt-in del visitante' };
    }
    try {
      m.notas.forEach(function (f, i) {
        setTimeout(function () { S.suena({ tipo: 'radio', portadora: f, moduladora: Math.round(f * 2), indice: 35, dur: 0.28, gan: 0.07 }); }, i * 300);
      });
      return { estado: 'SONADO', notas: m.notas, causa: null };
    } catch (e) {
      return { estado: 'NO_DATA', causa: 'síntesis falló: ' + (e && e.message ? e.message : e) };
    }
  }

  var AtlasTarjetaCantada = { melodía: melodía, canta: canta, frecuenciaBase: frecuenciaBase, vozDeForma: vozDeForma };
  if (typeof module === 'object' && module.exports) { module.exports = AtlasTarjetaCantada; }
  else { raiz.AtlasTarjetaCantada = AtlasTarjetaCantada; }
})(typeof module === 'object' && module.exports ? this : (this || window));
