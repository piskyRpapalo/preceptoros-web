// Sound from first press (D10/K11/I7); one persisted choice for landing and OpenWorld.
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
  // Pure: fresh(recent, text) → what is still new: '' if just said (or inside a line just said), the tail if it only
  // grows one. Measured 2026-11-15 (Round 7): two regions said one message, and growing lines repeated their start.
  function bare(s) { return String(s || '').replace(/^[A-Z][\w ]{0,23} · (?=\S)/, '').replace(/\s+/g, ' ').trim().toLowerCase(); }
  function fresh(recent, text) {
    var t = said(text), n = bare(t); if (!n) { return ''; }
    for (var i = recent.length - 1; i >= 0; i--) {
      var o = bare(recent[i]); if (!o) { continue; }
      if (o.indexOf(n) >= 0) { return ''; }
      if (n.indexOf(o) === 0) { var tail = t.slice(t.toLowerCase().indexOf(o) + o.length).replace(/^[\s·.,:;-]+/, ''); return tail.length > 2 ? tail : ''; }
    }
    return t;
  }
  // speak(win, text, wait) → true when handed to the system voice. A new line replaces the one being said, unless
  // wait is true: then it queues behind it (a message that follows a press must not cut the press's own name).
  function speak(win, text, wait) {
    var S = win && win.speechSynthesis, U = win && win.SpeechSynthesisUtterance;
    if (!S || !U || !text) { return false; }
    try { if (!wait) { S.cancel(); } S.speak(new U(text)); return true; } catch (e) { return false; }
  }
  // Pure: name(el) → what a control is called: its aria-label, else its text; '' when it is not a control.
  function name(el) {
    if (!el || !el.tagName || !/^(BUTTON|A|INPUT|TEXTAREA|SELECT|SUMMARY)$/.test(el.tagName)) { return ''; }
    var parts = el.childNodes ? Array.prototype.map.call(el.childNodes, function (n) { return String(n.textContent || '').trim(); }).filter(Boolean).join(' · ') : el.textContent;
    var label = el.getAttribute('aria-label') || parts || el.getAttribute('placeholder') || '';
    var state = el.getAttribute('aria-pressed') === 'true' ? ' · on' : el.disabled ? ' · unavailable' : '';
    return said(label) + (said(label) ? state : '');
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
    win.addEventListener('storage', function (event) {
      if (event.key !== KEY && event.key !== null) { return; }
      if (isOn(s)) { doc.documentElement.dataset.audioOnly = 'on'; }
      else { delete doc.documentElement.dataset.audioOnly; }
    });
    function say() {
      var t = said(head.textContent);
      if (!woke || !t || t === last || doc.documentElement.dataset.audioOnly !== 'on') { return; }
      if (speak(win, t)) { last = t; }
    }
    ['pointerdown', 'keydown'].forEach(function (ev) { doc.addEventListener(ev, function () { if (!woke) { woke = true; win.setTimeout(say, 0); } }, true); });
    if (win.MutationObserver) { new win.MutationObserver(say).observe(head, { childList: true, characterData: true, subtree: true }); }
    // Playing by ear: the focused control says its name, and every message the eye can see change is said after it.
    // A message is a visible status or live region outside the veiled technical panels; hidden ones stay silent.
    var on = function () { return woke && doc.documentElement.dataset.audioOnly === 'on'; }, heard = new win.WeakMap(), recent = [];
    doc.addEventListener('focusin', function (e) { var t = name(e.target); if (on() && t) { speak(win, t); } });
    function region(node) {
      var el = node && node.nodeType === 1 ? node : node && node.parentNode;
      var r = el && el.closest ? el.closest('[role="status"], [aria-live="polite"], [aria-live="assertive"]') : null;
      if (!r || r === head || r.closest('[data-depth="tech"], .sr, #log') || !r.getClientRects().length) { return null; }
      return r;
    }
    if (win.MutationObserver) {
      new win.MutationObserver(function (list) {
        if (!on()) { return; }
        list.forEach(function (m) {
          var r = region(m.target), t = r ? said(r.textContent) : '';
          if (!t || heard.get(r) === t) { return; }
          heard.set(r, t);
          // urgent (assertive/alert) interrupts; ordinary news queues; nothing twice
          var urgent = r.getAttribute('aria-live') === 'assertive' || r.getAttribute('role') === 'alert', say = urgent ? t : fresh(recent, t);
          if (say && speak(win, say, !urgent)) { recent.push(t); if (recent.length > 3) { recent.shift(); } }
        });
      }).observe(doc.body, { childList: true, characterData: true, subtree: true });
    }
  }

  var api = { KEY: KEY, WELCOME: WELCOME, label: label, said: said, name: name, speak: speak, fresh: fresh };
  if (typeof module === 'object' && module.exports) { module.exports = api; return; }
  root.AtlasSoundFirst = api;
  var doc = root.document, btn = doc && doc.getElementById('sound-first'), head = doc && doc.getElementById('map-h');
  if (btn) { landing(doc, root, btn); }
  if (head) { world(doc, root, head); }
})(typeof window !== 'undefined' ? window : globalThis);
