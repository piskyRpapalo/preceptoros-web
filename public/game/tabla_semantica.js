
(function (raiz) {
  'use strict';
  var HUE = { LIVE: 120, PROPUESTA: 45, FIRMADO: 270, ERROR: 0, NO_DATA: 240, SIMULATED: 30, STALE: 60 };
  var SAT = 70, LUZ_BASE = 55;


  var DERIVADOS = {
    LIVE:      { flujo: 0.0006,  pulso_hz: 5.16, escala: 1.0,  feedback: 'flow' },
    PROPUESTA: { flujo: 0.0012,  pulso_hz: 2.00, escala: 0.96, feedback: 'pulse-sync' },
    FIRMADO:   { flujo: 0.0004,  pulso_hz: 1.00, escala: 1.08, feedback: 'bloom' },
    ERROR:     { flujo: 0.0030,  pulso_hz: 8.00, escala: 0.92, feedback: 'distort' },
    NO_DATA:   { flujo: 0,        pulso_hz: 0,    escala: 1.0,  feedback: 'silent-field' },
    SIMULATED: { flujo: 0.0008,  pulso_hz: 3.00, escala: 0.98, feedback: 'sim' },
    STALE:     { flujo: 0.0002,  pulso_hz: 0.50, escala: 0.90, feedback: 'fade' }
  };


  function congelada() {
    var t = {};
    Object.keys(HUE).forEach(function (k) { t[k] = HUE[k]; });
    return Object.freeze ? Object.freeze(t) : t;
  }
  var TABLA = congelada();


  function bandas(h, s, l) {
    function c(L) { return 'hsl(' + h + ' ' + s + '% ' + Math.max(4, Math.min(94, L)) + '%)'; }
    return { h: h, brillo: c(l + 16), base: c(l), sombra: c(l - 20), contorno: c(l - 44) };
  }

  function de(sello) {
    if (!HUE.hasOwnProperty(sello)) { return null; }
    var d = DERIVADOS[sello];
    return Object.freeze ? Object.freeze({
      sello: sello, hue: HUE[sello], bandas: bandas(HUE[sello], SAT, LUZ_BASE),
      flujo: d.flujo, pulso_hz: d.pulso_hz, escala: d.escala, feedback: d.feedback
    }) : { sello: sello, hue: HUE[sello], bandas: bandas(HUE[sello], SAT, LUZ_BASE),
      flujo: d.flujo, pulso_hz: d.pulso_hz, escala: d.escala, feedback: d.feedback };
  }

  function hueDe(sello) { return HUE.hasOwnProperty(sello) ? HUE[sello] : null; }

  // EXTENSION VISUAL (Desk 2026-10-28, canon registrado en docs/canon-bubble-math.md). Aditiva: los siete
  // estados de arriba no cambian. El sello desconocido no tiene visual: visual(sello) devuelve null.
  // PROPUESTA es el nombre fisico; el mockup lo llama PROPUESTA_PENDIENTE_FIRMA (mismo hue, 45).
  var VISUAL = {
    LIVE: {"baseHue": 120, "saturation": 0.8, "lightness": 0.6, "rotationSpeed": 0.001, "scaleFactor": 1, "waveAmplitude": 0.3, "waveFrequency": 0.005, "fourierTerms": [{"a": 1, "k": 1, "phi": 0}, {"a": 0.5, "k": 2, "phi": 1.5707963267948966}, {"a": 0.3, "k": 3, "phi": 3.141592653589793}], "feedbackAlpha": 0.95, "feedbackScale": 1.003, "feedbackRotation": 0.0005, "pulseActive": false, "pulseFrequency": 0},
    PROPUESTA: {"baseHue": 45, "saturation": 0.9, "lightness": 0.7, "rotationSpeed": 0.005, "scaleFactor": 1.05, "waveAmplitude": 0.5, "waveFrequency": 0.01, "fourierTerms": [{"a": 1, "k": 1, "phi": 0}, {"a": 0.7, "k": 2, "phi": 2.0943951023931953}, {"a": 0.4, "k": 4, "phi": 1.0471975511965976}, {"a": 0.2, "k": 6, "phi": 0.7853981633974483}], "feedbackAlpha": 0.92, "feedbackScale": 1.005, "feedbackRotation": 0.001, "pulseActive": true, "pulseFrequency": 0.02},
    FIRMADO: {"baseHue": 270, "saturation": 0.9, "lightness": 0.8, "rotationSpeed": 0.01, "scaleFactor": 1.15, "waveAmplitude": 0.7, "waveFrequency": 0.015, "fourierTerms": [{"a": 1, "k": 1, "phi": 0}, {"a": 0.8, "k": 2, "phi": 1.5707963267948966}, {"a": 0.6, "k": 3, "phi": 3.141592653589793}, {"a": 0.4, "k": 4, "phi": 4.71238898038469}, {"a": 0.3, "k": 5, "phi": 2.0943951023931953}], "feedbackAlpha": 0.88, "feedbackScale": 1.008, "feedbackRotation": 0.002, "pulseActive": true, "pulseFrequency": 0.03},
    ERROR: {"baseHue": 0, "saturation": 1, "lightness": 0.5, "rotationSpeed": 0.02, "scaleFactor": 0.95, "waveAmplitude": 0.8, "waveFrequency": 0.025, "fourierTerms": [{"a": 1, "k": 1, "phi": 0}, {"a": 0.9, "k": 3, "phi": 3.141592653589793}, {"a": 0.7, "k": 5, "phi": 1.5707963267948966}, {"a": 0.5, "k": 7, "phi": 4.71238898038469}], "feedbackAlpha": 0.85, "feedbackScale": 0.997, "feedbackRotation": 0.005, "pulseActive": true, "pulseFrequency": 0.05},
    NO_DATA: {"baseHue": 240, "saturation": 0.3, "lightness": 0.4, "rotationSpeed": 0, "scaleFactor": 1, "waveAmplitude": 0, "waveFrequency": 0, "fourierTerms": [{"a": 1, "k": 1, "phi": 0}], "feedbackAlpha": 0.98, "feedbackScale": 1, "feedbackRotation": 0, "pulseActive": false, "pulseFrequency": 0},
    SIMULATED: {"baseHue": 30, "saturation": 0.7, "lightness": 0.6, "rotationSpeed": 0.002, "scaleFactor": 1, "waveAmplitude": 0.2, "waveFrequency": 0.008, "fourierTerms": [{"a": 1, "k": 1, "phi": 0}, {"a": 0.4, "k": 2, "phi": 2.0943951023931953}], "feedbackAlpha": 0.94, "feedbackScale": 1.002, "feedbackRotation": 0.0008, "pulseActive": false, "pulseFrequency": 0},
    STALE: {"baseHue": 60, "saturation": 0.5, "lightness": 0.5, "rotationSpeed": 0.0005, "scaleFactor": 0.98, "waveAmplitude": 0.1, "waveFrequency": 0.003, "fourierTerms": [{"a": 1, "k": 1, "phi": 0}, {"a": 0.2, "k": 3, "phi": 3.141592653589793}], "feedbackAlpha": 0.96, "feedbackScale": 0.999, "feedbackRotation": 0.0002, "pulseActive": false, "pulseFrequency": 0}
  };
  function visual(sello) { return VISUAL.hasOwnProperty(sello) ? VISUAL[sello] : null; }

  var AtlasSemantica = { TABLA: TABLA, SELLOS: TABLA, de: de, hueDe: hueDe,
                          bandas: bandas, SAT: SAT, LUZ: LUZ_BASE, VISUAL: VISUAL, visual: visual };
  if (typeof module === 'object' && module.exports) { module.exports = AtlasSemantica; }
  else { raiz.AtlasSemantica = AtlasSemantica; }
})(typeof module === 'object' && module.exports ? this : (this || window));
