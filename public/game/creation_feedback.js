(function (root) {
  'use strict';
  var common = typeof module === 'object' && module.exports, LIMIT = 25 * 1024 * 1024;
  var INVENTORY = ['add','undo','redo','border','reject','repeat','cyan','ink','x','y','points'];
  for (var i = 0; i < 10; i++) INVENTORY.push('digit_' + i);
  INVENTORY = Object.freeze(INVENTORY.concat(['signing','signed','exported','published','unavailable','ready','empty','limit']));
  function fail(cause) { throw new Error('NO_DATA · ' + cause); }
  function size(text) { return new TextEncoder().encode(text).length; }
  function exact(value, keys) {
    if (!value || Array.isArray(value) || typeof value !== 'object' || Object.keys(value).sort().join('|') !== keys.slice().sort().join('|')) fail('invalid voice fields');
  }
  function bytes(data) {
    if (typeof data !== 'string' || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(data)) fail('invalid voice encoding');
    var binary = atob(data), out = Uint8Array.from(binary, function (c) { return c.charCodeAt(0); });
    if (btoa(binary) !== data) fail('invalid voice encoding');
    return out;
  }
  async function hash(value) {
    var result = await crypto.subtle.digest('SHA-256', typeof value === 'string' ? new TextEncoder().encode(value) : value);
    return Array.from(new Uint8Array(result), function (x) { return x.toString(16).padStart(2, '0'); }).join('');
  }
  function wav(data) {
    if (data.length < 46) fail('invalid voice WAV');
    var v = new DataView(data.buffer, data.byteOffset, data.byteLength);
    function word(start, end) { return String.fromCharCode.apply(null, data.slice(start, end)); }
    var rate = v.getUint32(24, true);
    if (word(0,4) !== 'RIFF' || word(8,12) !== 'WAVE' || word(12,16) !== 'fmt ' || word(36,40) !== 'data' ||
        v.getUint32(4,true) !== data.length - 8 || v.getUint32(16,true) !== 16 || v.getUint16(20,true) !== 1 ||
        v.getUint16(22,true) !== 1 || v.getUint16(34,true) !== 16 || v.getUint16(32,true) !== 2 || rate < 8000 || rate > 96000 ||
        v.getUint32(28,true) !== rate * 2 || v.getUint32(40,true) !== data.length - 44 || data.length % 2) fail('invalid voice WAV');
  }
  async function loadCatalog(raw) {
    if (typeof raw !== 'string' || size(raw) > LIMIT) fail('voice catalog exceeds limit');
    var c = JSON.parse(raw); exact(c, ['schema','profile','profile_id','clips']);
    if (c.schema !== 'preceptoros.creation-voice/1' || typeof c.profile !== 'string' || !c.profile.length || size(c.profile) > 4096 ||
        !/^[a-f0-9]{64}$/.test(c.profile_id) || await hash(c.profile) !== c.profile_id) fail('invalid voice profile');
    JSON.parse(c.profile); exact(c.clips, INVENTORY);
    for (var name of INVENTORY) {
      var clip = c.clips[name]; exact(clip, ['text','size','sha256','data']);
      if (typeof clip.text !== 'string' || !clip.text.length || size(clip.text) > 1024 || !Number.isInteger(clip.size) || clip.size < 46 || clip.size > LIMIT || !/^[a-f0-9]{64}$/.test(clip.sha256)) fail('invalid voice clip');
      var data = bytes(clip.data); wav(data);
      if (data.length !== clip.size || await hash(data) !== clip.sha256) fail('voice clip hash mismatch');
      Object.freeze(clip);
    }
    Object.freeze(c.clips); return Object.freeze(c);
  }
  function describe(state) {
    var s = state, clips = [s.action, s.color || 'cyan', 'x'];
    function digits(n) { return String(n).split('').map(function (d) { return 'digit_' + d; }); }
    clips = clips.concat(digits(s.x), ['y'], digits(s.y), ['points'], digits(s.count));
    if (s.cause) {
      if (INVENTORY.includes(s.cause)) clips.push(s.cause);
      else if (s.action !== 'reject') clips.push('unavailable');
    }
    var causes = { limit: 'frame must stay below 1024 bytes', empty: 'no history available' };
    var text = s.action + ' · ' + (s.color || 'cyan') + ' · x ' + s.x + ' · y ' + s.y + ' · ' + s.count + ' points';
    if (s.cause) text += ' · ' + (causes[s.cause] || s.cause);
    return { text: text, clips: clips };
  }
  function playNative(clip) {
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(new Blob([bytes(clip.data)], { type: 'audio/wav' })), player = new Audio(url);
      function done(error) { player.onended = player.onerror = null; URL.revokeObjectURL(url); if (error) reject(error); else resolve(); }
      player.onended = function () { done(); };
      player.onerror = function () { done(new Error('NO_DATA · audio playback failed')); };
      try { player.play().catch(function () { done(new Error('NO_DATA · audio suspended or unavailable')); }); }
      catch (e) { done(e); }
    });
  }
  function create(options) {
    var o = options || {}, catalog = o.catalog, tail = Promise.resolve(), player = o.play || playNative;
    function enqueue(action) {
      var result = tail.then(action);
      tail = result.catch(function (e) { if (o.onError) o.onError(e.message || String(e)); });
      return result;
    }
    function playOne(name) {
      if (!catalog) fail('voice catalog unavailable');
      if (!catalog.clips[name]) fail('voice clip unavailable: ' + name);
      return player(catalog.clips[name], name);
    }
    return Object.freeze({
      announce: function (state) { var sequence = describe(state).clips; return enqueue(async function () { for (var name of sequence) await playOne(name); }); },
      playClip: function (name) { return enqueue(function () { return playOne(name); }); },
      playAudio: function (data) { return enqueue(function () { return player({ data: data }, 'declaration'); }); },
      drain: function () { return tail; },
      setCatalog: function (next) { return enqueue(function () { catalog = next; }); }
    });
  }
  var API = Object.freeze({ INVENTORY: INVENTORY, loadCatalog: loadCatalog, describe: describe, create: create });
  if (common) module.exports = API; else root.CreationFeedback = API;
})(typeof module === 'object' && module.exports ? this : (this || window));
