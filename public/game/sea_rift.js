(function (raiz) {
  'use strict';

  function aRgb(s) {
    if (s.indexOf('(') > 0) { return s.match(/\d+/g).slice(0, 3).map(Number); }
    var h = s.replace(/^#/, '');
    return [parseInt(h.substr(0, 2), 16), parseInt(h.substr(2, 2), 16), parseInt(h.substr(4, 2), 16)];
  }

  function paleta() {
    var N = raiz.AtlasComicTokens.NEUTRAL;
    return { ocean: aRgb(N.ocean), cyan: aRgb(N.cyan), ink: aRgb(N.ink) };
  }

  function enPunto(wx, wy, v) {
    var S = 32, R = Math.SQRT1_2;
    var cu = Math.floor((wx + wy) * R / S) + 0.5, cw = Math.floor((wx - wy) * R / S) + 0.5;
    var cx = (cu + cw) * S * R, cy = (cu - cw) * S * R, rad = (0.18 + 0.62 * v) * 15;
    var dx = wx - cx, dy = wy - cy;
    return dx * dx + dy * dy <= rad * rad;
  }

  function textura(E, i, j, n, doc) {
    var M = raiz.AtlasMarFondo, P = paleta();
    var c = doc.createElement('canvas'); c.width = c.height = n;
    var g = c.getContext('2d'), im = g.createImageData(n, n), k = 0;
    for (var y = 0; y < n; y++) { for (var x = 0; x < n; x++) {
      var wx = i * M.TESELA + x * M.RES, wy = j * M.TESELA + y * M.RES;
      var bed = M.lecho(wx, wy, E), shade = M.lecho(wx - 38, wy - 44, E);
      var v = Math.max(0, Math.min(1, 0.2 + E.fbm(wx / 350, wy / 350, 11) * 0.08 + bed * 0.22 + E.fbm(wx / 88, wy / 88, 4) * 0.08 - shade * 0.035));
      var p = P.ocean;
      if (Math.abs(bed - 0.5) < 0.035) { p = P.ink; }
      else if (enPunto(wx, wy, v)) { p = P.cyan; }
      im.data[k++] = p[0]; im.data[k++] = p[1]; im.data[k++] = p[2]; im.data[k++] = 255;
    } }
    g.putImageData(im, 0, 0); return c;
  }

  var AtlasMarRift = {
    textura: textura,
    get niebla() { return paleta().ink; }
  };
  if (typeof module === 'object' && module.exports) { module.exports = AtlasMarRift; }
  else { raiz.AtlasMarRift = AtlasMarRift; }
})(this);
