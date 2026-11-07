// Place names. PURE: no DOM, no network, no clock, no randomness. A place is the map chunk holding a cell
// (map_chart.js chunkOf, the chart radius): every visitor in the same chunk reads the same name, like a town.
(function (root) {
  'use strict';
  var C = root.AtlasMapCarta || (typeof require === 'function' ? require('./map_chart.js') : null);
  var RADIUS = 8;   // radius of public/map/chart.json; a case pins it
  var NO_DATA = 'NO_DATA: visitor position unavailable';
  var SYL = ['bel', 'dor', 'mir', 'tan', 'vex', 'lun', 'kor', 'sil', 'ran', 'tov', 'nem', 'zar', 'fen', 'gal', 'hax', 'jun',
    'pol', 'qua', 'rix', 'sum', 'tor', 'ul', 'vor', 'wen', 'yal', 'zim', 'ber', 'cad', 'dem', 'eth', 'fal', 'gor'];

  function mix(a, b) {
    var h = Math.imul(a | 0, 0x9E3779B1) + Math.imul((b | 0) + 0x632BE5AB, 0x85EBCA6B);
    h = Math.imul(h ^ (h >>> 15), 0x2C1B3C6D); h = Math.imul(h ^ (h >>> 12), 0x297A2D39);
    return (h ^ (h >>> 15)) >>> 0;
  }
  // name(q, r) → the place name of the chunk holding cell (q, r), or null for a cell that is not whole.
  function name(q, r) {
    if (!Number.isInteger(q) || !Number.isInteger(r)) { return null; }
    var c = C.chunkOf(q, r, RADIUS), h = mix(c[0], c[1]), n = 2 + (h >>> 31), s = '';
    for (var i = 0; i < n; i++) { s += SYL[(h >>> (i * 5)) & 31]; }
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
  // label(position) → 'Place · q, r' for the map heading, or the honest NO_DATA cause.
  function label(p) {
    var n = p && name(p.q, p.r);
    return n ? n + ' · ' + p.q + ', ' + p.r : NO_DATA;
  }
  var NOTE = 'Generated place name: same place, same name; not an identity';
  // mark(el, p, prefix) → writes the heading into el; a generated name carries its note for pointer and screen reader.
  function mark(el, p, prefix) {
    var ok = label(p) !== NO_DATA;
    el.textContent = (prefix || '') + label(p);
    if (ok) { el.title = NOTE; el.setAttribute('aria-description', NOTE); } else { el.removeAttribute('title'); el.removeAttribute('aria-description'); }
  }
  var api = { name: name, label: label, mark: mark, NOTE: NOTE, RADIUS: RADIUS, NO_DATA: NO_DATA };
  if (typeof module === 'object' && module.exports) { module.exports = api; } else { root.AtlasPlaceName = api; }
})(typeof window !== 'undefined' ? window : globalThis);
