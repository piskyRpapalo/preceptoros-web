// WAVE-VISUAL-01 · Piece A: the mathematical identity of a measured wave.
// Read-only adapter over the wave the roll already produced (gacha.tirada): the edge count is the measured
// `aristas` field, never recomputed from geometry and never re-rolled. A name is presentation; the id is the
// stable machine word. Prefix and suffix are conserved, not translated, so the lore stays the signed one.
// English UI names (AGENTS.md vocabulary). Pure: no DOM, no clock, no randomness, no network, no storage.
// Presentation only: it never changes odds, stats, rarity or the result of the engine.
(function (root) {
  'use strict';
  var SCHEMA = 'atlas.wave_name/1', HEX64 = /^[0-9a-f]{64}$/, TC = /^tc[1-4]$/;
  // 3..12 measured edges get their own name; 13..16 (the live TC tables reach 16) are one Leviathan.
  var TABLE = { 3: 'Trigon', 4: 'Quadrant', 5: 'Pentad', 6: 'Hexant', 7: 'Heptant', 8: 'Octave', 9: 'Ennead', 10: 'Decad', 11: 'Hendecad', 12: 'Dodecad' };
  var OVER = { name: 'Leviathan', id: 'wave.leviathan' };
  var MIN = 3, MAX = 16;

  // Pure: edges(t) → the measured edge count, or null when the wave carries no usable one.
  function edges(t) {
    if (!t || typeof t !== 'object') { return null; }
    return Number.isSafeInteger(t.aristas) && t.aristas >= MIN && t.aristas <= MAX ? t.aristas : null;
  }
  // Pure: shape(t) → { ok, id, name, edges } or { ok: false, cause }. No fallback name is invented.
  function shape(t) {
    if (!t || typeof t !== 'object') { return { ok: false, cause: 'troop_missing' }; }
    if (!Number.isSafeInteger(t.aristas)) { return { ok: false, cause: 'edges_missing' }; }
    if (t.aristas < MIN || t.aristas > MAX) { return { ok: false, cause: 'edges_out_of_range' }; }
    var n = t.aristas, s = n > 12 ? OVER : { name: TABLE[n], id: 'wave.' + TABLE[n].toLowerCase() };
    return { ok: true, schema: SCHEMA, id: s.id + '.' + n, name: s.name, edges: n };
  }
  // Pure: nombre(t) → the short title for an existing hook (army-wave-panel.js asks renderOnda.nombre), or null.
  function nombre(t) {
    var s = shape(t);
    return s.ok ? s.name + ' · ' + s.edges + ' edges' : null;
  }
  // Pure: describe(t) → the full machine record, only for a wave with measured provenance (seed and tier).
  function describe(t) {
    var s = shape(t);
    if (!s.ok) { return s; }
    if (!t.semilla || !HEX64.test(t.semilla) || !t.tc || !TC.test(t.tc) || typeof t.rareza !== 'string' || !t.rareza) {
      return { ok: false, cause: 'provenance_missing' };
    }
    return { ok: true, schema: SCHEMA, id: s.id, name: s.name, edges: s.edges, tc: t.tc, rarity: t.rareza,
             prefix: typeof t.prefijo === 'string' && t.prefijo ? t.prefijo : null,
             suffix: typeof t.sufijo === 'string' && t.sufijo ? t.sufijo : null };
  }
  // Pure: label(t) → one human line that keeps the affixes; null when the wave has no identity to state.
  function label(t) {
    var d = describe(t);
    if (!d.ok) { return null; }
    var affix = [d.prefix, d.suffix].filter(Boolean).join(' ');
    return d.name + ' · ' + d.edges + ' edges · ' + d.tc + ' · ' + d.rarity + (affix ? ' · ' + affix : '');
  }

  var AtlasWaveNames = { SCHEMA: SCHEMA, TABLE: TABLE, OVER: OVER, MIN: MIN, MAX: MAX,
                         edges: edges, shape: shape, nombre: nombre, describe: describe, label: label };
  if (typeof module === 'object' && module.exports) { module.exports = AtlasWaveNames; }
  root.AtlasWaveNames = AtlasWaveNames;
})(typeof window !== 'undefined' ? window : globalThis);
