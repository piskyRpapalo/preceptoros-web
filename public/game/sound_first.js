// Sound from the first press (missions D10 «Audio only», K11, I7). Before this piece the audio-only choice was kept
// but never read back: every arrival was silent, and the switch lived three presses deep inside the Choir building,
// out of reach without sight. Now:
// - on the landing, one switch before the door turns the spoken world on; the press itself is the gesture a browser
//   asks for, so the welcome is heard at once;
// - on /openworld/, a kept choice is restored on arrival, and the place heading is spoken each time it changes
//   (arriving, walking), once a gesture has happened. It says only what the heading already shows.
// The choice is the same key audio_only.js keeps. No voice in this browser is said as NO_DATA, never faked.
// No clock, no random numbers, no network.
(function (root) {
  'use strict';
  var KEY = 'preceptoros.audio-only'; // the key of audio_only.js; atlas/puros/sound_first_cases.mjs holds them equal
  var WELCOME = 'Sound on. Welcome to PreceptorOS. Press Play to enter. The world will be spoken as you walk.';

  function store(win) { try { return win.localStorage || null; } catch (e) { return null; } }
  function isOn(s) { try { return !!s && s.getItem(KEY) === 'on'; } catch (e) { return false; } }
  function keep(s, on) { try { s.setItem(KEY, on ? 'on' : 'off'); return true; } catch (e) { return false; } }

  // Pure: label(on, voice) → the switch text; said(text) → what is spoken for a heading (short, no ids).
  function label(on, voice) {
    if (!voice) { return 'Sound · NO_DATA · this browser has no voice'; }
    return on ? 'Sound on · the world is spoken · press to turn off' : 'Sound off · press to hear the world';
  }
  function said(text) {
    var t = String(text || '').replace(/^Visitor-[0-9a-f]{8} · /, '').replace(/\s+/g, ' ').trim();
    return t.length > 120 ? t.slice(0, 117) + '...' : t;
  }
  // speak(win, text) → true when handed to the system voice. The newest line replaces the one being said.
  function speak(win, text) {
    var S = win && win.speechSynthesis, U = win && win.SpeechSynthesisUtterance;
    if (!S || !U || !text) { return false; }
    try { S.cancel(); S.speak(new U(text)); return true; } catch (e) { return false; }
  }

  function landing(doc, win, btn) {
    var s = store(win), voice = !!(win.speechSynthesis && win.SpeechSynthesisUtterance);
    function draw() { var on = isOn(s); btn.setAttribute('aria-pressed', String(on)); btn.textContent = label(on, voice); btn.disabled = !voice; }
    btn.addEventListener('click', function () {
      var on = !isOn(s);
      if (!keep(s, on)) { btn.textContent = 'Sound · NO_DATA · this device does not keep the choice'; return; }
      draw();
      if (on) { speak(win, WELCOME); } else if (win.speechSynthesis) { win.speechSynthesis.cancel(); }
    });
    draw();
  }

  function world(doc, win, head) {
    var s = store(win), woke = false, last = '';
    if (isOn(s)) { doc.documentElement.dataset.audioOnly = 'on'; }
    function say() {
      var t = said(head.textContent);
      if (!woke || !t || t === last || doc.documentElement.dataset.audioOnly !== 'on') { return; }
      if (speak(win, t)) { last = t; }
    }
    ['pointerdown', 'keydown'].forEach(function (ev) { doc.addEventListener(ev, function () { if (!woke) { woke = true; win.setTimeout(say, 0); } }, true); });
    if (win.MutationObserver) { new win.MutationObserver(say).observe(head, { childList: true, characterData: true, subtree: true }); }
  }

  var api = { KEY: KEY, WELCOME: WELCOME, label: label, said: said, speak: speak };
  if (typeof module === 'object' && module.exports) { module.exports = api; return; }
  root.AtlasSoundFirst = api;
  var doc = root.document, btn = doc && doc.getElementById('sound-first'), head = doc && doc.getElementById('map-h');
  if (btn) { landing(doc, root, btn); }
  if (head && !/[?&]landing=1/.test(root.location.search)) { world(doc, root, head); }
})(typeof window !== 'undefined' ? window : globalThis);
