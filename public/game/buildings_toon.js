(function (raiz) {
  'use strict';
    function banda(c) { var h = c && c.h != null ? c.h : 196; return h < 40 || h > 340 ? 'vermilion.base' : h < 75 ? 'comic yellow.base' : h > 150 && h < 230 ? 'cyan' : 'paper'; }
    function rift(g, item, x, y, size, a) {
    var RP = raiz.AtlasRiftPaint, a0 = g.globalAlpha, hecho;
    if (!RP) { return false; }
    g.globalAlpha = a == null ? 1 : a;
    hecho = RP.word(g, item, x, y, size);
    g.globalAlpha = a0;
    return hecho;
  }
    var ICONO = { boya: 'buoy', observatorio: 'eye', cristal: 'bubble' };
    function disco(g, x, y, r, c, dpr, a) {
    var T = raiz.AtlasToon || globalThis.AtlasToon, L = T ? T.LUZ : { x: -0.6, y: -0.8 };
    if (rift(g, { o: 'blob', rx: 40, ry: 40, rough: 0.05, seed: 'disco', f: banda(c), s: 'ink', lw: 3 }, x, y, r / 40, a)) { return; }
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
    function sendero(g, kind, x, y, r) {
    g.beginPath();
    if (kind === 'boya') { g.arc(x, y, r, 0, 2 * Math.PI); }
    else if (kind === 'observatorio') { g.moveTo(x - r, y + r * 0.4); g.arc(x, y, r, Math.PI, 2 * Math.PI); g.lineTo(x + r, y + r * 0.4); g.closePath(); }
    else if (kind === 'cristal') { for (var i = 0; i < 6; i++) { var an = -Math.PI / 2 + i * Math.PI / 3; g[i ? 'lineTo' : 'moveTo'](x + r * Math.cos(an) * 0.85, y + r * 1.1 * Math.sin(an)); } g.closePath(); }
    else { g.moveTo(x - r * 0.8, y + r); g.lineTo(x - r * 0.8, y - r * 0.2); g.arc(x, y - r * 0.2, r * 0.8, Math.PI, 2 * Math.PI); g.lineTo(x + r * 0.8, y + r); g.closePath(); }
  }
    function forma(g, kind, x, y, r, c, dpr, a) {
    var T = raiz.AtlasToon || globalThis.AtlasToon, L = T ? T.LUZ : { x: -0.6, y: -0.8 };
    if (rift(g, { o: 'icon', name: ICONO[kind] || 'home', r: 40, f: banda(c) }, x, y - r * 0.2, r / 34, a)) { return; }
    g.globalAlpha = a == null ? 1 : a;
    if (!T) { sendero(g, kind, x, y, r); g.fillStyle = 'hsl(' + c.h + ' ' + c.s + '% ' + c.l + '%)'; g.fill(); g.globalAlpha = 1; g.stroke(); return; }
    var B = T.bandas(c.h, c.s, c.l);
    sendero(g, kind, x, y, r); g.fillStyle = B.sombra; g.fill();
    g.save(); sendero(g, kind, x, y, r); g.clip();
    sendero(g, kind, x + L.x * r * 0.15, y + L.y * r * 0.15, r * 0.9); g.fillStyle = B.base; g.fill();
    sendero(g, kind, x + L.x * r * 0.3, y + L.y * r * 0.3, r * 0.5); g.fillStyle = B.brillo; g.fill();
    g.restore();
    sendero(g, kind, x, y, r); g.strokeStyle = B.contorno; g.lineWidth = 1.6 * (dpr || 1); g.stroke();
        g.fillStyle = B.contorno;
    if (kind === 'boya') { g.beginPath(); g.moveTo(x, y - r); g.lineTo(x, y - r * 1.9); g.strokeStyle = B.contorno; g.lineWidth = 1.4 * (dpr || 1); g.stroke(); g.beginPath(); g.arc(x, y - r * 2.05, r * 0.22, 0, 2 * Math.PI); g.fill(); }
    if (kind === 'observatorio') { g.beginPath(); g.arc(x, y - r * 0.3, r * 0.22, 0, 2 * Math.PI); g.fill(); }
    if (kind === 'cristal') { g.beginPath(); g.moveTo(x, y - r * 1.1); g.lineTo(x, y + r * 1.1); g.strokeStyle = B.contorno; g.lineWidth = 1 * (dpr || 1); g.stroke(); }
    g.globalAlpha = 1;
  }
  var AtlasBuildingsToon = { disco: disco, forma: forma, silueta: sendero };
  if (typeof module === 'object' && module.exports) { module.exports = AtlasBuildingsToon; } else { raiz.AtlasBuildingsToon = AtlasBuildingsToon; }
})(this);
