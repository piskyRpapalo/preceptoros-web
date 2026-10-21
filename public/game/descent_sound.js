(function (raiz) {
  'use strict';
  var NODE = typeof module === 'object' && !!module.exports;
  var R = NODE ? require('./aiact-art50-state-radio.js') : raiz.AtlasRadio;
  var B = NODE ? require('./bubble_language.js') : raiz.AtlasBubble;
  var GRADE = { ink: 0, ocean: 1, cyan: 2, paper: 3, 'comic yellow.base': 4, 'vermilion.base': 2, 'FIRMADO.base': 4 };
  var NOTE_WORD = ['A', 'B', 'C sharp', 'E', 'F sharp'];
  var WAVE_WORD = { sine: 'a soft sine', triangle: 'a triangle' };
  var PAUSA_VOZ = 0.25, BAND_GAIN = 0.05, NOISE_GAIN = 0.03;
  var PULSO_BASE = 30, PULSO_PASO = 10, PAUSA_MS = 60, MAX_PULSOS = 3;

  function hasOwn(o, k) { return Object.prototype.hasOwnProperty.call(o, k); }
  function roundTo(x) { return Math.round(x * 1e2) / 1e2; }
  function gradeOf(band) { return hasOwn(GRADE, band) ? GRADE[band] : 0; }
  function bandsOf(frame) { return frame && Array.isArray(frame.bands) ? frame.bands.slice(0, 3) : []; }
  function melodyOf(frame) {
    var atoms = frame && Array.isArray(frame.atoms) ? frame.atoms : [];
    return atoms.slice(0, 2).map(function (a) { return (B.hash32(String(a && a.k) + ':' + String(a && a.r)) >>> 0) % 5; });
  }
  function hasBubbleAtom(frame) {
    var atoms = frame && Array.isArray(frame.atoms) ? frame.atoms : [];
    return atoms.some(function (a) {
      var r = String((a && a.r) || '').toLowerCase();
      return r.indexOf('bubble') !== -1 || r.indexOf('water') !== -1;
    });
  }
  function seedOf(frame) {
    var s = B.hash32(JSON.stringify(frame)) >>> 0;
    return s === 0 ? 1 : s;
  }
  function envOsc() { return { a: 0.5, d: 0.3, s: 0.6, r: 0.8 }; }
  function envNoise() { return { a: 0.6, d: 0.4, s: 0.5, r: 0.9 }; }

  function score(frame) {
    var voices = [];
    bandsOf(frame).forEach(function (band, i) {
      var grade = gradeOf(band), octave = i % 2 === 0 ? 0 : 1;
      voices.push({
        src: 'osc', band: String(band), grade: grade, octave: octave, hz: R.nota(grade, octave),
        wave: i % 2 === 0 ? 'sine' : 'triangle', env: envOsc(), gain: BAND_GAIN, at: 0
      });
    });
    melodyOf(frame).forEach(function (grade) {
      voices.push({
        src: 'osc', band: 'melody', grade: grade, octave: 1, hz: R.nota(grade, 1),
        wave: 'sine', env: envOsc(), gain: BAND_GAIN, at: 0
      });
    });
    if (hasBubbleAtom(frame)) {
      voices.push({
        src: 'noise', band: null, grade: null, octave: null, hz: null, wave: null,
        env: envNoise(), gain: NOISE_GAIN, at: 0, seed: seedOf(frame)
      });
    }
    voices.forEach(function (v, k) { v.at = roundTo(k * PAUSA_VOZ); });
    var length = voices.reduce(function (m, v) { return Math.max(m, v.at + v.env.a + v.env.d + v.env.r); }, 0);
    return { voices: voices, length: roundTo(length) };
  }

  function describe(voices) {
    var parts = [];
    (voices || []).forEach(function (v) {
      if (v.src === 'noise') { parts.push('quiet bubbles'); return; }
      parts.push((WAVE_WORD[v.wave] || 'a tone') + ' on ' + NOTE_WORD[v.grade] + (v.octave ? ' one octave up' : ''));
    });
    return parts.length ? parts.join(', ') : 'silence';
  }

  function haptic(frame) {
    var out = [];
    score(frame).voices
      .filter(function (v) { return v.src === 'osc'; })
      .slice(0, MAX_PULSOS)
      .forEach(function (v) { out.push(PULSO_BASE + v.grade * PULSO_PASO, PAUSA_MS); });
    return out;
  }

  function noiseBuffer(ctx, dur, seed) {
    var rate = ctx.sampleRate || 4.41e4, n = Math.max(1, Math.floor(rate * dur));
    var buf = ctx.createBuffer(1, n, rate), data = buf.getChannelData(0), x = seed || 1;
    for (var i = 0; i < n; i++) {
      x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
      data[i] = ((x >>> 0) / Math.pow(2, 32) * 2 - 1) * 0.5;
    }
    return buf;
  }

  function play(ctx, voices, t0) {
    if (!ctx || typeof ctx.createOscillator !== 'function' || !Array.isArray(voices)) { return 0; }
    var base = typeof t0 === 'number' && isFinite(t0) ? t0 : (ctx.currentTime || 0), programadas = 0;
    voices.forEach(function (v) {
      if (v.src !== 'osc' && v.src !== 'noise') { return; }
      var t = base + v.at, env = v.env, stop = t + env.a + env.d + env.r, node;
      if (v.src === 'osc') {
        node = ctx.createOscillator();
        node.type = v.wave;
        node.frequency.value = v.hz;
      } else {
        node = ctx.createBufferSource();
        node.buffer = noiseBuffer(ctx, env.a + env.d + env.r, v.seed);
      }
      var g = ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(v.gain, t + env.a);
      g.gain.linearRampToValueAtTime(v.gain * env.s, t + env.a + env.d);
      g.gain.linearRampToValueAtTime(0, stop);
      node.connect(g);
      g.connect(ctx.destination);
      node.start(t);
      node.stop(stop);
      programadas++;
    });
    return programadas;
  }

  var AtlasDescentSound = Object.freeze({ score: score, describe: describe, haptic: haptic, play: play });
  if (NODE) { module.exports = AtlasDescentSound; }
  else { raiz.AtlasDescentSound = AtlasDescentSound; }
})(typeof module === 'object' && module.exports ? this : (this || window));
