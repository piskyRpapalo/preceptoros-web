(function (root) {
  'use strict';
  function project(q, r) {
    if (!Number.isSafeInteger(q) || !Number.isSafeInteger(r) || Math.abs(q) > 1000000 || Math.abs(r) > 1000000) throw Error('invalid cell');
    var x = 48 * q, y = 12 * q + 24 * r;
    if (!Number.isSafeInteger(x) || !Number.isSafeInteger(y)) throw Error('cell out of range');
    return { x: x, y: y };
  }
  if (typeof module === 'object' && module.exports) module.exports = project;
  else root.HexProjection = project;
})(typeof globalThis === 'object' ? globalThis : this);
