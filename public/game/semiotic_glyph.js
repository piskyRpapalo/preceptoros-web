
(function (root) {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  var COLORS = ['#E6A817', '#00D2FF', '#2ECC71', '#9B59B6', '#7F8C8D'];
  var NAMES = ['solar gold', 'signal cyan', 'community green', 'law violet', 'honest gray'];
  var SOUNDS = ['measured chord rising from 432 to 528 Hz', 'background pulse at 110 Hz', 'NO_DATA tone with cause'];
  var LINES = ['double boundary', 'dotted proposal', 'closed laboratory loop', 'six-point shared star'];
  var MOTION = ['stable orbit · nine-language check passed', 'static vibration', 'transport vector'];
  var audio = null;

  function normaliza(g) {
    return Array.isArray(g) && g.length === 4 && g.every(function (v, i) {
      return Number.isInteger(v) && v >= 0 && v <= (i ? (i === 1 ? 2 : i === 2 ? 3 : 2) : 4);
    }) ? g.slice() : null;
  }
  function describe(g, note) {
    g = normaliza(g);
    return g ? [NAMES[g[0]], SOUNDS[g[1]], LINES[g[2]], MOTION[g[3]], note || ''].filter(Boolean).join(' · ')
      : 'NO_DATA (glyph requires four measured dimensions)';
  }
  function node(tag, attrs) {
    var n = root.document.createElementNS(NS, tag);
    Object.keys(attrs || {}).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    return n;
  }
  function shape(svg, g, c) {
    var a = { fill: 'none', stroke: c, 'stroke-width': 4, 'stroke-linejoin': 'round' }, p;
    if (g[2] === 0) {
      p = node('path', Object.assign({}, a, { d: 'M50 8L88 22V49Q88 73 50 92Q12 73 12 49V22Z' })); svg.appendChild(p);
      svg.appendChild(node('path', Object.assign({}, a, { d: 'M50 17L80 28V49Q80 67 50 83Q20 67 20 49V28Z', 'stroke-width': 2 })));
      svg.appendChild(node('circle', { class: 'semio-package', cx: 38, cy: 48, r: 4, fill: '#EF4444' }));
      svg.appendChild(node('circle', { class: 'semio-package semio-package-two', cx: 62, cy: 48, r: 4, fill: '#EF4444' }));
    } else if (g[2] === 1) {
      svg.appendChild(node('circle', Object.assign({}, a, { class: 'semio-proposal', cx: 50, cy: 50, r: 34, 'stroke-dasharray': '3 7' })));
      svg.appendChild(node('circle', { cx: 50, cy: 50, r: 7, fill: c }));
    } else if (g[2] === 2) {
      svg.appendChild(node('path', Object.assign({}, a, { d: 'M50 14C80 14 80 48 50 48S20 82 50 82S80 48 50 48' })));
    } else {
      svg.appendChild(node('path', Object.assign({}, a, { d: 'M50 7L89 75H11Z M50 93L11 25H89Z' })));
    }
    var mover = node('g', { class: 'semio-motion semio-motion-' + g[3] });
    if (g[3] === 0) {
      mover.appendChild(node('circle', { cx: 50, cy: 50, r: 43, fill: 'none', stroke: c, 'stroke-width': 1.5, opacity: '.6' }));
      mover.appendChild(node('circle', { cx: 50, cy: 7, r: 4, fill: c }));
    } else if (g[3] === 1) {
      mover.appendChild(node('path', { d: 'M45 50L55 50', stroke: c, 'stroke-width': 5, 'stroke-linecap': 'round' }));
    } else {
      mover.appendChild(node('path', { d: 'M12 50H78M66 38L78 50L66 62', fill: 'none', stroke: c, 'stroke-width': 3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }));
      mover.appendChild(node('path', { d: 'M84 43L91 50L84 57L77 50Z', fill: c }));
    }
    svg.appendChild(mover);
  }

  function sound(kind) {
    try {
      var C = root.AudioContext || root.webkitAudioContext, c = audio || (audio = new C()), t = c.currentTime, g = c.createGain();
      g.gain.value = 0.045; g.connect(c.destination);
      function tone(hz, start, end) { var o = c.createOscillator(); o.type = 'sine'; o.frequency.value = hz; o.connect(g); o.start(t + start); o.stop(t + end); return o; }
      if (kind === 0) { var a = tone(432, 0, .24), b = tone(528, .08, .24); a.frequency.linearRampToValueAtTime(528, t + .24); }
      else if (kind === 1) { tone(110, 0, .1); tone(110, .2, .3); tone(110, .4, .5); }
      else { tone(220, 0, .09); }
      return { estado: kind === 2 ? 'NO_DATA' : 'MEDIDO', causa: kind === 2 ? 'signal ended by design' : null };
    } catch (_) { return { estado: 'NO_DATA', causa: 'Web Audio unavailable' }; }
  }
  function monta(target, glyph, note) {
    var g = normaliza(glyph);
    if (!target || !g || !root.document) { return { estado: 'NO_DATA', causa: 'target or four-dimensional glyph unavailable' }; }
    var box = root.document.createElement('div'), svg = node('svg', { viewBox: '0 0 100 100', role: 'img', 'aria-label': describe(g, note) });
    box.className = 'semiotic-glyph'; shape(svg, g, COLORS[g[0]]); box.appendChild(svg);
    var text = root.document.createElement('p'); text.className = 'semiotic-description'; text.textContent = note || describe(g); box.appendChild(text);
    var b = root.document.createElement('button'); b.type = 'button'; b.className = 'boton-sec semiotic-sound'; b.textContent = 'Hear glyph signal';
    b.setAttribute('aria-label', 'Hear ' + SOUNDS[g[1]]); b.addEventListener('click', function () {
      var r = sound(g[1]), s = box.querySelector('[role=status]'); s.textContent = r.estado === 'NO_DATA' ? 'NO_DATA (' + r.causa + ')' : SOUNDS[g[1]];
    }); box.appendChild(b);
    var status = root.document.createElement('p'); status.setAttribute('role', 'status'); status.className = 'semiotic-status'; status.textContent = g[1] === 2 ? 'NO_DATA (tap to hear the cut tone)' : 'Sound is off until you tap.'; box.appendChild(status);
    target.appendChild(box); return { estado: g[1] === 2 ? 'NO_DATA' : 'MEDIDO', glyph: g.slice(), description: describe(g, note) };
  }
  var API = { colores: COLORS.slice(), normaliza: normaliza, describe: describe, monta: monta, sonido: sound };
  if (typeof module === 'object' && module.exports) { module.exports = API; } else { root.AtlasGlyph = API; }
})(typeof window !== 'undefined' ? window : globalThis);
