
(function (raiz) {
  'use strict';


  function fnv1a(texto) {
    var h = 0x811c9dc5;
    for (var i = 0; i < texto.length; i++) { h ^= texto.charCodeAt(i); h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0; }
    return h >>> 0;
  }
  function frecuenciaBase(id) {
    var h = fnv1a(String(id || ''));
    return Math.round((220 + (h % 440 / 440) * 440) * 100) / 100;
  }

  function vozDeForma(hue) {
    if (!Number.isFinite(hue)) { return null; }
    var h = ((hue % 360) + 360) % 360;
    return Math.round((220 + (h / 360) * 660) * 100) / 100;
  }


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
