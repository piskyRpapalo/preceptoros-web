// preceptoros.org · the landing's three doors (and the web/app pair of [2]), redrawn in the house bubble language (P3 [1d],
// Sovereign decree 2026-10-26). Only the presentation changes: each door keeps its real link and its
// text. A speech bubble with a small sea wave and the title in comic letters is drawn on top; the
// title stays in the page for screen readers and for anyone without JavaScript.
// Reuse only: bubble_language.js + bubble_letters.js + comic_atoms.js and the house bands (paper, ink,
// cyan). No font, no palette, no raw colour lives here.
(function (raiz) {
  'use strict';
  var ANCHO = 320, ALTO = 96;

  // The bubble outline: a fixed ellipse of 24 points (no randomness, so no on-demand module is needed).
  var ORLA = [];
  for (var i = 0; i < 24; i++) { ORLA.push([Math.round(160 + 150 * Math.cos(i * Math.PI / 12)), Math.round(44 + 38 * Math.sin(i * Math.PI / 12))]); }
  // The small sea wave under the title: one and a half periods of a fixed sine, as an open ribbon.
  var OLA = [];
  for (var j = 0; j <= 12; j++) { OLA.push([136 + j * 4, Math.round((64 + 3 * Math.sin(j * Math.PI / 4)) * 10) / 10]); }

  // The bubble frame of one door: pure data, under 1,024 bytes. `espejo` turns the tail to the right,
  // so the web and the app ([2], 2026-10-26) are two speech bubbles facing each other.
  function marco(titulo, espejo) {
    var cola = [[58, 66], [36, 94], [92, 72]].map(function (p) { return espejo ? [ANCHO - p[0], p[1]] : p; });
    return { v: 'preceptoros.bubble/1', id: 'door', t: 0, cv: [ANCHO, ALTO], atoms: [
      { k: 'bubble', r: 'a speech bubble', i: [
        { o: 'ribbon', pts: cola, closed: true, f: 'paper', s: 'ink', lw: 3 },
        { o: 'ribbon', pts: ORLA, closed: true, f: 'paper', s: 'ink', lw: 3 }] },
      { k: 'sea', r: 'a small wave', i: [{ o: 'ribbon', pts: OLA, closed: false, s: 'cyan', lw: 2.5 }] },
      { k: 'title', r: titulo, i: [{ o: 'letters', x: 160, y: 42, tx: titulo, sz: 18, f: 'paper', s: 'ink', sh: [1.5, 1.5, 'cyan'] }] }] };
  }

  if (typeof module === 'object' && module.exports) { module.exports = { marco: marco, ANCHO: ANCHO, ALTO: ALTO }; return; }

  function dibuja() {
    var B = raiz.AtlasBubble, P = raiz.AtlasComicAtoms, doc = raiz.document;
    if (!B || !P || !raiz.AtlasBubbleLetters) { return; }
    var puertas = doc.querySelectorAll('#doors .door, #web-app .side'), hechas = 0;
    Array.prototype.forEach.call(puertas, function (a) {
      var b = a.querySelector('b'), titulo = b ? b.textContent : '';
      if (!titulo || a.querySelector('.door-art')) { return; }
      var c = doc.createElement('canvas'), dpr = Math.min(2, raiz.devicePixelRatio || 1);
      c.className = 'door-art'; c.setAttribute('aria-hidden', 'true');
      c.width = ANCHO * dpr; c.height = ALTO * dpr;
      try {
        var g = c.getContext('2d');
        g.setTransform(dpr, 0, 0, dpr, 0, 0);
        P.paint(g, B.compile(marco(titulo, a.getAttribute('data-lado') === 'app')));
      } catch (e) { return; }
      a.insertBefore(c, a.firstChild);
      hechas++;
    });
    if (hechas === puertas.length && hechas) { doc.documentElement.classList.add('con-burbujas'); }
  }
  if (raiz.document.readyState === 'loading') { raiz.document.addEventListener('DOMContentLoaded', dibuja); } else { dibuja(); }
})(typeof module === 'object' && module.exports ? this : (this || window));
