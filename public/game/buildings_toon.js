/* preceptoros.org · theGame · LOS EDIFICIOS EN TOON (RONDA 2 · chunk 3, FIRMO 13-oct): el mismo lenguaje del cangrejo.

   Cel cuantizado: tres BANDAS duras del MISMO hue (AtlasToon.bandas): sombra (disco entero), base (desplazado hacia
   la luz) y brillo (una mancha pequena hacia la luz), con contorno. La luz es la del cangrejo (AtlasToon.LUZ), la
   misma para todo. El hue llega del vector del propio edificio (su ∇C, o la escala de niveles del Cristal): NADA
   inventado. Sin AtlasToon cargado, un relleno plano de siempre. Sin red, sin azar, sin reloj. */
(function (raiz) {
  'use strict';
  /* g: contexto; x, y, r en pixeles; c: { h, s, l } del vector; dpr; a: alfa del cuerpo (1 = presente). */
  function disco(g, x, y, r, c, dpr, a) {
    var T = raiz.AtlasToon || globalThis.AtlasToon, L = T ? T.LUZ : { x: -0.6, y: -0.8 };
    g.globalAlpha = a == null ? 1 : a;
    if (!T) { g.beginPath(); g.arc(x, y, r, 0, 2 * Math.PI); g.fillStyle = 'hsl(' + c.h + ' ' + c.s + '% ' + c.l + '%)'; g.fill(); g.globalAlpha = 1; g.stroke(); return; }
    var B = T.bandas(c.h, c.s, c.l);
    g.beginPath(); g.arc(x, y, r, 0, 2 * Math.PI); g.fillStyle = B.sombra; g.fill();
    g.save(); g.clip();
    g.beginPath(); g.arc(x + L.x * r * 0.18, y + L.y * r * 0.18, r * 0.92, 0, 2 * Math.PI); g.fillStyle = B.base; g.fill();
    g.beginPath(); g.arc(x + L.x * r * 0.38, y + L.y * r * 0.38, r * 0.42, 0, 2 * Math.PI); g.fillStyle = B.brillo; g.fill();
    g.restore();
    g.beginPath(); g.arc(x, y, r, 0, 2 * Math.PI); g.strokeStyle = B.contorno; g.lineWidth = 1.6 * (dpr || 1); g.stroke();
    g.globalAlpha = 1;
  }
  var AtlasBuildingsToon = { disco: disco };
  if (typeof module === 'object' && module.exports) { module.exports = AtlasBuildingsToon; } else { raiz.AtlasBuildingsToon = AtlasBuildingsToon; }
})(this);
