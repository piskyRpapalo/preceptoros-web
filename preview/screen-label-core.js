(function (root) {
  'use strict';
  function clamp(value) {
    if (!Number.isFinite(value)) throw new TypeError('finite zoom required');
    return Math.max(0.6, Math.min(3, value));
  }
  function place(q, r, zoom, origin) {
    const z = clamp(zoom);
    return { x: origin.x + z * (48 * q + 24 * r), y: origin.y + z * 12 * r };
  }
  function hit(box, x, y) {
    return x >= box.left && x < box.right && y >= box.top && y < box.bottom;
  }
  const api = Object.freeze({ clamp, place, hit });
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.ScreenLabels = api;
})(globalThis);
