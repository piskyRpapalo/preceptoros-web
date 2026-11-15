// Gestation, at the top of the map (Sovereign 2026-11-15: «elimina los pasos para invocar: una gestación como mini
// mensaje en la parte superior»). A summoned egg no longer waits for steps: it gestates for its class's cycles (one
// second each, visitor_eggs.js) and this small message shows it: an Acho egg whose outline is traced as time passes
// (stroke over pathLength 100: the share of the gestation done), the class, and the seconds left. At term it asks the
// panel to render (visitor:tick) and the egg hatches by itself into the army (Q-06), then says so for a few seconds.
// Eye: the pill. Ear and screen reader: one polite line at start, at term and at hatch, never each second. Machine:
// an «acho:event» per change. One 1 s timer only while an egg gestates; none otherwise. No network, no random numbers.
(function (root) {
  'use strict';
  var EGG = 'M12 2.5C7.4 2.5 4 9 4 14.2 4 18.9 7.6 22 12 22s8-3.1 8-7.8C20 9 16.6 2.5 12 2.5Z'; // an egg: narrow top, round base
  var box = null, pill = null, ring = null, words = null, said = null, eggs = [], timer = 0, done = {}, gone = 0;
  function now() { var E = root.AtlasVisitorEggs; return E && E.clock ? E.clock.now() : Date.now(); }
  // Pure: clock(s) → «m:ss» for the seconds left.
  function clock(s) { s = Math.max(0, Math.ceil(s)); return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2); }
  // Pure: share(left, total) → the traced share of the outline, 0..100, monotone in time.
  function share(left, total) { return total > 0 ? Math.round(100 * Math.min(1, Math.max(0, 1 - left / total))) : 100; }
  // Pure: line(egg, left) → the visible words.
  function line(e, left) { return left > 0 ? clock(left) + ' · ' + e.tc : e.tc + ' · hatching…'; } // the time first: it is what changes
  function tell(text, kind) {
    if (said) { said.textContent = text; }
    var d = root.document; if (root.CustomEvent && d) { d.dispatchEvent(new root.CustomEvent('acho:event', { detail: { id: 'egg/' + kind, event: { kind: 'egg.' + kind, source: 'local' }, frame: { v: 'preceptoros.acho/1', id: 'egg/' + kind, change: [text], sound: 'none', motion: 'none' }, news: [] } })); }
  }
  function build(doc) {
    var stage = doc.getElementById('stage'); if (!stage) { return false; }
    pill = doc.createElement('div'); pill.id = 'gestation'; pill.hidden = true; pill.setAttribute('aria-hidden', 'true');
    pill.innerHTML = '<svg viewBox="0 0 24 24" class="g-egg"><path class="g-shell" d="' + EGG + '"/><path class="g-wave" d="M6.5 15.5q2.75-2 5.5 0t5.5 0"/><path class="g-ring" pathLength="100" d="' + EGG + '"/></svg><span class="g-long">Egg gestating</span><span class="g-words"></span>';
    ring = pill.querySelector('.g-ring'); words = pill.querySelector('.g-words');
    said = doc.createElement('p'); said.id = 'gestation-said'; said.className = 'g-said'; said.setAttribute('role', 'status'); said.setAttribute('aria-live', 'polite');
    stage.appendChild(pill); stage.appendChild(said); return true;
  }
  function paint() {
    var t = now(), live = eggs.filter(function (e) { return !done[e.seq]; });
    if (!live.length) { if (timer) { root.clearInterval(timer); timer = 0; } if (!gone) { pill.hidden = true; } return; }
    var e = live.reduce(function (a, b) { return a.end <= b.end ? a : b; }), left = (e.end - t) / 1000;
    pill.hidden = false; pill.dataset.state = left > 0 ? 'gestating' : 'term';
    ring.style.strokeDasharray = share(left, e.total) + ' 100';
    words.textContent = line(e, left) + (live.length > 1 ? ' · +' + (live.length - 1) : '');
    if (left <= 0) { done[e.seq] = true; tell('Egg ' + e.seq + ' came to term: it hatches into your army.', 'term'); if (box) { box.dispatchEvent(new root.CustomEvent('visitor:tick')); } }
  }
  function render(ev) {
    var s = ev.detail && ev.detail.state; if (!s || !pill || !Array.isArray(s.eggs)) { return; }
    var t = now(), was = eggs.map(function (e) { return e.seq; });
    eggs = s.eggs.map(function (e) { var old = eggs.filter(function (x) { return x.seq === e.seq; })[0]; return { seq: e.seq, tc: e.tc, total: e.total || 1, end: old ? old.end : t + e.remaining * 1000 }; });
    eggs.forEach(function (e) { if (was.indexOf(e.seq) < 0) { tell('Egg ' + e.seq + ' is gestating: it hatches in ' + clock((e.end - t) / 1000) + '.', 'start'); } });
    was.forEach(function (seq) { if (!eggs.some(function (e) { return e.seq === seq; })) { // it left the list: hatched
      tell('Egg ' + seq + ' hatched: a new wave joined your army.', 'hatched');
      pill.hidden = false; pill.dataset.state = 'hatched'; ring.style.strokeDasharray = '100 100'; words.textContent = 'Hatched · new wave';
      if (gone) { root.clearTimeout(gone); } gone = root.setTimeout(function () { gone = 0; paint(); }, 4000);
    } });
    if (!gone) { paint(); }
    if (eggs.some(function (e) { return !done[e.seq]; }) && !timer) { timer = root.setInterval(function () { if (!gone) { paint(); } }, 1000); }
  }
  // The top line (#ow-brief) shows each news for 5 s, then fades (2026-11-15: it covered the node's pill); the screen reader keeps it.
  function brief(doc, n) {
    var b = doc.getElementById('ow-brief'), h = 0; if (!root.MutationObserver) { return; }
    if (!b) { if ((n || 0) < 20) { root.setTimeout(function () { brief(doc, (n || 0) + 1); }, 500); } return; }
    var show = function () { b.classList.add('fresh'); root.clearTimeout(h); h = root.setTimeout(function () { b.classList.remove('fresh'); }, 5000); };
    new root.MutationObserver(show).observe(b, { childList: true, characterData: true, subtree: true }); show();
  }
  function mount(doc) {
    root.setTimeout(function () { brief(doc); }, 0);
    box = doc.getElementById('visitor-play'); if (!box || !build(doc)) { return; }
    box.addEventListener('visitor:render', render);
    box.addEventListener('visitor:end', function () { eggs = []; done = {}; if (timer) { root.clearInterval(timer); timer = 0; } pill.hidden = true; });
  }
  if (root.document && root.document.getElementById) {
    if (root.document.readyState === 'loading') { root.document.addEventListener('DOMContentLoaded', function () { mount(root.document); }); } else { mount(root.document); }
  }
  var api = { clock: clock, share: share, line: line, EGG: EGG };
  if (typeof module === 'object' && module.exports) { module.exports = api; }
  root.AtlasGestation = api;
})(typeof window !== 'undefined' ? window : globalThis);
