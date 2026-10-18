(function (root) {
  'use strict';
  var GLYPHS = Object.freeze({"A":"0e42 428e 2969","B":"020e 025274765808 08688a8c6e0e","C":"846222050b2e6e8c","D":"020e 0242757b4e0e","E":"8202 020e 0e8e 0868","F":"8202 020e 0868","G":"846222050b2e6e8c89 8959","H":"020e 828e 0888","I":"424e 2262 2e6e","J":"828b5e2e0b","K":"020e 8209 378e","L":"020e 0e8e","M":"0e02 0248 4882 828e","N":"0e02 028e 8e82","O":"*4273887d4e1d0813","P":"020e 025274765808","Q":"*4273887d4e1d0813 5b8e","R":"020e 025274765808 488e","S":"835222041748798c6e2e0d","T":"0282 424e","U":"020b2e6e8b82","V":"024e 4e82","W":"022e 2e47 476e 6e82","X":"028e 820e","Y":"0248 8248 484e","Z":"0282 820e 0e8e","Ñ":"0e02 028e 8e82 11305170","0":"*4273887d4e1d0813 642c","1":"24424e 2e6e","2":"04226284860e8e","3":"03326284865838 588a8c6e2e0d","4":"6e62 620a 0a8a","5":"8212 1207 0757898c6e2e0d","6":"7233080b2e6e8c8a68280a","7":"0282 823e","8":"*427376481613 *488a8c4e0c0a","9":"86682806042262858a5e1e",".":"4e4e",",":"4d3f","!":"424a 4e4e","?":"0422628486494a 4e4e","-":"1878","·":"4848",":":"4646 4d4d","%":"0e82 *22332513 *6b7d6e5d","a":"*37696c3e0c09 676e","b":"020e *37696c3e0c09","c":"684727090c2e4e6d","d":"*37696c3e0c09 626e","e":"0a6a694727090c2e4e6d","f":"635232242e 0757","g":"*37696c3e0c09 676f4h1h0g","h":"020e 0a2757696e","i":"373e 3434","j":"474f3h0h 4444","k":"020e 670b 2a6e","l":"222c4e","m":"070e 0927494e 4967898e","n":"070e 0a2757696e","o":"*37696c3e0c09","p":"070h *37696c3e0c09","q":"*37696c3e0c09 676h","r":"070e 0a2757","s":"6837081a5b6d3e0d","t":"232c4e5e 0757","u":"070c2e4e6c 676e","v":"073e 3e67","w":"072e 2e49 496e 6e87","x":"076e 670e","y":"073d 672h0h","z":"0767 670e 0e6e","ñ":"070e 0a2757696e 14234453"});
  var B36 = '0123456789abcdefghijklmnopqrstuvwxyz';
  var CAP = 12, GAP = 2.5, SPACE = 5;
  var cache = Object.create(null);

  function num(v, d) { return typeof v === 'number' && isFinite(v) ? v : d; }
  function r2(v) { return Math.round(v * 100) / 100; }

  function decode(code) {
    return String(code).split(' ').map(function (s) {
      var closed = s.charAt(0) === '*', body = closed ? s.slice(1) : s, pts = [], i;
      for (i = 0; i + 1 < body.length; i += 2) { pts.push([Number(body.charAt(i)), B36.indexOf(body.charAt(i + 1)) - 2]); }
      if (pts.length === 2 && pts[0][0] === pts[1][0] && pts[0][1] === pts[1][1]) { pts[1] = [pts[1][0] + 0.05, pts[1][1]]; }
      return { closed: closed, pts: pts };
    });
  }

  function glyph(ch) {
    if (!Object.prototype.hasOwnProperty.call(GLYPHS, ch)) { return null; }
    if (!cache[ch]) {
      var strokes = decode(GLYPHS[ch]), lo = 8, hi = 0;
      strokes.forEach(function (s) { s.pts.forEach(function (p) { lo = Math.min(lo, p[0]); hi = Math.max(hi, p[0]); }); });
      cache[ch] = { strokes: strokes, lo: lo, adv: Math.max(hi - lo, 1) };
    }
    return cache[ch];
  }

  function missing(text) {
    return Array.from(String(text)).filter(function (ch) { return ch !== ' ' && !glyph(ch); });
  }

  function layout(text) {
    var placed = [], x = 0, first = true;
    Array.from(String(text)).forEach(function (ch) {
      if (ch === ' ') { x += SPACE; return; }
      var g = glyph(ch);
      if (!g) { return; }
      if (!first) { x += GAP; }
      placed.push({ g: g, x: x - g.lo });
      x += g.adv;
      first = false;
    });
    return { placed: placed, width: x };
  }

  function letters(p) {
    var x = num(p.x, 0), y = num(p.y, 0), sz = num(p.sz, 40), rot = num(p.rot, 0) * Math.PI / 180;
    var k = sz / CAP, cs = Math.cos(rot), sn = Math.sin(rot);
    var fill = p.f || 'paper', edge = p.s || 'comic yellow.base';
    var sh = Array.isArray(p.sh) ? p.sh : [0.08 * sz, 0.08 * sz, 'cyan'];
    var core = 0.17 * sz, outer = core + 2 * Math.max(2, 0.06 * sz);
    var lay = layout(typeof p.tx === 'string' ? p.tx : ''), ox = p.al === 'left' ? 0 : lay.width / 2;
    var strokes = [];
    lay.placed.forEach(function (it) {
      it.g.strokes.forEach(function (s) {
        strokes.push({ closed: s.closed, pts: s.pts.map(function (q) {
          var u = (it.x + q[0] - ox) * k, v = (q[1] - CAP / 2) * k;
          return [x + u * cs - v * sn, y + u * sn + v * cs];
        }) });
      });
    });
    function pass(band, lw, dx, dy) {
      return strokes.map(function (s) {
        return { o: 'ribbon', f: null, s: band, d: 0, lw: r2(lw), closed: s.closed,
          pts: s.pts.map(function (q) { return [r2(q[0] + dx), r2(q[1] + dy)]; }) };
      });
    }
    return pass(sh[2], outer, num(sh[0], 0), num(sh[1], 0)).concat(pass(edge, outer, 0, 0), pass(fill, core, 0, 0));
  }

  var WORDS = { letters: letters };
  var core = null;
  if (typeof module === 'object' && module.exports) {
    try { core = require('./bubble_language.js'); } catch (e) { core = null; }
  } else {
    core = root.AtlasBubble || null;
  }
  if (core && typeof core.define === 'function') { core.define('letters', letters); }

  var API = Object.freeze({ GLYPHS: GLYPHS, decode: decode, missing: missing, layout: layout, WORDS: WORDS });
  if (typeof module === 'object' && module.exports) { module.exports = API; }
  else { root.AtlasBubbleLetters = API; }
})(typeof module === 'object' && module.exports ? this : (this || window));
