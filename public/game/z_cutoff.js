(function (root) {
  'use strict';
  var MIN = 20, MAX = 100, STEP = 5;
  var DETENTS = [100, 50, 25];
  var DEPTH = {
    LIVE: 20, MEDIDO: 20, STATIC: 20, ERROR: 20, FIRMADO: 20, PROPUESTA: 20, REQUIERE_FIRMA: 20, HITL: 20,
    SIMULATED: 50, EMULADO: 50, STALE: 50, DECLARADO: 50,
    NO_DATA: 80
  };
  var LAYER = { 20: 'measured', 50: 'emulated', 80: 'no_data' };
  var z = MAX, listeners = [];

  function clamp(v) {
    var n = Math.round(Number(v));
    if (!Number.isFinite(n)) { return MAX; }
    return Math.min(MAX, Math.max(MIN, n));
  }
  function depth(seal) {
    return Object.prototype.hasOwnProperty.call(DEPTH, seal) ? DEPTH[seal] : DEPTH.NO_DATA;
  }
  function visibleAt(seal, value) { return clamp(value) >= depth(seal); }
  function hidden(value) {
    var v = clamp(value);
    return [50, 80].filter(function (d) { return v < d; }).map(function (d) { return LAYER[d]; });
  }
  function label(value) {
    var v = clamp(value), h = hidden(v);
    var name = h.length === 0 ? 'everything' : h.length === 1 ? 'without NO_DATA' : 'measured only';
    return 'Depth ' + (v / 100).toFixed(2) + ': ' + name;
  }
  function set(value) {
    var v = clamp(value);
    if (v === z) { return z; }
    z = v;
    listeners.slice().forEach(function (f) { try { f(z); } catch (e) { } });
    return z;
  }
  function listen(f) { if (typeof f === 'function') { listeners.push(f); } }

  var api = {
    MIN: MIN, MAX: MAX, STEP: STEP, DETENTS: DETENTS.slice(),
    clamp: clamp, depth: depth, visibleAt: visibleAt, hidden: hidden, label: label,
    visible: function (seal) { return visibleAt(seal, z); },
    value: function () { return z; },
    set: set, listen: listen
  };
  if (typeof module === 'object' && module.exports) { module.exports = api; } else { root.AtlasZ = api; }
})(this);
