// Type scale (I7 «The right letters», accessibility): the reading panels scale their letters in 4 steps.
// The visitor's step is kept in localStorage, read and written inside try/catch: a blocked store gives step 1.
// Pure core: no clock, no random numbers, no network. It does not mount itself on load; a page calls restore or cycle.
(function (root) {
  'use strict';
  var KEY = 'preceptoros.letters';
  var STEPS = Object.freeze([1, 1.15, 1.3, 1.5]);
  // label(step) → 'Letters 115%'; a step outside STEPS is NO_DATA.
  function label(step) {
    if (STEPS.indexOf(step) < 0) { return 'Letters NO_DATA · letters_step_unknown'; }
    return 'Letters ' + Math.round(step * 100) + '%';
  }
  // next(step) → the following step in the cycle; an unknown step gives 1.
  function next(step) {
    var i = STEPS.indexOf(step);
    return i < 0 ? 1 : STEPS[(i + 1) % STEPS.length];
  }
  // read(win) → the saved step, or 1 when the store is missing, blocked or holds a value outside STEPS.
  function read(win) {
    try {
      var raw = win.localStorage.getItem(KEY), n = Number(raw);
      return STEPS.indexOf(n) >= 0 ? n : 1;
    } catch (e) { return 1; }
  }
  // write(win, step) → true when saved, false when the store is blocked.
  function write(win, step) {
    try { win.localStorage.setItem(KEY, String(step)); return true; } catch (e) { return false; }
  }
  // apply(doc, step) → sets --letters and data-letters on the root; an unknown step changes nothing.
  function apply(doc, step) {
    if (STEPS.indexOf(step) < 0) { return { estado: 'NO_DATA', causa: 'letters_step_unknown' }; }
    var el = doc.documentElement;
    el.style.setProperty('--letters', String(step));
    el.setAttribute('data-letters', String(step));
    return { estado: 'MEASURED', step: step, label: label(step) };
  }
  // cycle(doc, win) → the button action: next step, saved, applied.
  function cycle(doc, win) {
    var step = next(read(win));
    write(win, step);
    return apply(doc, step);
  }
  // restore(doc, win) → on page load: apply the saved step.
  function restore(doc, win) { return apply(doc, read(win)); }

  // mount(doc, win, tries) → the settings wheel (Sovereign, 2026-11-08: the gear replaces «Aa»; the letters live in its
  // sheet, settings_sheet.js). Restores the saved step; waits for the late gamepad (40 × 250 ms), else null.
  function mount(doc, win, tries) {
    var mid = doc.querySelector && doc.querySelector('#gamepad .gp-mid'), n = tries || 0, G = root.AtlasGamepad;
    if (!mid) { if (n < 40 && win && win.setTimeout) { win.setTimeout(function () { mount(doc, win, n + 1); }, 250); } return null; }
    if (doc.querySelector('#gp-letters')) { return null; }
    var b = doc.createElement('button');
    b.type = 'button'; b.id = 'gp-letters'; b.className = 'gp-b'; b.textContent = '\u2699\uFE0E';
    b.setAttribute('aria-label', 'Settings'); b.title = 'Settings'; b.setAttribute('aria-controls', 'settings-sheet'); b.setAttribute('aria-expanded', 'false');
    restore(doc, win);
    if (G && G.paint) { G.paint(b, 'Settings'); }
    b.addEventListener('click', function () {
      if (G && G.move) { G.move(b, 'Settings', win); }
      function go() { if (root.AtlasSettings) { root.AtlasSettings.toggle(doc, win, b); } }
      if (root.AtlasSettings) { go(); return; }
      var sc = doc.createElement('script'); sc.src = '/game/settings_sheet.js'; sc.onload = go; doc.head.appendChild(sc);
    });
    mid.appendChild(b);
    return b;
  }

  var api = { KEY: KEY, STEPS: STEPS, label: label, next: next, read: read, write: write, apply: apply,
    cycle: cycle, restore: restore, mount: mount };
  if (typeof module === 'object' && module.exports) { module.exports = api; }
  root.AtlasTypeScale = api;
  if (root.document && root.document.querySelector) { mount(root.document, root); }
})(typeof window !== 'undefined' ? window : globalThis);
