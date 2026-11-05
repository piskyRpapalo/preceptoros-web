
(function (raiz) {
  'use strict';

  var G=raiz.AtlasGacha,O=raiz.AtlasOnda||{},F=(raiz.AtlasValores&&raiz.AtlasValores.fluidez)||{};
  var TONOS=['hsl(35 75% 58%)','hsl(140 45% 55%)','hsl(275 55% 68%)','hsl(210 12% 68%)'];
  var BRILLO={normal:0,magico:5,raro:10,unico:16},EVENTO_MS=560,HONDO=[[7,12,24],[12,24,44],[20,42,70],[34,70,104]],MC=null,MCX=null;
  function initMC(w,h){if(!MC||MC.width!==w||MC.height!==h){var c=raiz.document.createElement('canvas');c.width=w;c.height=h;MC=c;MCX=c.getContext('2d')}}
  function applyMelt(g,s,quieto){if(quieto||!F.melt_alfa)return;initMC(g.canvas.width,g.canvas.height);MCX.save();MCX.globalAlpha=F.melt_alfa||.93;var t=s?s%10000/10000:0,r=F.melt_rotacion||.0001,w=g.canvas.width/2,h=g.canvas.height/2;MCX.translate(w,h);MCX.scale(1+Math.sin(t*6.2832)*.0001,1+Math.sin(t*6.2832)*.0001);MCX.rotate(Math.sin(t*6.2832)*r);MCX.translate(-w,-h);MCX.drawImage(g.canvas,0,0);MCX.restore();g.drawImage(MC,0,0)}
  function hash(x,y,s){
    var h = Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(s, 974634719);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  }
  function ruido(x, y, s) {
    var xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi;
    fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy);
    var a = hash(xi, yi, s), b = hash(xi + 1, yi, s), c = hash(xi, yi + 1, s), d = hash(xi + 1, yi + 1, s);
    return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
  }
  function fbm(x, y, s) { return ruido(x, y, s) * 0.55 + ruido(x * 2.1, y * 2.1, s + 7) * 0.3 + ruido(x * 4.3, y * 4.3, s + 13) * 0.15; }

  function textura(w, h, f, pal) {
    var c = raiz.document.createElement('canvas'); c.width = w; c.height = h;
    var g = c.getContext('2d'), im = g.createImageData(w, h), n = pal.length - 1, e = new Float32Array(w * h), x, y;
    for (y = 0; y < h; y++) { for (x = 0; x < w; x++) { e[y * w + x] = f(x, y) * n; } }
    for (y = 0; y < h; y++) {
      for (x = 0; x < w; x++) {
        var i = y * w + x, v = e[i], q = Math.max(0, Math.min(n, Math.round(v))), d = (v - q) / 8, p = pal[q];
        [[1, 0], [2, 0], [-1, 1], [0, 1], [1, 1], [0, 2]].forEach(function (o) {
          var X = x + o[0], Y = y + o[1];
          if (X >= 0 && X < w && Y < h) { e[Y * w + X] += d; }
        });
        if (p) { im.data.set([p[0], p[1], p[2], 255], i * 4); }
      }
    }
    g.putImageData(im, 0, 0);
    return c;
  }
  function pega(g, tex, W, H) { g.imageSmoothingEnabled = false; g.drawImage(tex, 0, 0, W, H); }

  function limite(arm) {
    var l = 0;
    arm.forEach(function (h) { l += Math.max(Math.abs(h[1]), Math.abs(h[2])); });
    return Math.max(1, l);
  }

  function afina(arm, d, t) {
    if (!d) { return arm; }
    return arm.map(function (h, j) {
      var tuerce = ((j * 7 + 3) % 11 - 5) / 5, estira = 1 + d * ((j * 5 + 1) % 7 - 3) * 0.14;
      return [h[0], h[1] * estira, h[2] * (2 - estira), h[3] + d * tuerce * 14 + Math.sin(t * 0.004 + j) * d * 3];
    });
  }
  function figura(g,a,x,y,r,o){var k=r/limite(a)*(o.escala==null?1:o.escala),c=Math.cos(o.giro||0),s=Math.sin(o.giro||0),n=o.puntos||120,d=o.desafina||0,A=afina(a,d,o.t||0),z=d*r*.07,f=o.color;if(o.vidaFraccion!=null&&O.colorVida)f=O.colorVida(o.vidaFraccion,o.color,o.arm);g.save();g.globalAlpha=o.alfa==null?1:o.alfa;g.strokeStyle=f;g.lineWidth=o.grosor||2;g.lineJoin='round';o.brillo&&(g.shadowColor=f,g.shadowBlur=o.brillo);g.beginPath();for(var i=0;i<=n;i++){var u=i/n*6.2832,p=G.punto(A,u),Z=z*Math.sin(u*13+(o.t||0)*.01),px=p[0]*k+Z*Math.cos(u),py=p[1]*k+Z*Math.sin(u);g[i?'lineTo':'moveTo'](x+px*c-py*s,y-(px*s+py*c))}g.stroke();g.restore()}
  function tono(t) { return TONOS[G.caracter(t).color]; }

  function rapidez(v) { return 'hsl(' + Math.round(210 - Math.max(0, Math.min(1, (v - 3) / 10)) * 185) + ' 80% 62%)'; }
  function mini(lienzo, t, color) {
    var g = lienzo.getContext('2d'), w = lienzo.width;
    g.clearRect(0, 0, w, lienzo.height);
    figura(g, G.espectro(t), w / 2, lienzo.height / 2, w * 0.42, { color: color || tono(t), grosor: Math.max(1.2, w / 60),
                                                               brillo: BRILLO[t.rareza] * w / 120 });
  }
  // [W] O1a (2026-10-27): the combat scene lives in wave_duel_scene.js (AtlasWaveDuel). This module keeps only the shared
  // library. Without the wave duel loaded, escena() answers with an inert scene instead of the old one, which threw on
  // every frame (free variables `semilla`/`quieto` from the melt injection, measured 2026-10-27).
  function escena(lienzo, def, asa, combate, op) {
    var W = raiz.AtlasWaveDuel;
    if (W && W.escena) { return W.escena(lienzo, def, asa, combate, op); }
    var nada = function () {};
    return { velocidad: nada, salta: nada, otra: nada, para: nada };
  }

  var AtlasEscena = { TONOS: TONOS, BRILLO: BRILLO, EVENTO_MS: EVENTO_MS, figura: figura, mini: mini, tono: tono, escena: escena,
                      textura: textura, pega: pega, fbm: fbm, hash: hash, rapidez: rapidez, limite: limite, applyMelt: applyMelt };
  raiz.AtlasEscena = AtlasEscena;
})(this);
