/* preceptoros.org · theGame · ∇C DE LOS LUGARES (opción A, FIRMO 2026-10-12): el color de un lugar sale de su REGISTRO DE
   COMBATE en este aparato, no de la decoracion. Sin estado nuevo y sin persistencia.

   El registro por lugar guarda SOLO {g, p} (victorias y derrotas, `ui-arena.js:115-116`); la vida restante no se guarda,
   asi que no se finge. Por eso:
   - Hue  = CUOTA DE VICTORIAS g / (g + p), por mil (verde: lo dominas · rojo: te gana). En la ficha dice «win share».
   - Sat  = combates librados, min(10, g + p) / 10 (cuanta actividad tiene ese lugar para ti).
   - Light = la armadura del lider (la misma tirada que usa el combate, `arena.js:91`) sobre un TOPE DECLARADO de 20
     (base 2+2, bono de elemento hasta 7, solar 3, lija hasta 5: `valores.js:53-67`).
   - Sin combate (g + p = 0): NO_DATA translucido (Escala Viva: el mapa puede empezar gris; no es un fallo).
   Puro y entero. Sin red, sin azar, sin reloj. */
(function (raiz) {
  'use strict';
  var TOPE_ARMADURA = 20, TOPE_COMBATES = 10;

  /* rc = {g, p} del registro (o nada); lider = la tropa lider del lugar. Devuelve el vector o null (no combatido). */
  function vector(rc, lider) {
    var g = rc && rc.g > 0 ? Math.floor(rc.g) : 0, p = rc && rc.p > 0 ? Math.floor(rc.p) : 0, n = g + p;
    if (!n) { return null; }
    var arm = lider && lider.stats && typeof lider.stats.armadura === 'number' ? lider.stats.armadura : null;
    return { vida: Math.round(g * 1000 / n), carga: Math.min(TOPE_COMBATES, n) * 100,
             escudo: arm === null ? null : Math.min(1000, Math.round(arm * 1000 / TOPE_ARMADURA)), combates: n };
  }
  /* El color: el mismo reparto que los edificios (reef_building_lifecycle.color). null -> gris translucido. */
  function color(v) {
    if (!v) { return { h: 0, s: 0, l: 62, a: 0.45, nd: true, css: 'hsla(0, 0%, 62%, 0.45)' }; }
    var h = Math.round(v.vida * 130 / 1000), s = 25 + Math.round(v.carga * 60 / 1000), l = 38 + Math.round((v.escudo || 0) * 30 / 1000);
    return { h: h, s: s, l: l, a: 1, nd: false, css: 'hsl(' + h + ', ' + s + '%, ' + l + '%)' };
  }
  /* La linea de la ficha del inspector. */
  function estado(v) {
    if (!v) { return 'NO_DATA (not fought on this device)'; }
    return 'win share ' + v.vida + '/1000 · ' + v.combates + ' fights · shield ' + (v.escudo === null ? 'NO_DATA (leader without armour stat)' : v.escudo + '/1000');
  }

  var AtlasLugarNablaC = { vector: vector, color: color, estado: estado, TOPE_ARMADURA: TOPE_ARMADURA };
  if (typeof module === 'object' && module.exports) { module.exports = AtlasLugarNablaC; } else { raiz.AtlasLugarNablaC = AtlasLugarNablaC; }
})(this);
