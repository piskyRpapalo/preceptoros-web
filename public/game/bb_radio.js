(function (raiz) {
  'use strict';
  // Radio del Estado · fase 1 (Desk 2026-10-28): el sonido sale del MISMO frame que la forma y la tabla.
  // Ecuaciones:
  //   tick t = 1/60 s · muestras por tick = 150 (SR = 9000) · sin azar ni reloj.
  //   pulso(sello, t) = pulso_hz > 0 ? 0.5 + 0.5·sin(2π·pulso_hz·t) : 1   (pulso_hz fisico, en Hz; la MISMA f(t) para audio y pulso)
  //   melodia: una nota por digito de la foto del frame (digitos de round(|a_k|·1000)), 8 notas pentatonicas desde 220 Hz.
  //   NO_DATA (y todo sello sin visual) = silencio: ni muestras ni pulso. Un sello desconocido no suena.
  // Fase 2 (pendiente): la melodia la da el estado del juego. No se implementa aqui.
  var SR = 9000, TICK_HZ = 60, MUESTRAS_TICK = SR / TICK_HZ;     // 150
  var NOTA_TICKS = 15;                                           // 0.25 s por nota
  var RATIOS = [1, 9 / 8, 5 / 4, 3 / 2, 5 / 3, 2, 9 / 4, 5 / 2]; // pentatonica mayor de 8 notas
  var BASE_HZ = 220;

  var SEM = (typeof module === 'object' && module.exports) ? require('./tabla_semantica.js') : raiz.AtlasSemantica;

  // Pulso: frecuencia FISICA (DERIVADOS.pulso_hz de tabla_semantica.js, en Hz). Sello sin fisica -> 0 (silencio).
  function pulso(sello, t) {
    var d = SEM.de(sello);
    if (!d) { return 0; }
    if (!(d.pulso_hz > 0)) { return 1; }
    return 0.5 + 0.5 * Math.sin(2 * Math.PI * d.pulso_hz * t);
  }

  function digitos(terminos) {
    var out = [];
    for (var i = 0; i < terminos.length; i++) {
      var s = String(Math.round(Math.abs(terminos[i][1]) * 1000));
      for (var j = 0; j < s.length; j++) { out.push(Number(s.charAt(j))); }
    }
    return out.slice(0, 16);
  }

  function notas(terminos) {
    return digitos(terminos).map(function (d) {
      var idx = d % RATIOS.length, oct = d % 3;
      return { idx: idx, hz: BASE_HZ * RATIOS[idx] * Math.pow(2, oct) };
    });
  }

  // PCM de un frame: Float32Array. Sello sin visual o frame sin notas -> silencio (longitud 0).
  function pcm(frame) {
    var v = SEM.visual(frame.sello);
    if (!v || frame.sello === 'NO_DATA') { return new Float32Array(0); }
    var lista = notas(frame.terminos);
    if (!lista.length) { return new Float32Array(0); }
    var total = lista.length * NOTA_TICKS * MUESTRAS_TICK, out = new Float32Array(total);
    for (var n = 0; n < total; n++) {
      var tick = Math.floor(n / MUESTRAS_TICK), t = tick / TICK_HZ;
      var nota = lista[Math.floor(tick / NOTA_TICKS)];
      out[n] = 0.3 * pulso(frame.sello, t) * Math.sin(2 * Math.PI * nota.hz * (n / SR));
    }
    return out;
  }

  // Gemelo estatico (NO CUE IS MOTION-ONLY): cada estado tiene texto y forma sin movimiento.
  var GEMELO = {
    LIVE: { texto: 'LIVE', forma: 'solid' },
    PROPUESTA: { texto: 'PROPOSED · PENDING SIGNATURE', forma: 'dashed' },
    FIRMADO: { texto: 'SIGNED', forma: 'double' },
    ERROR: { texto: 'ERROR', forma: 'jagged' },
    NO_DATA: { texto: 'NO DATA', forma: 'empty' },
    SIMULATED: { texto: 'SIMULATED', forma: 'dotted' },
    STALE: { texto: 'STALE', forma: 'faded' }
  };
  function gemelo(sello) {
    if (!GEMELO.hasOwnProperty(sello)) { return null; }
    var g = GEMELO[sello];
    return { sello: sello, hue: SEM.hueDe(sello), texto: g.texto, forma: g.forma, movimiento: !!(SEM.de(sello) && SEM.de(sello).pulso_hz > 0) };
  }

  var BBRadio = { pcm: pcm, pulso: pulso, notas: notas, gemelo: gemelo, SR: SR, TICK_HZ: TICK_HZ,
                  MUESTRAS_TICK: MUESTRAS_TICK, NOTA_TICKS: NOTA_TICKS };
  if (typeof module === 'object' && module.exports) { module.exports = BBRadio; }
  else { raiz.AtlasBBRadio = BBRadio; }
})(typeof module === 'object' && module.exports ? this : (this || window));
