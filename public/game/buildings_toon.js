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
  /* FORMAS INFANTILES (ronda 3): cada edificio tiene su silueta. El relleno son las mismas tres bandas del hue del
     vector (sombra, base desplazada a la luz, brillo) recortadas a la silueta, y el contorno es la misma silueta. */
  function sendero(g, kind, x, y, r) {
    g.beginPath();
    if (kind === 'boya') { g.arc(x, y, r, 0, 2 * Math.PI); }
    else if (kind === 'observatorio') { g.moveTo(x - r, y + r * 0.4); g.arc(x, y, r, Math.PI, 2 * Math.PI); g.lineTo(x + r, y + r * 0.4); g.closePath(); }
    else if (kind === 'cristal') { for (var i = 0; i < 6; i++) { var an = -Math.PI / 2 + i * Math.PI / 3; g[i ? 'lineTo' : 'moveTo'](x + r * Math.cos(an) * 0.85, y + r * 1.1 * Math.sin(an)); } g.closePath(); }
    else { g.moveTo(x - r * 0.8, y + r); g.lineTo(x - r * 0.8, y - r * 0.2); g.arc(x, y - r * 0.2, r * 0.8, Math.PI, 2 * Math.PI); g.lineTo(x + r * 0.8, y + r); g.closePath(); }
  }
  /* g, x, y, r en pixeles; kind: boya | observatorio | cristal | lapidas; c: { h, s, l }; a: alfa. */
  function forma(g, kind, x, y, r, c, dpr, a) {
    var T = raiz.AtlasToon || globalThis.AtlasToon, L = T ? T.LUZ : { x: -0.6, y: -0.8 };
    g.globalAlpha = a == null ? 1 : a;
    if (!T) { sendero(g, kind, x, y, r); g.fillStyle = 'hsl(' + c.h + ' ' + c.s + '% ' + c.l + '%)'; g.fill(); g.globalAlpha = 1; g.stroke(); return; }
    var B = T.bandas(c.h, c.s, c.l);
    sendero(g, kind, x, y, r); g.fillStyle = B.sombra; g.fill();
    g.save(); sendero(g, kind, x, y, r); g.clip();
    sendero(g, kind, x + L.x * r * 0.15, y + L.y * r * 0.15, r * 0.9); g.fillStyle = B.base; g.fill();
    sendero(g, kind, x + L.x * r * 0.3, y + L.y * r * 0.3, r * 0.5); g.fillStyle = B.brillo; g.fill();
    g.restore();
    sendero(g, kind, x, y, r); g.strokeStyle = B.contorno; g.lineWidth = 1.6 * (dpr || 1); g.stroke();
    /* detalles de la silueta: lo que la hace reconocible */
    g.fillStyle = B.contorno;
    if (kind === 'boya') { g.beginPath(); g.moveTo(x, y - r); g.lineTo(x, y - r * 1.9); g.strokeStyle = B.contorno; g.lineWidth = 1.4 * (dpr || 1); g.stroke(); g.beginPath(); g.arc(x, y - r * 2.05, r * 0.22, 0, 2 * Math.PI); g.fill(); }
    if (kind === 'observatorio') { g.beginPath(); g.arc(x, y - r * 0.3, r * 0.22, 0, 2 * Math.PI); g.fill(); }
    if (kind === 'cristal') { g.beginPath(); g.moveTo(x, y - r * 1.1); g.lineTo(x, y + r * 1.1); g.strokeStyle = B.contorno; g.lineWidth = 1 * (dpr || 1); g.stroke(); }
    g.globalAlpha = 1;
  }
  var AtlasBuildingsToon = { disco: disco, forma: forma, silueta: sendero };
  if (typeof module === 'object' && module.exports) { module.exports = AtlasBuildingsToon; } else { raiz.AtlasBuildingsToon = AtlasBuildingsToon; }
})(this);
