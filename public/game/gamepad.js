// Gamepad (Sovereign, 2026-11-07): the bottom of /openworld/ is one Acho gamepad, like the PreceptorOS mini app.
// Left: the map pan joystick (map_view_joystick.js). Right: the character joystick, off (NO_DATA, character_not_born).
// Middle: the ephemeral account buttons that already exist (Play now and the panel buttons of terminal_panel.js).
// Each control carries a small harmonic spectrum: k = 1..3, amplitudes 1/k, phases from the FNV-1a hash of its name,
// colour from the colony floor. Pure core: no clock, no random numbers, no network. Reduced motion: no gesture.
(function (root) {
  'use strict';
  var MIN = 44, TAU = Math.PI * 2, MS = 360;
  var SOIL = [['sea', '#64ae91'], ['blue', '#348ea2'], ['grass', '#6eb75d'], ['sand', '#d8be78'],
    ['clay', '#c19964'], ['sun', '#eacb56'], ['sky', '#45cbd4'], ['moss', '#a9bf68']];
  function r3(x) { return Math.round(x * 1000) / 1000; }
  function r1(x) { return Math.round(x * 10) / 10; }
  // fnv1a(text) → 32-bit FNV-1a hash of the UTF-16 code units.
  function fnv1a(text) {
    var h = 0x811c9dc5, s = String(text);
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
    return h >>> 0;
  }
  // spectrum(name) → { name, soil, color, amps, phases }: the same name always gives the same spectrum.
  function spectrum(name) {
    var h = fnv1a(name), soil = SOIL[h % SOIL.length], amps = [], phases = [];
    for (var k = 1; k <= 3; k++) { amps.push(r3(1 / k)); phases.push(r3(((h >>> (8 * k)) & 255) / 256 * TAU)); }
    return { name: String(name), soil: soil[0], color: soil[1], amps: amps, phases: phases };
  }
  // value(s, x) → the sum of the three harmonics at x (0..1 is one period), scaled to -1..1.
  function value(s, x) {
    var y = 0, norm = 0;
    for (var k = 0; k < 3; k++) { y += s.amps[k] * Math.sin((k + 1) * TAU * x + s.phases[k]); norm += s.amps[k]; }
    return y / norm;
  }
  // curve(name, w, h, n) → n points [x, y] of the spectrum in a w × h box (one decimal).
  function curve(name, w, h, n) {
    var s = spectrum(name), out = [], c = Math.max(2, n | 0);
    for (var i = 0; i < c; i++) { var x = i / (c - 1); out.push([r1(x * w), r1(h / 2 - value(s, x) * h * 0.45)]); }
    return out;
  }
  function path(points) { return points.map(function (p, i) { return (i ? 'L' : 'M') + p[0] + ' ' + p[1]; }).join(''); }
  // svg(name, w, h) → a decorative SVG line of the spectrum in its floor colour.
  function svg(name, w, h) {
    var s = spectrum(name);
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + w + ' ' + h + '" width="' + w + '" height="' + h +
      '" aria-hidden="true" focusable="false"><path d="' + path(curve(name, w, h, 25)) +
      '" fill="none" stroke="' + s.color + '" stroke-width="2" stroke-linecap="round"/></svg>';
  }
  function svgUrl(name, w, h) { return 'url("data:image/svg+xml,' + encodeURIComponent(svg(name, w, h)) + '")'; }
  // gesture(name, reduced) → WAAPI keyframes along the spectrum (a small move, back to rest); none when reduced.
  function gesture(name, reduced) {
    if (reduced) { return { frames: [], options: { duration: 0 } }; }
    var pts = curve(name, 8, 6, 5), frames = pts.map(function (p, i) {
      var x = r1(p[0] - 4), y = r1(p[1] - 3);
      return { transform: i === pts.length - 1 ? 'translate(0px,0px)' : 'translate(' + x + 'px,' + y + 'px)' };
    });
    frames[0] = { transform: 'translate(0px,0px)' };
    return { frames: frames, options: { duration: MS, easing: 'ease-out' } };
  }
  // target(px) → a touch target size: never under 44 px.
  function target(px) { var n = Number(px) || 0; return Math.max(MIN, Math.round(n)); }
  // The middle buttons, in order. Each one opens or focuses a thing that already exists on the page.
  var BUTTONS = Object.freeze([
    Object.freeze({ name: 'Play', glyph: '▶', label: 'Play now. Sign on this device.', opens: '#play-now' }),
    Object.freeze({ name: 'Welcome', opens: '.cats [data-cat=Welcome]' }),
    Object.freeze({ name: 'Profile', opens: '.cats [data-cat=Profile]' }),
    Object.freeze({ name: 'Communication', opens: '.cats [data-cat=Communication]' })
  ]);

  function paint(el, name) {
    var s = spectrum(name);
    el.classList.add('gp-acho'); el.dataset.soil = s.soil;
    el.style.setProperty('--gp', s.color); el.style.setProperty('--gp-svg', svgUrl(name, 32, 10));
    return s;
  }
  function move(el, name, win) {
    var reduced = !!(win && win.matchMedia && win.matchMedia('(prefers-reduced-motion: reduce)').matches);
    var g = gesture(name, reduced);
    if (g.frames.length && el.animate) { el.animate(g.frames, g.options); }
  }

  // mount(doc, win) → the gamepad under the map, built from the controls that already exist; null when not ready.
  function mount(doc, win) {
    var map = doc.getElementById('map'), stage = doc.getElementById('stage'), joy = doc.getElementById('view-joystick');
    if (!map || !stage || !joy || doc.getElementById('gamepad')) { return null; }
    var pad = doc.createElement('div'); pad.id = 'gamepad'; pad.setAttribute('role', 'group'); pad.setAttribute('aria-label', 'Gamepad');
    var mid = doc.createElement('div'); mid.className = 'gp-mid';
    var right = doc.createElement('div'); right.className = 'gp-off'; right.title = 'Character joystick: NO_DATA, the character does not exist yet.';
    var knob = doc.createElement('span'); knob.setAttribute('aria-hidden', 'true'); knob.textContent = '✥'; right.appendChild(knob);
    var slot = doc.getElementById('character-joystick-slot'); if (slot) { right.appendChild(slot); }
    paint(right, 'Character');
    var stick = joy.querySelector('.view-stick'); if (stick) { paint(stick, 'Map'); }
    // Play: the visit's own «Play now» button; the gamepad copy hides with it.
    var real = doc.getElementById('play-now'), play = doc.createElement('button');
    play.type = 'button'; play.id = 'gp-play'; play.className = 'gp-b'; play.textContent = BUTTONS[0].glyph;
    play.setAttribute('aria-label', BUTTONS[0].label); play.title = BUTTONS[0].label; paint(play, 'Play');
    play.addEventListener('click', function () { move(play, 'Play', win); if (real && !real.hidden && !real.disabled) { real.click(); } });
    function sync() { play.hidden = !real || real.hidden; play.disabled = !!(real && real.disabled); }
    sync();
    if (real && win && win.MutationObserver) { new win.MutationObserver(sync).observe(real, { attributes: true, attributeFilter: ['hidden', 'disabled'] }); }
    mid.appendChild(play);
    var cats = doc.querySelector('#map .cats');
    if (cats) {
      Array.prototype.forEach.call(cats.querySelectorAll('button[data-cat]'), function (b) {
        var n = b.dataset.cat; paint(b, n); b.addEventListener('click', function () { move(b, n, win); });
      });
      mid.appendChild(cats);
    }
    pad.appendChild(joy); pad.appendChild(mid); pad.appendChild(right);
    stage.parentNode.insertBefore(pad, stage.nextSibling);
    if (win && win.dispatchEvent && win.Event) { win.dispatchEvent(new win.Event('resize')); }
    return pad;
  }

  var api = { MIN: MIN, SOIL: SOIL, BUTTONS: BUTTONS, fnv1a: fnv1a, spectrum: spectrum, value: value, curve: curve, path: path,
    svg: svg, gesture: gesture, target: target, paint: paint, move: move, mount: mount };
  if (typeof module === 'object' && module.exports) { module.exports = api; }
  root.AtlasGamepad = api;
  if (root.document && root.document.getElementById) { mount(root.document, root); }
})(typeof window !== 'undefined' ? window : globalThis);
