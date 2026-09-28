/* preceptoros.org · theGame · el QR de un enlace de duelo, sin dependencias (sugerencia firmada por el
   Soberano, 2026-09-28: «el paquete por QR, cara a cara, sin chat ni nube»).

   Un codificador QR (ISO/IEC 18004) de modo BYTE, niveles L y M, versiones 1 a 40, escrito aqui para no
   traer codigo de fuera: la tabla de bloques y de correccion es la de la norma; Reed-Solomon sobre
   GF(256) con el polinomio 0x11D; la mascara, la de menor penalizacion. El QR lleva un ENLACE a esta
   web (`enlace.js`): la camara de cualquier telefono lo abre, y el paquete va en el fragmento `#`, que
   no sale nunca hacia el servidor. Se contrasta con una libreria de referencia en `atlas/qr_casos.mjs`.

   PURO y DETERMINISTA: `matriz(bytes, nivel)` -> { version, n, m } con `m[y * n + x]` = 1 si es oscuro.
   Ni DOM, ni red, ni reloj, ni azar. Pintarlo es de `ui-duelo.js`. */
(function (raiz) {
  'use strict';

  /* Por nivel: codigos de correccion por bloque y numero de bloques, versiones 1..40 (indice 0 vacio). */
  var ECC = {
    L: [0, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28, 28, 28, 30, 30, 26, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
    M: [0, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28]
  };
  var BLOQUES = {
    L: [0, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 7, 8, 8, 9, 9, 10, 12, 12, 12, 13, 14, 15, 16, 17, 18, 19, 19, 20, 21, 22, 24, 25],
    M: [0, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23, 25, 26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47, 49]
  };
  var FORMATO = { L: 1, M: 0 };

  function modulosCrudos(v) {
    var r = (16 * v + 128) * v + 64;
    if (v >= 2) {
      var na = Math.floor(v / 7) + 2;
      r -= (25 * na - 10) * na - 55;
      if (v >= 7) { r -= 36; }
    }
    return r;
  }
  function datos(v, nivel) { return Math.floor(modulosCrudos(v) / 8) - ECC[nivel][v] * BLOQUES[nivel][v]; }
  function capacidad(v, nivel) { return datos(v, nivel) - (v < 10 ? 2 : 3); }

  /* GF(256) y Reed-Solomon. */
  function mul(x, y) {
    var z = 0;
    for (var i = 7; i >= 0; i--) { z = (z << 1) ^ ((z >>> 7) * 0x11D); z ^= ((y >>> i) & 1) * x; }
    return z;
  }
  function divisor(g) {
    var r = new Array(g).fill(0), raiz2 = 1;
    r[g - 1] = 1;
    for (var i = 0; i < g; i++) {
      for (var j = 0; j < g; j++) { r[j] = mul(r[j], raiz2); if (j + 1 < g) { r[j] ^= r[j + 1]; } }
      raiz2 = mul(raiz2, 2);
    }
    return r;
  }
  function resto(d, div) {
    var r = new Array(div.length).fill(0);
    d.forEach(function (b) {
      var f = b ^ r.shift();
      r.push(0);
      for (var i = 0; i < div.length; i++) { r[i] ^= mul(div[i], f); }
    });
    return r;
  }

  /* Los codigos de datos (modo byte), rellenados, en bloques con su correccion, entrelazados. */
  function codigos(bytes, v, nivel) {
    var bits = [], cap = datos(v, nivel) * 8;
    function pon(x, n) { for (var i = n - 1; i >= 0; i--) { bits.push((x >>> i) & 1); } }
    pon(4, 4); pon(bytes.length, v < 10 ? 8 : 16);
    for (var i = 0; i < bytes.length; i++) { pon(bytes[i], 8); }
    pon(0, Math.min(4, cap - bits.length));
    pon(0, (8 - bits.length % 8) % 8);
    for (var p = 0xEC; bits.length < cap; p ^= 0xEC ^ 0x11) { pon(p, 8); }
    var cw = [];
    for (i = 0; i < bits.length; i += 8) { cw.push(parseInt(bits.slice(i, i + 8).join(''), 2)); }
    var nb = BLOQUES[nivel][v], ne = ECC[nivel][v], total = Math.floor(modulosCrudos(v) / 8);
    var cortos = nb - total % nb, largoCorto = Math.floor(total / nb), div = divisor(ne), bl = [], k = 0;
    for (i = 0; i < nb; i++) {
      var d = cw.slice(k, k + largoCorto - ne + (i < cortos ? 0 : 1));
      k += d.length;
      var e = resto(d, div);
      if (i < cortos) { d.push(0); }
      bl.push(d.concat(e));
    }
    var out = [];
    for (i = 0; i < bl[0].length; i++) {
      for (var j = 0; j < nb; j++) { if (i !== largoCorto - ne || j >= cortos) { out.push(bl[j][i]); } }
    }
    return out;
  }

  function alineacion(v) {
    if (v === 1) { return []; }
    var na = Math.floor(v / 7) + 2, n = v * 4 + 17;
    var paso = v === 32 ? 26 : Math.ceil((v * 4 + 4) / (na * 2 - 2)) * 2, r = [6];
    for (var p = n - 7; r.length < na; p -= paso) { r.splice(1, 0, p); }
    return r;
  }

  var MASCARAS = [
    function (x, y) { return (x + y) % 2 === 0; }, function (x, y) { return y % 2 === 0; },
    function (x) { return x % 3 === 0; }, function (x, y) { return (x + y) % 3 === 0; },
    function (x, y) { return (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0; },
    function (x, y) { return x * y % 2 + x * y % 3 === 0; }, function (x, y) { return (x * y % 2 + x * y % 3) % 2 === 0; },
    function (x, y) { return ((x + y) % 2 + x * y % 3) % 2 === 0; }
  ];

  function construye(v, nivel, cw, mascara) {
    var n = v * 4 + 17, m = new Uint8Array(n * n), f = new Uint8Array(n * n);
    function fija(x, y, o) { m[y * n + x] = o ? 1 : 0; f[y * n + x] = 1; }
    function buscador(cx, cy) {
      for (var dy = -4; dy <= 4; dy++) {
        for (var dx = -4; dx <= 4; dx++) {
          var d = Math.max(Math.abs(dx), Math.abs(dy)), x = cx + dx, y = cy + dy;
          if (x >= 0 && x < n && y >= 0 && y < n) { fija(x, y, d !== 2 && d !== 4); }
        }
      }
    }
    function formato(mk) {
      var dat = FORMATO[nivel] << 3 | mk, r = dat, i;
      for (i = 0; i < 10; i++) { r = (r << 1) ^ ((r >>> 9) * 0x537); }
      var b = (dat << 10 | r) ^ 0x5412, bit = function (k) { return (b >>> k) & 1; };
      for (i = 0; i <= 5; i++) { fija(8, i, bit(i)); }
      fija(8, 7, bit(6)); fija(8, 8, bit(7)); fija(7, 8, bit(8));
      for (i = 9; i < 15; i++) { fija(14 - i, 8, bit(i)); }
      for (i = 0; i < 8; i++) { fija(n - 1 - i, 8, bit(i)); }
      for (i = 8; i < 15; i++) { fija(8, n - 15 + i, bit(i)); }
      fija(8, n - 8, 1);
    }
    var i, j;
    for (i = 0; i < n; i++) { fija(6, i, i % 2 === 0); fija(i, 6, i % 2 === 0); }
    buscador(3, 3); buscador(n - 4, 3); buscador(3, n - 4);
    var al = alineacion(v), ul = al.length - 1;
    for (i = 0; i < al.length; i++) {
      for (j = 0; j < al.length; j++) {
        if ((i === 0 && j === 0) || (i === 0 && j === ul) || (i === ul && j === 0)) { continue; }
        for (var dy = -2; dy <= 2; dy++) {
          for (var dx = -2; dx <= 2; dx++) { fija(al[i] + dx, al[j] + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1); }
        }
      }
    }
    formato(0);
    if (v >= 7) {
      var r = v;
      for (i = 0; i < 12; i++) { r = (r << 1) ^ ((r >>> 11) * 0x1F25); }
      var vb = v << 12 | r;
      for (i = 0; i < 18; i++) {
        var o = (vb >>> i) & 1, a = n - 11 + i % 3, c = Math.floor(i / 3);
        fija(a, c, o); fija(c, a, o);
      }
    }
    /* Los datos, en zigzag de dos columnas desde la esquina inferior derecha. */
    var k = 0;
    for (var der = n - 1; der >= 1; der -= 2) {
      if (der === 6) { der = 5; }
      for (var vert = 0; vert < n; vert++) {
        for (j = 0; j < 2; j++) {
          var x = der - j, y = ((der + 1) & 2) === 0 ? n - 1 - vert : vert;
          if (!f[y * n + x] && k < cw.length * 8) { m[y * n + x] = (cw[k >>> 3] >>> (7 - (k & 7))) & 1; k++; }
        }
      }
    }
    var mf = MASCARAS[mascara];
    for (y = 0; y < n; y++) { for (x = 0; x < n; x++) { if (!f[y * n + x] && mf(x, y)) { m[y * n + x] ^= 1; } } }
    formato(mascara);
    return { version: v, nivel: nivel, mascara: mascara, n: n, m: m };
  }

  /* Penalizacion de la norma: rachas, bloques 2x2, falsos buscadores y equilibrio. */
  function penaliza(q) {
    var n = q.n, m = q.m, p = 0, x, y, i, oscuros = 0;
    function en(a, b, porFila) { return porFila ? m[a * n + b] : m[b * n + a]; }
    for (var fila = 0; fila < 2; fila++) {
      for (y = 0; y < n; y++) {
        var racha = 1, s = '';
        for (x = 0; x < n; x++) {
          var c = en(y, x, fila === 0);
          s += c;
          if (x > 0 && c === en(y, x - 1, fila === 0)) { racha++; } else { if (racha >= 5) { p += racha - 2; } racha = 1; }
        }
        if (racha >= 5) { p += racha - 2; }
        for (i = 0; i + 11 <= n; i++) {
          var w = s.slice(i, i + 11);
          if (w === '10111010000' || w === '00001011101') { p += 40; }
        }
      }
    }
    for (y = 0; y < n - 1; y++) {
      for (x = 0; x < n - 1; x++) {
        var c0 = m[y * n + x];
        if (c0 === m[y * n + x + 1] && c0 === m[(y + 1) * n + x] && c0 === m[(y + 1) * n + x + 1]) { p += 3; }
      }
    }
    for (i = 0; i < n * n; i++) { oscuros += m[i]; }
    return p + Math.floor(Math.abs(oscuros * 20 - n * n * 10) / (n * n)) * 10;
  }

  /* `bytes`: Uint8Array o texto (se codifica en UTF-8). `mascara` solo para contrastar con la referencia. */
  function matriz(bytes, nivel, mascara) {
    nivel = nivel || 'L';
    if (!ECC[nivel]) { throw new Error('qr: nivel L o M'); }
    if (typeof bytes === 'string') { bytes = new TextEncoder().encode(bytes); }
    for (var v = 1; v <= 40 && capacidad(v, nivel) < bytes.length; v++) { /* la version mas pequena que cabe */ }
    if (v > 40) { throw new Error('qr: no cabe (' + bytes.length + ' B)'); }
    var cw = codigos(bytes, v, nivel);
    if (mascara != null) { return construye(v, nivel, cw, mascara); }
    var mejor = null, pm = Infinity;
    for (var k = 0; k < 8; k++) {
      var q = construye(v, nivel, cw, k), pk = penaliza(q);
      if (pk < pm) { pm = pk; mejor = q; }
    }
    return mejor;
  }

  var AtlasQR = { matriz: matriz, capacidad: capacidad };
  if (typeof module === 'object' && module.exports) { module.exports = AtlasQR; }
  else { raiz.AtlasQR = AtlasQR; }
})(this);
