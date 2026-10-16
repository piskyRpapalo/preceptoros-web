(function (raiz) {
  'use strict';
  function boya(g,P,o,m,v,c,t,dpr) {
      var p = P(m.col, m.fila), y = p[1] + (o.quieto ? 0 : Math.sin((o.t || 0) * 0.002) * 2 * dpr);
      var r = (5 + (v.vida === null ? 3 : v.vida * 4 / 1000)) * dpr;
      g.strokeStyle = 'rgba(155,227,255,.6)'; g.lineWidth = 1.5 * dpr;
      g.beginPath(); g.moveTo(p[0], y + r); g.lineTo(p[0], y + r + 7 * dpr); g.stroke();
      g.beginPath(); g.arc(p[0], y, r, 0, 2 * Math.PI);
      if (c.nd) { g.setLineDash([2 * dpr, 2 * dpr]); g.strokeStyle = 'rgba(150,160,180,' + c.a + ')'; if (raiz.AtlasBuildingsToon) { raiz.AtlasBuildingsToon.silueta(g, 'boya', p[0], y, r); } g.stroke(); g.setLineDash([]); }
      else { raiz.AtlasBuildingsToon ? raiz.AtlasBuildingsToon.forma(g, 'boya', p[0], y, r, c, dpr, c.a) : (g.globalAlpha = c.a, g.fillStyle = 'hsl(' + c.h + ' ' + c.s + '% ' + c.l + '%)', g.fill(), g.globalAlpha = 1, g.stroke()); }
      g.lineWidth = dpr; g.fillStyle = 'rgba(155,227,255,.75)';
      g.fillText(t('boya_estado'), p[0], y - r - 4 * dpr);
  }
  function lapidas(g,P,casa,lapidas,t,dpr) {
      var lp = P(casa.x - 160, casa.y - 160), k = Math.min(9, lapidas.length);
      g.fillStyle = 'rgba(150,160,180,.7)';
      if (!k && raiz.AtlasBuildingsToon) { raiz.AtlasBuildingsToon.silueta(g, 'lapidas', lp[0], lp[1], 8 * dpr); g.strokeStyle = 'rgba(150,160,180,.7)'; g.setLineDash([2 * dpr, 3 * dpr]); g.stroke(); g.setLineDash([]); }
      for (var s = 0; s < k; s++) { var sx = lp[0] + (s - (k - 1) / 2) * 7 * dpr, sy = lp[1] - (s % 2) * 3 * dpr; if (raiz.AtlasBuildingsToon) { raiz.AtlasBuildingsToon.forma(g, 'lapidas', sx, sy, 3.2 * dpr, { h: 220, s: 12, l: 58 }, dpr, 0.8); } else { g.fillRect(sx - 2.5 * dpr, sy - 5 * dpr, 5 * dpr, 7 * dpr); } }        g.fillStyle = 'rgba(155,227,255,.75)'; g.fillText(t('lap_nombre') + ' · ' + lapidas.length, lp[0], lp[1] + 14 * dpr);
  }
  function observatorio(g,P,o,casa,vistas,L,tic,t,dpr,oc) {
      var ult = vistas.length ? L.color(vistas[vistas.length - 1], tic) : null, rr = 9 * dpr;
      if (raiz.AtlasBuildingsToon) { raiz.AtlasBuildingsToon.silueta(g, 'observatorio', oc[0], oc[1], rr); }
      if (ult && !ult.nd && raiz.AtlasBuildingsToon) { raiz.AtlasBuildingsToon.forma(g, 'observatorio', oc[0], oc[1], rr, { h: ult.h, s: ult.s, l: ult.l }, dpr, ult.a); }
      else { if (ult && !ult.nd) { g.globalAlpha = ult.a; g.fillStyle = 'hsl(' + ult.h + ' ' + ult.s + '% ' + ult.l + '%)'; g.fill(); g.globalAlpha = 1; } g.strokeStyle = 'rgba(155,227,255,.7)'; g.lineWidth = 1.5 * dpr; g.stroke(); g.lineWidth = dpr; }
      g.fillStyle = 'rgba(155,227,255,.75)'; g.fillText(t('obs_nombre'), oc[0], oc[1] + 14 * dpr);
  }
  var P = { boya: boya, lapidas: lapidas, observatorio: observatorio };
  if (typeof module === 'object' && module.exports) { module.exports = P; } else { raiz.AtlasReefPaint = P; }
})(this);
