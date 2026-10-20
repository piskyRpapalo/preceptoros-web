(function (root) {
  'use strict';
  var node = typeof module === 'object' && module.exports;
  var V = 'preceptoros.lexical-projection/1', TOPE = 1024;
  function esObj(x) { return x !== null && typeof x === 'object' && !Array.isArray(x); }
  function esNum(x) { return typeof x === 'number' && isFinite(x); }
  function resumenItem(it) {
    if (!esObj(it)) { return { o: 'NO_DATA', causa: 'item not object' }; }
    var r = { o: typeof it.o === 'string' ? it.o : 'NO_DATA' };
    if (it.o === 'letters' && typeof it.tx === 'string') { r.tx = it.tx; }
    if (esNum(it.x)) { r.x = Math.round(it.x); }
    if (esNum(it.y)) { r.y = Math.round(it.y); }
    if (esNum(it.r)) { r.r = Math.round(it.r); }
    if (typeof it.f === 'string') { r.f = it.f; }
    if (typeof it.as === 'string') { r.as = it.as; }
    if (esNum(it.sz)) { r.sz = it.sz; }
    if (esNum(it.v) && esNum(it.max)) { r.v = it.v; r.max = it.max; }
    if (Array.isArray(it.chances)) { r.ch = it.chances.length; }
    if (Array.isArray(it.bands)) { r.b = it.bands.length; }
    return r;
  }
  function resumenAtom(a) {
    if (!esObj(a)) { return { k: 'NO_DATA', i: [] }; }
    var items = Array.isArray(a.i) ? a.i.map(resumenItem) : [];
    var r = { k: typeof a.k === 'string' ? a.k : 'NO_DATA', i: items };
    if (typeof a.r === 'string') { r.r = a.r; }
    return r;
  }
  function proyectar(frame, extra) {
    if (!esObj(frame)) {
      return { v: V, st: 'ERROR', causa: 'frame not object', bytes: 0 };
    }
    var atoms = Array.isArray(frame.atoms) ? frame.atoms.map(resumenAtom) : [];
    var p = {
      v: V,
      id: typeof frame.id === 'string' ? frame.id : 'NO_DATA',
      t: typeof frame.t === 'string' ? frame.t : 'NO_DATA',
      sound: typeof frame.sound === 'string' ? frame.sound : 'NO_DATA',
      motion: typeof frame.motion === 'string' ? frame.motion : 'NO_DATA',
      n: atoms.length,
      a: atoms
    };
    if (esObj(extra)) {
      if (esNum(extra.ciclo)) { p.ciclo = extra.ciclo; }
      if (typeof extra.st === 'string') { p.st = extra.st; }
      if (typeof extra.sound === 'string') { p.sound = extra.sound; }
      if (typeof extra.h === 'string') { p.h = extra.h; }
    }
    var json = JSON.stringify(p);
    var bytes = Buffer ? Buffer.byteLength(json, 'utf8') : json.length;
    if (bytes >= TOPE) {
      return { v: V, st: 'NO_DATA', causa: 'lexical projection over 1024 B', bytes: bytes };
    }
    return { v: V, st: 'LIVE', bytes: bytes, p: p };
  }
  function proyectarEscena(S, id, extra) {
    if (!esObj(S) || typeof S.frame !== 'function') {
      return { v: V, st: 'NO_DATA', causa: 'scene not loaded', bytes: 0 };
    }
    var modo = esObj(extra) && typeof extra.modo === 'string' ? extra.modo : 'kids';
    var T = esObj(S.TEXT) ? S.TEXT[modo] || S.TEXT.kids : null;
    var texto = esObj(T) && esObj(T[id]) ? T[id] : null;
    var enrich = esObj(extra) ? Object.assign({}, extra) : {};
    if (texto && typeof texto.sound === 'string') { enrich.sound = texto.sound; }
    if (texto && typeof texto.h === 'string') { enrich.h = texto.h; }
    try { return proyectar(S.frame(id), enrich); }
    catch (e) { return { v: V, st: 'NO_DATA', causa: e.message, bytes: 0 }; }
  }
  var AtlasLexicalProjector = Object.freeze({
    V: V, TOPE: TOPE,
    proyectar: proyectar,
    proyectarEscena: proyectarEscena
  });
  if (node) { module.exports = AtlasLexicalProjector; } else { root.AtlasLexicalProjector = AtlasLexicalProjector; }
})(typeof module === 'object' && module.exports ? this : (this || window));
