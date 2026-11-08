// Audio only (mission D10 «Audio only», building Choir): the visible state of the map, said in short lines for the ear.
// describe() is pure: it never invents. A field it lacks is said as NO_DATA with its cause.
// speak() uses the system voice (speechSynthesis) when the page has one; if not, it returns one line for an aria-live region.
// toggle() flips the mode, marks the root with data-audio-only and keeps the choice in the store.
// No clock, no random numbers, no network, no motion.
(function (root) {
  'use strict';
  var KEY = 'preceptoros.audio-only';
  var MAX = 120;

  function has(o, k) { return o !== null && typeof o === 'object' && Object.prototype.hasOwnProperty.call(o, k); }
  function num(v) { return typeof v === 'number' && isFinite(v); }
  function nd(campo) { return campo + ' NO_DATA (not given)'; }
  function n(c, word) { return c + ' ' + word + (c === 1 ? '' : 's'); }
  function cut(s) { return s.length > MAX ? s.slice(0, MAX - 3) + '...' : s; }

  // describe(state) → short lines, each at most 120 characters. Missing data is said as NO_DATA.
  function describe(state) {
    var s = state !== null && typeof state === 'object' ? state : {};
    var hasPlace = typeof s.place === 'string' && s.place.length > 0;
    var hasXY = num(s.x) && num(s.y);
    var out = [], where, live = 0, total = 0, bad = 0;
    where = hasPlace ? 'You are in ' + s.place.slice(0, 80) : nd('place');
    out.push(hasXY ? where + (hasPlace ? ' at ' : ' · at ') + s.x + ', ' + s.y : where + ' · ' + nd('position'));
    if (Array.isArray(s.buildings)) {
      s.buildings.forEach(function (b) {
        if (b && num(b.live) && num(b.total)) { live += b.live; total += b.total; } else { bad++; }
      });
      out.push(n(s.buildings.length, 'building') + ' · ' + live + ' of ' + n(total, 'option') + ' LIVE' +
        (bad ? ' · live ' + n(bad, 'building') + ' NO_DATA (not given)' : ''));
    } else { out.push(nd('buildings')); }
    out.push(num(s.gaps) ? n(s.gaps, 'gap') : nd('gaps'));
    return out.map(cut);
  }

  // speak(win, lines, done) → one utterance per line, lang 'en', queued. done(text) says what happened. Never throws.
  function speak(win, lines, done) {
    var list = Array.isArray(lines) ? lines : [], cause = 'speech_unavailable', said = false;
    try {
      if (win && win.speechSynthesis && win.SpeechSynthesisUtterance) {
        list.forEach(function (l) {
          var u = new win.SpeechSynthesisUtterance(String(l));
          u.lang = 'en';
          win.speechSynthesis.speak(u);
        });
        said = true;
      }
    } catch (e) { cause = 'speech_failed'; }
    if (typeof done !== 'function') { return; }
    if (said) { done('speaking ' + list.length + ' lines'); } else { done('NO_DATA · ' + cause + ' · ' + list.join(' · ')); }
  }

  // read(store) → true only when the store holds 'on'. A null or throwing store gives false.
  function read(store) {
    try { return !!store && store.getItem(KEY) === 'on'; } catch (e) { return false; }
  }

  // write(store, on) → true when saved, false when the store is missing or blocked.
  function write(store, on) {
    try { store.setItem(KEY, on ? 'on' : 'off'); return true; } catch (e) { return false; }
  }

  // toggle(doc, win, store) → flips the mode, sets or removes data-audio-only, saves it. Without a store it uses win.localStorage.
  function toggle(doc, win, store) {
    var s = store, on, el;
    if (s === undefined && win) { try { s = win.localStorage; } catch (e) { s = null; } }
    on = !read(s);
    write(s, on);
    el = doc && doc.documentElement;
    if (el && el.dataset) { if (on) { el.dataset.audioOnly = 'on'; } else { delete el.dataset.audioOnly; } }
    return { on: on, line: on ? 'Audio only on' : 'Audio only off' };
  }

  var api = { KEY: KEY, describe: describe, speak: speak, read: read, write: write, toggle: toggle };
  if (typeof module === 'object' && module.exports) { module.exports = api; }
  root.AtlasAudioOnly = api;
})(typeof window !== 'undefined' ? window : globalThis);
