// The panel sheet (BEAUTY-02, 2026-11-14): the voices panel gets a header with its name, a Listen button and the close
// (panel_x.js) inside it; a bare file picker becomes a labelled «Attach a file» pill (the browser's own picker text is in
// the browser's language, the page is English). Listen reads what the sheet SHOWS, in the order the eye meets it — the
// audio guide is the visual hierarchy said aloud (Sovereign 2026-11-14). It uses the house voice (sound_first.js); with
// no voice in the browser the button says NO_DATA and stays disabled. Projection only: it reads, it never presses.
(function (root) {
  'use strict';
  var TITLES = { Welcome: 'Help', Communication: 'Talk', Profile: 'Your house', Tools: 'Tools' };
  function clean(t) { return String(t || '').replace(/\s+/g, ' ').trim(); }
  function first(t) { var c = clean(t), m = c.match(/^.{1,160}?[.!?](\s|$)/); return m ? m[0].trim() : c.slice(0, 160); }
  // Pure: reading(title, cards) → the lines Listen says. cards: [{ who, head, text, buttons[] }] in screen order.
  function reading(title, cards) {
    var lines = [clean(title) + ' panel.'];
    (cards || []).forEach(function (c) {
      var bits = [c.who, c.head].map(clean).filter(Boolean), line = bits.join(': ');
      if (c.text) { line += (line ? '. ' : '') + first(c.text); }
      var b = (c.buttons || []).map(clean).filter(Boolean);
      if (b.length) { line += (line ? ' ' : '') + 'Buttons: ' + b.join(', ') + '.'; }
      if (line) { lines.push(line); }
    });
    return lines.slice(0, 9);
  }
  function seen(el) { return !!el && el.style.display !== 'none' && !el.hidden && el.getClientRects().length > 0; }
  function cardsOf(v) {
    return Array.prototype.filter.call(v.querySelectorAll(':scope > [data-speaker]'), seen).map(function (li) {
      var who = li.querySelector(':scope > .who'), head = li.querySelector('h3'), p = Array.prototype.find.call(li.querySelectorAll('p'), function (x) { return x !== who && seen(x) && clean(x.textContent); });
      var SF = root.AtlasSoundFirst, buttons = Array.prototype.filter.call(li.querySelectorAll('button'), seen).map(function (b) { return SF ? SF.name(b) : b.textContent; });
      return { who: who && who.textContent, head: head && head.textContent, text: p && p.textContent, buttons: buttons.slice(0, 4) };
    });
  }
  function attach(doc, v) {
    Array.prototype.forEach.call(v.querySelectorAll('input[type=file]'), function (inp) {
      if (inp.closest('label')) { return; }
      var l = doc.createElement('label'), t = doc.createElement('span'); l.className = 'sheet-attach'; t.textContent = '📎 Attach a file';
      inp.parentNode.insertBefore(l, inp); l.appendChild(t); l.appendChild(inp);
      inp.addEventListener('change', function () { var f = inp.files && inp.files[0]; t.textContent = f ? '📎 ' + f.name : '📎 Attach a file'; });
    });
  }
  // Pure: aim(t, w, h, top, left, pad) → the pan step {dx, dy} (canvas px) that brings the point t out from under a sheet
  // whose edge is at top (a bottom sheet) or left (a side sheet): it lands in the middle of what stays visible. {0,0} when
  // t is already in view. The camera is the one pan the map already has (canvas.dataset.panx/pany); no rule changes.
  function aim(t, w, h, top, left, pad) {
    var d = { dx: 0, dy: 0 }; if (!t) { return d; }
    if (top < h && t.y > top - pad) { d.dy = Math.round(top / 2 - t.y); }
    if (left < w && t.x > left - pad) { d.dx = Math.round(left / 2 - t.x); }
    return d;
  }
  // The point to keep in view: the chosen building while the Town sheet is open, else the crab.
  function target(s, V, sheetId) {
    var key = s.dataset.sel, c = sheetId === 'building-sheet' && key && V && V.world && V.world.cells.at[key];
    if (c) { var q = key.split(','), h0 = V.P(+q[0], +q[1]), p = V.turn(h0.x, h0.y); return { x: V.G.cx + p.x * V.G.k, y: V.G.cy + p.y * V.G.k - V.height(c) * V.HSTEP * V.G.k }; }
    return s.dataset.youx ? { x: Number(s.dataset.youx), y: Number(s.dataset.youy) } : null;
  }
  function framer(doc, win) {
    var saved = null, set = null, lookWas = false;
    function glide(s, V, from, to) {
      var still = win.matchMedia && win.matchMedia('(prefers-reduced-motion: reduce)').matches, t0 = null, MS = still ? 0 : 320;
      function f(ts) { if (t0 === null) { t0 = ts; } var p = MS ? Math.min(1, (ts - t0) / MS) : 1, e = 1 - Math.pow(1 - p, 3);
        s.dataset.panx = String(Math.round(from.x + (to.x - from.x) * e)); s.dataset.pany = String(Math.round(from.y + (to.y - from.y) * e)); V.redraw();
        if (p < 1) { win.requestAnimationFrame(f); } }
      win.requestAnimationFrame(f);
    }
    function pan(s) { return { x: Number(s.dataset.panx) || 0, y: Number(s.dataset.pany) || 0 }; }
    return function (sheet, open) {
      var s = doc.getElementById('surface'), V = win.AtlasOpenworldView && win.AtlasOpenworldView();
      if (!s || !V || !V.redraw || s.dataset.stage) { return; }
      if (!open) { if (saved && set && pan(s).x === set.x && pan(s).y === set.y) { if (!lookWas) { delete s.dataset.look; } glide(s, V, set, saved); } saved = set = null; return; }
      var r = s.getBoundingClientRect(), sr = sheet.getBoundingClientRect(), k = r.width ? s.width / r.width : 1;
      var side = sr.left > r.left + r.width / 2; // a side sheet (wide screens) only shifts sideways
      var d = aim(target(s, V, sheet.id), s.width, s.height, side ? s.height : (sr.top - r.top) * k, side ? (sr.left - r.left) * k : s.width, 48 * k);
      if (!d.dx && !d.dy) { return; }
      var from = pan(s); if (!saved) { saved = from; lookWas = !!s.dataset.look; } s.dataset.look = '1'; // the follow-cam waits while a sheet frames
      set = { x: from.x + d.dx, y: from.y + d.dy }; glide(s, V, from, set);
    };
  }
  function mount(doc, win) {
    var v = doc.getElementById('voices');
    if (!v || v.querySelector(':scope > .sheet-head')) { return null; }
    var head = doc.createElement('div'), h = doc.createElement('h2'), say = doc.createElement('button'), x = doc.getElementById('voices-x');
    head.className = 'sheet-head'; h.id = 'voices-title'; v.setAttribute('aria-labelledby', 'voices-title');
    var voice = !!(win.speechSynthesis && win.SpeechSynthesisUtterance);
    say.type = 'button'; say.className = 'sheet-say'; say.textContent = '🔊 Listen'; say.setAttribute('aria-pressed', 'false');
    say.disabled = !voice; say.title = voice ? 'Read this panel aloud' : 'Listen · NO_DATA · this browser has no voice';
    head.appendChild(h); head.appendChild(say); if (x) { head.appendChild(x); }
    v.insertBefore(head, v.firstChild);
    say.addEventListener('click', function () {
      var on = say.getAttribute('aria-pressed') !== 'true', SF = root.AtlasSoundFirst;
      if (win.speechSynthesis) { win.speechSynthesis.cancel(); }
      say.setAttribute('aria-pressed', String(on));
      if (!on || !SF) { return; }
      var lines = reading(h.textContent, cardsOf(v));
      lines.forEach(function (l, i) { SF.speak(win, l, i > 0); });
      var u = win.speechSynthesis; (function done() { win.setTimeout(function () { if (u && u.speaking) { done(); } else { say.setAttribute('aria-pressed', 'false'); } }, 500); })();
    });
    function name() {
      var c = v.dataset.activeCategory; h.textContent = TITLES[c] || c || '';
      if (v.hidden && win.speechSynthesis && say.getAttribute('aria-pressed') === 'true') { win.speechSynthesis.cancel(); say.setAttribute('aria-pressed', 'false'); }
      attach(doc, v);
    }
    name();
    new win.MutationObserver(name).observe(v, { attributes: true, attributeFilter: ['data-active-category', 'hidden'] });
    var frame = framer(doc, win), SHEETS = { voices: 1, 'building-sheet': 1, 'settings-sheet': 1 };
    new win.MutationObserver(function (ms) { ms.forEach(function (m) { var el = m.target; if (SHEETS[el.id]) { win.setTimeout(function () { frame(el, !el.hidden); }, 40); } }); })
      .observe(doc.body, { subtree: true, attributes: true, attributeFilter: ['hidden'] });
    return head;
  }
  var api = { TITLES: TITLES, reading: reading, first: first, aim: aim, mount: mount };
  if (typeof module === 'object' && module.exports) { module.exports = api; return; }
  root.AtlasPanelSheet = api;
  var css = root.document.createElement('link'); css.rel = 'stylesheet'; css.href = '/game/panel_sheet.css'; root.document.head.appendChild(css);
  if (!mount(root.document, root)) { root.document.addEventListener('DOMContentLoaded', function () { mount(root.document, root); }); }
})(typeof window !== 'undefined' ? window : globalThis);
