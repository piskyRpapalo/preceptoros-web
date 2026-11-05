// Map integrity contract (P2, 2026-10-26). Combat may change only a bounded battle record; it can
// never add geometry to the map. Every value the map draws that combat could have touched passes
// through here first: the record is rebuilt from the KNOWN places only, every point must be two
// finite numbers, and every label must be real text. Anything else is not drawn at all.
// Pure functions: no DOM, no clock, no randomness.
(function (raiz) {
  'use strict';
  var TOPE = 1000000;
  var VACIO = /^(?:undefined|null|NaN|\[object Object\])$/;
  var TROZO = /\b(?:undefined|NaN)\b/;

  function entero(n) { return typeof n === 'number' && Number.isInteger(n) && n >= 0 && n <= TOPE ? n : 0; }

  // The battle record, rebuilt: only keys of places the map already knows, only {g, p} as bounded
  // non-negative integers. Unknown keys, strings, NaN, negatives and extra fields are dropped.
  function record(crudo, lugares) {
    var limpio = {}, conocidas = {};
    (Array.isArray(lugares) ? lugares : []).forEach(function (l) { if (l && typeof l.clave === 'string' && l.clave) { conocidas[l.clave] = true; } });
    if (crudo && typeof crudo === 'object') {
      Object.keys(crudo).forEach(function (k) {
        var r = crudo[k];
        if (!conocidas[k] || !r || typeof r !== 'object') { return; }
        var g = entero(r.g), p = entero(r.p);
        if (g || p) { limpio[k] = Object.freeze({ g: g, p: p }); }
      });
    }
    return Object.freeze(limpio);
  }

  function punto(p) {
    return Array.isArray(p) && p.length >= 2 && typeof p[0] === 'number' && typeof p[1] === 'number' &&
      isFinite(p[0]) && isFinite(p[1]);
  }

  // A label is drawn only if it is real text: a string, not empty, and never the spelling of a
  // missing value. Returns '' when the label must not be drawn.
  function texto(t) {
    if (typeof t !== 'string') { return ''; }
    var s = t.trim();
    return !s || VACIO.test(s) || TROZO.test(s) ? '' : s;
  }

  // A player enters the map only as a well-formed envelope: a fingerprint, a signer and a defence of
  // real troops. A malformed one is not drawn at all (it would otherwise break every frame of the map).
  function cadena(s) { return typeof s === 'string' && s.length > 0; }
  function jugador(d) {
    var c = d && d.sobre && d.sobre.cuerpo, tropas = c && c.tropas;
    return !!(d && cadena(d.huella) && cadena(d.sobre.de) && Array.isArray(tropas) && tropas.length &&
      tropas.every(function (t) { return t && cadena(t.semilla) && cadena(t.tc); }));
  }

  var AtlasMapIntegrity = Object.freeze({ record: record, punto: punto, texto: texto, jugador: jugador, TOPE: TOPE });
  if (typeof module === 'object' && module.exports) { module.exports = AtlasMapIntegrity; }
  else { raiz.AtlasMapIntegrity = AtlasMapIntegrity; }
})(typeof module === 'object' && module.exports ? this : (this || window));
