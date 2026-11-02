// Acho · AC-1 · the pure validator of a frame (odd/tasks/acho-interpreter.md). Not served yet.
// Same verdict as checkFrame (atlas/param_gate.mjs) without Node: the UTF-8 bytes are counted by hand, and the
// band names come in as an argument, so the same file runs in the browser, the app and node.
// No DOM, no network, no clock, no Math.random. It does not read `v`: the seal of the schema is AC-0's (D5 window).
(function (raiz) {
  'use strict';

  var TOPE = 1024;   // a frame is under 1,024 UTF-8 bytes (state_vector.js TOPE; parity case pins it)
  var NEUTROS = ['ink', 'paper', 'ocean', 'cyan'];
  var BANDAS = ['brillo', 'base', 'sombra', 'contorno'];
  var CLAVES_COLOR = ['f', 's', 'fill', 'stroke'];
  var SELLOS = ['LIVE', 'STALE', 'STATIC', 'SIMULATED', 'NO_DATA', 'ERROR'];
  var tiene = function (o, k) { return Object.prototype.hasOwnProperty.call(o, k); };

  function esObjeto(x) { return x !== null && typeof x === 'object' && !Array.isArray(x); }
  function cadena(x) { return typeof x === 'string' && x.trim() !== ''; }
  function plano(x) { var p = Object.getPrototypeOf(x); return p === Object.prototype || p === null; }
  function sinRepetir(xs) { return xs.filter(function (x, i) { return xs.indexOf(x) === i; }); }

  // UTF-8 length of a JS string: 1, 2 or 3 bytes per code unit, 4 per surrogate pair (a lone surrogate counts 3).
  function bytesUtf8(s) {
    var n = 0;
    for (var i = 0; i < s.length; i++) {
      var c = s.charCodeAt(i);
      if (c < 0x80) { n += 1; } else if (c < 0x800) { n += 2; }
      else if (c >= 0xD800 && c <= 0xDBFF && i + 1 < s.length && (s.charCodeAt(i + 1) & 0xFC00) === 0xDC00) { n += 4; i++; }
      else { n += 3; }
    }
    return n;
  }

  // The band names, built from the house tokens: neutrals, the four tones of every seal, and the accents.
  function nombres(tokens, acentos) {
    var set = {};
    NEUTROS.forEach(function (n) { set[n] = true; });
    tokens.SEALS.forEach(function (s) { BANDAS.forEach(function (b) { set[s + '.' + b] = true; }); });
    Object.keys(acentos || {}).forEach(function (s) { BANDAS.forEach(function (b) { set[s + '.' + b] = true; }); });
    return set;
  }

  function igual(a, b) {
    if (a === b) { return true; }
    if (!a || !b || typeof a !== 'object' || typeof b !== 'object') { return false; }
    if (Array.isArray(a) !== Array.isArray(b) || (!Array.isArray(a) && !plano(a))) { return false; }
    var ka = Object.keys(a);
    return ka.length === Object.keys(b).length && ka.every(function (k) { return tiene(b, k) && igual(a[k], b[k]); });
  }

  function sonido(o) {
    if (!esObjeto(o)) { return null; }
    if (cadena(o.sound) && o.sound.indexOf('NO_DATA') !== 0) { return 'ok'; }
    if (cadena(o.sound) && /^NO_DATA:\s*\S/.test(o.sound)) { return o.sound; }
    if (cadena(o.soundCause)) { return 'NO_DATA: ' + o.soundCause; }
    return null;
  }

  // valida(frame, names) → { ok, bytes, causes, fields }. Fail-closed: any doubt is a cause.
  function valida(frame, nm) {
    var causas = [], bytes = null, json;
    try {
      json = JSON.stringify(frame);
      if (typeof json === 'string') {
        bytes = bytesUtf8(json);
        if (!igual(frame, JSON.parse(json))) { causas.push('not serializable'); }
      } else { causas.push('not serializable'); }
    } catch (e) {
      causas.push(/circular/i.test(e.message) ? 'not serializable: cycle' : 'not serializable: ' + e.message);
    }
    if (bytes !== null && bytes >= TOPE) { causas.push('NO_DATA: frame over TOPE bytes'); }
    if (esObjeto(frame) && tiene(frame, 'seal') && SELLOS.indexOf(frame.seal) < 0) {
      causas.push('seal outside the doctrine labels: ' + String(frame.seal));
    }
    if (!esObjeto(frame)) {
      causas.push('not an object: frame');
      return { ok: false, bytes: bytes, causes: sinRepetir(causas), fields: {} };
    }
    var atoms = Array.isArray(frame.atoms) ? frame.atoms : [], usados = [];
    atoms.forEach(function (a, ia) {
      var items = esObjeto(a) && Array.isArray(a.i) ? a.i.filter(esObjeto) : [], noNeutro = false;
      items.forEach(function (it) {
        CLAVES_COLOR.forEach(function (k) {
          if (!tiene(it, k)) { return; }
          var v = it[k];
          if (typeof v !== 'string' || !tiene(nm, v) || /#|rgb\(|hsl\(/.test(v)) {
            causas.push('color without named band: ' + String(v)); return;
          }
          if (usados.indexOf(v) < 0) { usados.push(v); }
          if (NEUTROS.indexOf(v) < 0) { noNeutro = true; }
        });
      });
      var conTexto = (esObjeto(a) && cadena(a.r)) || items.some(function (it) { return it.o === 'text'; });
      if (noNeutro && !conTexto) { causas.push('color without text: atom ' + ia); }
    });
    var declaradas = Array.isArray(frame.bands) ? frame.bands : [];
    declaradas.forEach(function (n) { if (typeof n !== 'string' || !tiene(nm, n)) { causas.push('color without named band: ' + String(n)); } });
    usados.forEach(function (u) { if (declaradas.indexOf(u) < 0) { causas.push('band not declared in frame.bands: ' + u); } });
    var sFrame = sonido(frame), sAtomos = atoms.map(sonido), sounds = 'NO_DATA: sound not declared in frame or atoms';
    if (sFrame !== null) { sounds = sFrame; }
    else if (sAtomos.length && sAtomos.every(function (x) { return x !== null; })) {
      sounds = sAtomos.filter(function (x) { return x !== 'ok'; })[0] || 'ok';
    }
    var fields = {
      elements: atoms.length ? 'ok' : 'NO_DATA: atoms empty',
      colors: Array.isArray(frame.bands) ? 'ok' : 'NO_DATA: bands not an array',
      changes: Array.isArray(frame.change) ? 'ok' : 'NO_DATA: change not an array',
      sounds: sounds,
      text: atoms.some(function (a) { return esObjeto(a) && cadena(a.r); }) ? 'ok' : 'NO_DATA: no atom with non-empty r',
      state: Number.isFinite(frame.t) ? 'ok' : 'NO_DATA: t not numeric'
    };
    ['elements', 'colors', 'state'].forEach(function (k) { if (fields[k] !== 'ok') { causas.push(fields[k]); } });
    return { ok: causas.length === 0, bytes: bytes, causes: sinRepetir(causas), fields: fields };
  }

  var Acho = Object.freeze({ TOPE: TOPE, SELLOS: SELLOS, bytesUtf8: bytesUtf8, nombres: nombres, valida: valida });
  if (typeof module === 'object' && module.exports) { module.exports = Acho; } else { raiz.Acho = Acho; }
})(typeof module === 'object' && module.exports ? this : (this || window));
