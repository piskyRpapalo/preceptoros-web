// Night by default (Sovereign, 2026-11-23: «el color oscuro por defecto en la web, como en la app»). Each Acho token
// --a<hex> keeps its role and takes its night value; localStorage ow-theme=light keeps the day palette for whoever chose
// it (Settings › Day or night colours). Loaded by gamepad.js right after it paints the day tokens.
(function (root) {
  'use strict';
  function ACHO() { return (root.AtlasGamepad && root.AtlasGamepad.ACHO) || ''; }
  // Dark by default, like the app (Sovereign, 2026-11-23): each token keeps its role and takes its night value.
  // localStorage ow-theme=light keeps the day palette for whoever chose it.
  var NIGHT = '04334a0c2533 0b6e8f3aa0c0 1d1b26ece7f8 fffdf6241e34 3d3950cfc8e6 ffe58a4a3d10 d49a1ce8b44a b8401ae9774f b8f0a81e4a2c ' +
    '3f9a3a6cc466 1f7a326fd98a a8e3ff17405a 2a8fc463b9ec 0b5d9a143a5e ffc2b35a2a24 d0573dec8068 b8331cec6d55 dcc8ff3a2c63 7a52c7b49cf2 ' +
    '5b2fb0a88cf2 ffd0e6552442 c44d8ae683b5 a3266ad96fa3 e6e8ef2b2d3c 7c82969aa0b5 3d4252c0c5d6 157a4552c98b 4a4558bdb6d3 f4ecda1f1a2c ' +
    'e6dbc32b2440 8a7a638f86a8 fffaf018141f b9ab905c5276 ddd2ba332b49 c8b99c4a4062 d8be78e2cc8e';
  var NIGHT_MAP = {}; NIGHT.split(' ').forEach(function (p) { NIGHT_MAP[p.slice(0, 6)] = p.slice(6); });
  // theme() → 'dark' | 'light'; theme(name) paints the tokens, keeps the choice on this device and returns it.
  function theme(name) {
    var ls = null; try { ls = root.localStorage || null; } catch (e) { ls = null; }
    if (name !== 'dark' && name !== 'light') { try { return ls && ls.getItem('ow-theme') === 'light' ? 'light' : 'dark'; } catch (e) { return 'dark'; } }
    if (name === 'light' || (ls && ls.getItem('ow-theme'))) { try { ls.setItem('ow-theme', name); } catch (e) { /* kept for this visit only */ } }
    if (root.document) {
      var de = root.document.documentElement, night = name === 'dark';
      ACHO().split(' ').forEach(function (h) { de.style.setProperty('--a' + h, '#' + (night && NIGHT_MAP[h] ? NIGHT_MAP[h] : h)); });
      de.dataset.acho = name; de.style.colorScheme = name;
    }
    return name;
  }
  theme(theme());
  var api = { theme: theme, NIGHT_MAP: NIGHT_MAP };
  if (typeof module === 'object' && module.exports) { module.exports = api; }
  root.AtlasNight = api;
})(typeof window !== 'undefined' ? window : globalThis);
