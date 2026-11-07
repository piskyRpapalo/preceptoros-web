// Skin tokens · the one hexagonal skin, down to the fonts (F0 plan, slice v).
// The skin of map, colony, app and terminal hangs from the LIVE OpenWorld floor: the acho
// hex prisms painted by map_painter.js from comic_tokens.js. Nothing here is a second palette:
// every colour is computed from those modules at load, and the motion is the floor's own sea.
// Pure: deterministic, no clock, no network, no DOM. Load after comic_tokens.js and map_painter.js.
(function (raiz) {
  'use strict';
  var common = typeof module === 'object' && module.exports;
  var MP = common ? require('./map_painter.js') : raiz.AtlasMapPainter;
  var CT = common ? require('./comic_tokens.js') : raiz.AtlasComicTokens;
  var C = MP.color;

  // Shade factors of the floor prism, as map_painter draws it with full light and no occlusion:
  // top face (0.9 + 0.1 * light z), and the side faces at the dark and lit ends (0.38 .. 0.78).
  var TOP = 0.966, SIDE_DARK = 0.38, SIDE_LIT = 0.78;
  var FONT_FAMILY = 'system-ui, sans-serif';   // measured canon of the OpenWorld body; no webfont
  var TOUCH_MIN = 44, FONT_MIN = 12;
  // decision mia (sin firma): type is half the hexagon radius (r = 32 -> 16 px), stroke one
  // sixteenth (r = 32 -> 2 px), line height 1.4 of the type.
  var FONT_RATIO = 0.5, STROKE_RATIO = 1 / 16, LINE_RATIO = 1.4;
  // The map projection (hex_projection.js: x = 48q, y = 12q + 24r) is a flat-top grid of
  // radius 32 squashed vertically.
  var MAP = { radius: 32, squash: 24 / (Math.sqrt(3) * 32), prismStep: MP.HSTEP };

  // tiles: one per floor band, in map order (water, sand, moss, rock), with its pattern
  // (colour is never the only cue), prism height and the three faces of the prism.
  var TILES = MP.bands().map(function (b) {
    return { kind: b.kind, pattern: b.pattern, height: b.h * MP.HSTEP, base: C.css(b.base),
      top: C.css(C.shade(b.base, TOP)), sideDark: C.css(C.shade(b.base, SIDE_DARK)),
      sideLit: C.css(C.shade(b.base, SIDE_LIT)) };
  });
  var INK = C.css(C.rgbOf(CT.NEUTRAL.ink)), PAPER = C.css(C.rgbOf(CT.NEUTRAL.paper));
  var OCEAN = C.css(C.rgbOf(CT.NEUTRAL.ocean)), CYAN = C.css(C.rgbOf(CT.NEUTRAL.cyan));

  function luminance(hex) {
    var m = /^#([0-9a-f]{6})$/i.exec(String(hex));
    if (!m) { return null; }
    var n = parseInt(m[1], 16);
    var c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(function (v) {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  }
  // WCAG 2.x contrast ratio, or null for a malformed colour.
  function contrast(a, b) {
    var la = luminance(a), lb = luminance(b);
    if (la === null || lb === null) { return null; }
    return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
  }
  // textOn(kind): the house text colour (ink or paper) that reads best on a tile top. Colours
  // are canon and never adjusted: where the best ratio is under 4.5:1 (measured: moss, rock)
  // the tile carries large text only (WCAG AA large text, >= 3:1), flagged `largeOnly`.
  function textOn(kind) {
    var t = TILES.filter(function (x) { return x.kind === kind; })[0];
    if (!t) { return null; }
    var ink = contrast(INK, t.top), paper = contrast(PAPER, t.top);
    var best = ink >= paper ? { color: INK, ratio: ink } : { color: PAPER, ratio: paper };
    best.largeOnly = best.ratio < 4.5;
    return best.ratio >= 3 ? best : { color: null, ratio: best.ratio, largeOnly: true, cause: 'no house text colour reaches 3:1' };
  }

  // metrics(r): r = hexagon circumradius in CSS px, 8..256. Flat-top regular hexagon.
  function metrics(r) {
    if (typeof r !== 'number' || !isFinite(r) || r < 8 || r > 256) { return null; }
    var hexHeight = Math.sqrt(3) * r, fontPx = Math.max(FONT_MIN, Math.round(r * FONT_RATIO));
    return { hexWidth: Math.round(2 * r), hexHeight: Math.round(hexHeight), fontPx: fontPx,
      lineHeightPx: Math.round(fontPx * LINE_RATIO), strokePx: Math.max(1, Math.round(r * STROKE_RATIO)),
      touchPx: Math.max(TOUCH_MIN, Math.round(hexHeight)) };
  }

  // motion(reduced): the floor's own sea, read from map_painter's frame; it stands still
  // under reduced motion. The movement is the key of the style, so it is never re-declared here.
  function motion(reduced) {
    return MP.frameOf({ c: [0, 0], cells: [] }, 0, reduced === true).sea;
  }
  // Same rule as state_frames.js transitionMs: reduced motion means no transition lasts.
  function transitionMs(ms, reducido) {
    return reducido === true ? 0 : Math.max(0, Math.min(1000, Math.round(ms)));
  }

  var AtlasSkinTokens = { TILES: TILES, INK: INK, PAPER: PAPER, OCEAN: OCEAN, CYAN: CYAN,
    FONT_FAMILY: FONT_FAMILY, TOUCH_MIN: TOUCH_MIN, MAP: MAP, metrics: metrics, motion: motion,
    transitionMs: transitionMs, contrast: contrast, textOn: textOn };
  if (common) { module.exports = AtlasSkinTokens; } else { raiz.AtlasSkinTokens = AtlasSkinTokens; }
})(typeof module === 'object' && module.exports ? this : (this || window));
