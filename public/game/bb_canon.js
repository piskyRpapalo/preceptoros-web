(function (raiz) {
  'use strict';
  // CANON REGISTRADO del lenguaje de burbujas (Desk, dictamen 2026-10-28). Procedencia y verificacion: docs/canon-bubble-math.md.
  // Hash espacial (canon, render_seed.js:5-11): x = a ^ (b*73856093) ^ (c*19349663); luego xorshift 13, 17, 5; resultado uint32.
  // Cosecha (canon, render_combat.js:64-65): seed = hash(vertices, spectrum, valve+sel);
  //   PENETRATES si seed % 100 < 40 + 3*vertices + 10*valve; si no, FILTERED.
  // La expresion del hash es la del original, sin cambios (incluido >>>0 en el producto).
  function hash(a, b, c) {
    var x = (a >>> 0) ^ ((b * 73856093) >>> 0) ^ ((c * 19349663) >>> 0);
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    return x >>> 0;
  }

  function cosecha(st) {
    var seed = hash(st.vertices, st.spectrum, st.valve + st.selected);
    var outcome = (seed % 100) < (40 + st.vertices * 3 + st.valve * 10) ? 'PENETRATES' : 'FILTERED';
    return { seed: seed, outcome: outcome };
  }

  var BBCanon = { hash: hash, cosecha: cosecha, FORMULA_COSECHA: 'PENETRATES si hash(v,s,valve+sel) % 100 < 40 + 3v + 10·valve' };
  if (typeof module === 'object' && module.exports) { module.exports = BBCanon; }
  else { raiz.AtlasBBCanon = BBCanon; }
})(typeof module === 'object' && module.exports ? this : (this || window));
