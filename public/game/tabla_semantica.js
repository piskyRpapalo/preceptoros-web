/* preceptoros.org · theGame · OLA 1 PIEZA 1 (FIRMO del Soberano, letra abhu
   asignada por la Mesa) · TABLA DE DERIVADOS SEMÁNTICOS — LA FUENTE ÚNICA.
   Spec del canon medido (MOCKUP_MVP + F304): cada sello deriva
   hue/saturación/luz/rotación/escala/feedback/pulso. Es la traducción visual
   del estado que UNIFICA todo el chrome (F304: la UI son tubos del mismo
   arrecife; cero colores de UI que no existan en el mar).
   LA TABLA ESTÁ CONGELADA en sus 7 sellos medidos. Sellos nuevos = FIRMO
   del Soberano aparte, jamás se inventan (aquí ni en ninguna parte).
   CONSOLIDACIÓN (F305: si hay dos vías, se consolidan en UNA): esta pieza
   es la única fuente FÍSICA de la tabla; crab_render_hd.js (y quien siga)
   lee de aquí. «TABLA_SEMANTICA: la ÚNICA fuente de color de sello» sigue
   siendo verdad — ahora con una sola fuente física.
   W2: el derivado visual NUNCA es el único canal — el color lleva su
   etiqueta de texto; el contraste lo verifica test_web.py en los 9 idiomas.
   Puro: sin DOM, sin red, sin azar, sin reloj. Misma semilla e input =
   mismos derivados (el gate maestro los compara en calidad 0 y 2). */
(function (raiz) {
  'use strict';
  var HUE = { LIVE: 120, PROPUESTA: 45, FIRMADO: 270, ERROR: 0, NO_DATA: 240, SIMULATED: 30, STALE: 60 };
  var SAT = 70, LUZ_BASE = 55;

  /* Los derivados del spec, por sello (medidos contra MOCKUP_MVP/F304):
     flujo (rotación/marchitamiento del contorno), pulso (ritmo en Hz,
     M17 respira al beat: 660 bajado por octavas — 5,16 Hz de referencia),
     escala (expansión o repliegue), feedback (qué avisa el chrome), y
     silencio visual para lo no medido. */
  var DERIVADOS = {
    LIVE:      { flujo: 0.0006,  pulso_hz: 5.16, escala: 1.0,  feedback: 'flow' },
    PROPUESTA: { flujo: 0.0012,  pulso_hz: 2.00, escala: 0.96, feedback: 'pulse-sync' },
    FIRMADO:   { flujo: 0.0004,  pulso_hz: 1.00, escala: 1.08, feedback: 'bloom' },
    ERROR:     { flujo: 0.0030,  pulso_hz: 8.00, escala: 0.92, feedback: 'distort' },
    NO_DATA:   { flujo: 0,        pulso_hz: 0,    escala: 1.0,  feedback: 'silent-field' },
    SIMULATED: { flujo: 0.0008,  pulso_hz: 3.00, escala: 0.98, feedback: 'sim' },
    STALE:     { flujo: 0.0002,  pulso_hz: 0.50, escala: 0.90, feedback: 'fade' }
  };

  /* La tabla congelada, expuesta. Congelar de verdad: ni añadir ni borrar. */
  function congelada() {
    var t = {};
    Object.keys(HUE).forEach(function (k) { t[k] = HUE[k]; });
    return Object.freeze ? Object.freeze(t) : t;
  }
  var TABLA = congelada();

  /* Puro: los bandas de color de un sello (mismos límites que la ronda toon). */
  function bandas(h, s, l) {
    function c(L) { return 'hsl(' + h + ' ' + s + '% ' + Math.max(4, Math.min(94, L)) + '%)'; }
    return { h: h, brillo: c(l + 16), base: c(l), sombra: c(l - 20), contorno: c(l - 44) };
  }
  /* El paquete completo de un sello: color + derivados. Sello desconocido:
     null — no se inventa NI color NI derivado (NO_DATA con causa en el lector). */
  function de(sello) {
    if (!HUE.hasOwnProperty(sello)) { return null; }
    var d = DERIVADOS[sello];
    return Object.freeze ? Object.freeze({
      sello: sello, hue: HUE[sello], bandas: bandas(HUE[sello], SAT, LUZ_BASE),
      flujo: d.flujo, pulso_hz: d.pulso_hz, escala: d.escala, feedback: d.feedback
    }) : { sello: sello, hue: HUE[sello], bandas: bandas(HUE[sello], SAT, LUZ_BASE),
      flujo: d.flujo, pulso_hz: d.pulso_hz, escala: d.escala, feedback: d.feedback };
  }
  /* Compatibilidad de la consolidación: hueDe como lo leían
     terminal_window_frame.js y worm_transition.js (una sola fuente física). */
  function hueDe(sello) { return HUE.hasOwnProperty(sello) ? HUE[sello] : null; }

  var AtlasSemantica = { TABLA: TABLA, SELLOS: TABLA, de: de, hueDe: hueDe,
                          bandas: bandas, SAT: SAT, LUZ: LUZ_BASE };
  if (typeof module === 'object' && module.exports) { module.exports = AtlasSemantica; }
  else { raiz.AtlasSemantica = AtlasSemantica; }
})(typeof module === 'object' && module.exports ? this : (this || window));
