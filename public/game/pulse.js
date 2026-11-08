// EL PULSO (mission K5): a frame monitor with a declared ceiling per device class.
// Pure core: no clock, no random numbers, no network, no DOM at load. Only start() touches a window, and only to ask for frames.
// When the measured frames per second fall under the declared ones, the verdict says NO_DATA with its cause.
// The weak device still plays the whole game: the verdict only says it, it never stops the game.
(function (root) {
  'use strict';
  var CLASSES = Object.freeze({ weak: Object.freeze({ fps: 24 }), mid: Object.freeze({ fps: 30 }), strong: Object.freeze({ fps: 60 }) });
  var PIECE_CEILING = 16384;
  var BUDGET = Object.freeze({ 'public/game/gamepad.js': 9000, 'public/game/pulse.js': 6000, 'public/game/map_painter.js': 24576 });
  var EXCEPTIONS = Object.freeze({ 'public/game/map_painter.js': 'floor painter, measured before the ceiling' });
  var ENVELOPE_MAX = 1024, FRAMES = 60;

  function has(o, k) { return Object.prototype.hasOwnProperty.call(o, k); }
  function r1(x) { return Math.round(x * 10) / 10; }
  function nd(causa) { return { estado: 'NO_DATA', causa: causa }; }
  function pick(o, k) { return has(o, k) ? o[k] : null; }

  // measure(stamps) → { frames, ms, fps }; NO_DATA with its cause when the stamps cannot give a number.
  function measure(stamps) {
    var n = stamps ? stamps.length : 0, i;
    if (n < 2) { return nd('pulse_too_few_frames'); }
    for (i = 0; i < n; i++) {
      if (typeof stamps[i] !== 'number' || !isFinite(stamps[i])) { return nd('pulse_stamps_not_rising'); }
      if (i > 0 && !(stamps[i] > stamps[i - 1])) { return nd('pulse_stamps_not_rising'); }
    }
    var ms = stamps[n - 1] - stamps[0];
    return { frames: n, ms: ms, fps: r1(((n - 1) * 1000) / ms) };
  }

  // verdict(stamps, cls) → MEASURED when fps reaches the declared fps of cls; else NO_DATA with its cause.
  function verdict(stamps, cls) {
    var m = measure(stamps);
    if (m.estado === 'NO_DATA') { return m; }
    if (!has(CLASSES, cls)) { return nd('pulse_class_unknown'); }
    var declared = CLASSES[cls].fps;
    if (m.fps >= declared) { return { estado: 'MEASURED', fps: m.fps, declared: declared, cls: cls }; }
    return { estado: 'NO_DATA', causa: 'pulse_under_declared', fps: m.fps, declared: declared, cls: cls };
  }

  // line(v) → one short text line for an aria-live region.
  function line(v) {
    if (v.estado === 'MEASURED') { return 'Pulse · ' + v.fps + ' fps · declared ' + v.declared + ' for ' + v.cls + ' · MEASURED'; }
    if (has(v, 'fps')) { return 'Pulse · ' + v.fps + ' fps · declared ' + v.declared + ' for ' + v.cls + ' · NO_DATA ' + v.causa; }
    return 'Pulse · NO_DATA · ' + v.causa;
  }

  // bytesOf(text) → the UTF-8 length of a string.
  function bytesOf(s) {
    var n = 0, i, c;
    for (i = 0; i < s.length; i++) {
      c = s.charCodeAt(i);
      if (c < 0x80) { n += 1; } else if (c < 0x800) { n += 2; } else if (c >= 0xd800 && c <= 0xdbff) { n += 4; i++; } else { n += 3; }
    }
    return n;
  }

  // envelope(stamps, cls, bytesByPiece) → the measured cycle report. Throws when it reaches 1,024 bytes.
  function envelope(stamps, cls, bytesByPiece) {
    var v = verdict(stamps, cls), budget = [], piece, techo, bytes;
    for (piece in bytesByPiece) {
      if (!has(bytesByPiece, piece)) { continue; }
      bytes = bytesByPiece[piece];
      techo = has(BUDGET, piece) ? BUDGET[piece] : PIECE_CEILING;
      budget.push([piece, bytes, techo, bytes <= techo]);
    }
    var env = { v: 'preceptoros.pulse/1', cls: cls, fps: pick(v, 'fps'), declared: pick(v, 'declared'), estado: v.estado, causa: pick(v, 'causa'), budget: budget };
    if (bytesOf(JSON.stringify(env)) >= ENVELOPE_MAX) { throw new Error('pulse: envelope over 1,024 bytes'); }
    return env;
  }

  // start(win, cls, onLine): the only function with effects. Collects 60 frame stamps, then reports one line.
  function start(win, cls, onLine) {
    if (!win || typeof win.requestAnimationFrame !== 'function') { onLine('Pulse · NO_DATA · pulse_no_animation_frame'); return; }
    var stamps = [];
    function tick(t) {
      stamps.push(t);
      if (stamps.length < FRAMES) { win.requestAnimationFrame(tick); } else { onLine(line(verdict(stamps, cls))); }
    }
    win.requestAnimationFrame(tick);
  }

  var api = { CLASSES: CLASSES, PIECE_CEILING: PIECE_CEILING, BUDGET: BUDGET, EXCEPTIONS: EXCEPTIONS,
    measure: measure, verdict: verdict, line: line, envelope: envelope, start: start };
  if (typeof module === 'object' && module.exports) { module.exports = api; }
  root.AtlasPulse = api;
})(typeof window !== 'undefined' ? window : globalThis);
