(function (raiz) {
  'use strict';
  var K = typeof module === 'object' && module.exports ? require('./comic_tokens.js') : raiz.AtlasComicTokens;
  var N = K.NEUTRAL;
  var S = K.STROKE;
  var KINDS = Object.freeze(['stamp', 'badge', 'button', 'chip']);
  var SIN_AUDIO = 'no audio contract yet';

  function noData(cause, texto, p) {
    var x = (p && p.x) || 0, y = (p && p.y) || 0, w = 16 + 7 * texto.length;
    return {
      kind: 'NO_DATA', cause: cause,
      items: [
        { op: 'rect', x: x, y: y, w: w, h: 28, fill: N.paper, stroke: N.ink, lw: S.borderSmall, shadow: S.shadowSmall },
        { op: 'text', x: x + 8, y: y + 18, text: texto, size: 12, weight: 'bold', align: 'left', fill: N.ink }
      ],
      read: texto, sound: 'NO_DATA', soundCause: cause
    };
  }

  function tarjeta(p, base, lw, sombra, texto, w, h, size) {
    return [
      { op: 'rect', x: p.x, y: p.y, w: w, h: h, fill: N.paper, stroke: N.ink, lw: lw, shadow: sombra },
      { op: 'rect', x: p.x, y: p.y, w: 8, h: h, fill: base, stroke: null, lw: 0, shadow: null },
      { op: 'text', x: p.x + 18, y: p.y + h / 2, text: texto, size: size, weight: 'bold', align: 'left', fill: N.ink }
    ];
  }

  function atom(kind, props, t) {
    var p = props || {};
    var tiempo = typeof t === 'number' ? t : 0;
    if (KINDS.indexOf(kind) < 0) { return noData('unknown atom kind', 'NO_DATA · unknown atom', p); }
    var read;
    var items;
    if (kind === 'button') {
      if (!(p.w >= 44 && p.h >= 44)) { return noData('target < 44px', 'NO_DATA · target < 44px', p); }
      read = p.label;
      items = [
        { op: 'rect', x: p.x, y: p.y, w: p.w, h: p.h, fill: N.paper, stroke: N.ink, lw: S.border, shadow: p.pressed ? S.shadowSmall : S.shadow },
        { op: 'text', x: p.x + p.w / 2, y: p.y + p.h / 2, text: p.label, size: 16, weight: 'bold', align: 'center', fill: N.ink }
      ];
    } else {
      var tono = K.tone(p.seal);
      if (!tono.bands) { return noData('unknown seal', 'NO_DATA · unknown seal', p); }
      if (kind === 'badge') {
        var r = p.r || 28;
        read = tono.label + ' · ' + p.value;
        items = [
          { op: 'circle', x: p.x, y: p.y, r: r, fill: tono.bands.base, stroke: N.ink, lw: S.border, shadow: S.shadow },
          { op: 'text', x: p.x, y: p.y + 6, text: String(p.value), size: 18, weight: 'bold', align: 'center', fill: N.ink },
          { op: 'text', x: p.x, y: p.y + r + 16, text: tono.label, size: 11, weight: 'bold', align: 'center', fill: N.ink }
        ];
      } else if (kind === 'stamp') {
        var P = p._period || 16;
        var dx = 4 + 1.5 * Math.cos(2 * Math.PI * ((tiempo % P) / P));
        var latido = p.seal === 'LIVE' && !p.reducedMotion;
        read = tono.label + ' · ' + p.text;
        items = tarjeta(p, tono.bands.base, S.border, latido ? [dx, dx] : S.shadow, read, p.w || 220, p.h || 48, 16);
      } else {
        read = tono.label + ' · ' + p.label;
        items = tarjeta(p, tono.bands.base, S.borderSmall, S.shadowSmall, read, p.w || 160, p.h || 32, 13);
      }
    }
    return { kind: kind, items: items, read: read, sound: 'NO_DATA', soundCause: SIN_AUDIO };
  }

  function figura(ctx, it, ox, oy, fill, stroke) {
    ctx.beginPath();
    if (it.op === 'circle') { ctx.arc(it.x + ox, it.y + oy, it.r, 0, 2 * Math.PI); }
    else { ctx.rect(it.x + ox, it.y + oy, it.w, it.h); }
    ctx.fillStyle = fill;
    ctx.fill();
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = it.lw; ctx.stroke(); }
  }

  function paint(ctx, items) {
    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      if (it.op === 'text') {
        ctx.font = it.weight + ' ' + it.size + 'px sans-serif';
        ctx.textAlign = it.align;
        ctx.textBaseline = 'middle';
        ctx.fillStyle = it.fill;
        ctx.fillText(it.text, it.x, it.y);
      } else {
        if (it.shadow) { figura(ctx, it, it.shadow[0], it.shadow[1], N.ink, null); }
        figura(ctx, it, 0, 0, it.fill, it.stroke);
      }
    }
  }

  var AtlasComicAtoms = Object.freeze({ KINDS: KINDS, atom: atom, paint: paint });
  if (typeof module === 'object' && module.exports) { module.exports = AtlasComicAtoms; }
  else { raiz.AtlasComicAtoms = AtlasComicAtoms; }
})(typeof module === 'object' && module.exports ? this : (this || window));
