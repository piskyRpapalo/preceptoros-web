// preceptoros.org · the landing's two colours, from the house vocabulary (2026-10-25).
// The sheet holds no raw colour (barrido ratchet): --ink and --paper are the NEUTRAL pair of
// AtlasComicTokens, the same ink-on-paper the /face/ hub uses.
(function () {
  'use strict';
  var K = window.AtlasComicTokens && window.AtlasComicTokens.NEUTRAL;
  if (!K) { return; }
  document.documentElement.style.setProperty('--ink', K.ink);
  document.documentElement.style.setProperty('--paper', K.paper);
})();
