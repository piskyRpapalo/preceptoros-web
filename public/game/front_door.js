(function (root) {
  'use strict';
  var common = typeof module === 'object' && module.exports;
  function lib(name, file) { return common ? require(file) : root[name]; }
  var E = lib('AtlasBubbleEditor', './bubble_editor.js'), P = lib('AtlasBubblePaint', './bubble_paint.js');
  var K = lib('AtlasComicTokens', './comic_tokens.js'), B = lib('AtlasBubbleBestiary', './bubble_bestiary.js');
  var G = lib('AtlasGacha', './gacha.js'), D = lib('AtlasDescentSound', './descent_sound.js');
  var COPY = Object.freeze({ title: 'Your own place, by your choice',
    lead: 'Your device holds its state. AI proposes. You review what changes.',
    goal: 'Build a sovereign structure in an AI Safe environment.',
    rule: 'Keep playing locally. Visiting a node or deploying a structure needs your explicit choice.',
    art: 'The crab rests beside an egg. A line crosses the deep water; its sonar stays silent until you choose sound.',
    sound: 'Hear the abyssal sonar', silent: 'Sound is off until you choose it.',
    questions: 'Questions stay on this device and use the local lore.',
    key: 'A device key identifies your actions. Creating it does not publish anything.' });
  var ACTIONS = Object.freeze([
    Object.freeze({ id: 'tutorial', label: 'Start the guided tutorial', lines: ['Start guided', 'tutorial'], band: 'LIVE.base' }),
    Object.freeze({ id: 'explore', label: 'Check the rift', lines: ['Check', 'the rift'], band: 'cyan' }),
    Object.freeze({ id: 'key', label: "Create this device's key", lines: ['Create this', "device's key"], band: 'PROPUESTA.base' }),
    Object.freeze({ id: 'questions', label: 'Questions???', lines: ['Questions???'], band: 'FIRMADO.base' })
  ]);
  function copy(value) { return JSON.parse(JSON.stringify(value)); }
  function finish(frame, id, reading, band, cv) {
    frame.id = id; frame.cv = cv || [412, 515];
    frame.atoms[0].k = 'line'; frame.atoms[0].r = reading;
    frame.bands = [band];
    frame.sound = 'NO_DATA'; frame.soundCause = 'gesture only'; frame.motion = 'NO_DATA';
    E.serialize(frame); return frame;
  }
  function line(id, reading, item, cv) {
    var band = item.s || item.f || 'cyan', frame;
    if (item.o === 'ribbon' && item.pts.length >= 2) {
      var paint = P.create({ band: item.f || 'ink', stroke: item.s || 'ink', style: 'clear' });
      item.pts.forEach(function (point) { var result = paint.addPoint(point[0], point[1]); if (result.ok === false) throw new Error(result.cause); });
      frame = paint.frame();
      frame.atoms[0].i[0] = Object.assign({}, item, { pts: paint.points() });
    } else {
      frame = E.create({ primitive: item.o, style: 'clear', band: item.f || 'ink', stroke: item.s || 'ink', item: item });
      frame.atoms[0].i[0] = copy(item);
    }
    return finish(frame, id, reading, band, cv);
  }
  function stroke(id, reading, points, band, cv) {
    return line(id, reading, { o: 'ribbon', pts: points, f: null, s: band, lw: 2.5, d: 0 }, cv);
  }
  function text(id, value, x, y, size, band, cv) {
    return line(id, value, { o: 'text', tx: value, x: x, y: y, sz: size, f: band, d: 0 }, cv);
  }
  function art() {
    var frames = [stroke('water', 'A line across the deep water', [[24,402],[92,398],[180,403],[276,398],[388,402]], 'cyan'),
      stroke('sonar', 'A quiet sonar arc surrounds the egg', [[250,201],[260,157],[297,130],[338,135],[369,165]], 'FIRMADO.base')];
    B.WORDS.crab({ x: 156, y: 336, rr: 72, eye: 'open' }).forEach(function (item, i) {
      var it = copy(item);
      if (it.s === 'cyan') it.s = 'LIVE.base';
      if (it.f && it.f !== 'paper') it.f = 'ink';
      frames.push(line('crab-' + i, 'The crab', it));
    });
    frames.push(line('egg', 'The egg waits beside the crab', { o: 'wave', x: 304, y: 256, h: copy(G.HUEVO), f: 'ink', s: 'PROPUESTA.base', lw: 3.5, d: 0 }));
    frames.push(stroke('path', 'Your path begins with your choice', [[36,453],[120,448],[202,455],[282,449],[376,453]], 'PROPUESTA.base'));
    return frames;
  }
  function heading() {
    return [text('title-place', COPY.title.split(', ')[0].toUpperCase(), 206, 32, 36, 'paper', [412,100]),
      text('title-choice', COPY.title.split(', ')[1].toUpperCase(), 206, 78, 36, 'LIVE.base', [412,100])];
  }
  function paragraph(key) {
    var words = COPY[key].split(' '), rows = [], row = '';
    words.forEach(function (word) { if (row && (row + ' ' + word).length > 28) { rows.push(row); row = word; } else row += (row ? ' ' : '') + word; });
    if (row) rows.push(row);
    return rows.map(function (value, i) { return text(key + '-' + i, value, 206, 19 + i * 32, 24, 'paper', [412, rows.length * 32 + 6]); });
  }
  function button(id) {
    var action = ACTIONS.filter(function (a) { return a.id === id; })[0];
    if (!action) throw new Error('unknown front door action');
    var frames = [stroke('action-' + id, action.label, [[8,72],[192,72]], action.band, [200,80])];
    action.lines.forEach(function (value, i) {
      frames.push(text(id + '-label-' + i, value, 100, action.lines.length === 1 ? 37 : 23 + i * 29, 23, action.band, [200,80]));
    });
    return frames;
  }
  function paletteMap() {
    var map = {};
    Object.keys(K.FRONT_DOOR).forEach(function (name) {
      var literal = K.NEUTRAL[name];
      if (!literal) { var cut = name.lastIndexOf('.'); literal = K.tone(name.slice(0,cut)).bands[name.slice(cut+1)]; }
      map[literal.toLowerCase()] = K.FRONT_DOOR[name];
    });
    return map;
  }
  function project(frame) {
    var mapping = paletteMap();
    function skin(value) {
      if (Array.isArray(value)) return value.map(skin);
      if (value && typeof value === 'object') {
        var out = {};
        Object.keys(value).forEach(function (key) {
          var v = value[key];
          out[key] = /^(fill|stroke|shadow)$/.test(key) && typeof v === 'string' ? (mapping[v.toLowerCase()] || v) : skin(v);
        });
        return out;
      }
      return value;
    }
    return skin(E.compile(frame));
  }
  function sonar(frame) {
    var score = D.score(frame);
    score.voices.forEach(function (voice) { if (voice.hz) { voice.hz /= 2; voice.octave -= 1; } voice.gain = Math.min(voice.gain, 0.035); });
    return score;
  }
  var API = Object.freeze({ COPY: COPY, ACTIONS: ACTIONS, art: art, heading: heading, paragraph: paragraph, button: button, project: project, sonar: sonar });
  if (common) module.exports = API; else root.AtlasFrontDoor = API;
})(typeof module === 'object' && module.exports ? this : (this || window));
