// The talking head (Mission D, 2026-11-16): the preceptor's real face (PreceptorOS/assets/caras, cara-habla0…4) beside
// a comic box that reveals an answer ALREADY RECEIVED, phrase by phrase, with a pause at each stop and the mouth moving
// only while a phrase is being revealed. It is presentation, never a fake stream: it starts after the whole text exists.
// Accessibility: the full text stays where it was (a live region or the conversation log), only veiled for the eye;
// the head is aria-hidden, so a screen reader hears the whole answer once, never letter by letter. «Skip» shows all at
// once, «Faster» doubles the pace; reduced motion shows the whole answer at once with a still face. The voice (only
// with the visitor's own sound choice on) says the same full text, once.
(function (root) {
  'use strict';
  var FACES = [0, 1, 2, 3, 4].map(function (i) { return '/assets/caras/cara-habla' + i + '-180.webp'; });
  var MS_PER_CHAR = 38, MIN = 280, MAX = 2600, STOP = 320, BREATH = 140;
  // Pure: phrases(text) → the text cut at its natural stops (. ! ? ; : and « · »), long ones again at commas; joining
  // them gives the text back exactly.
  function phrases(text) {
    var t = String(text || ''), out = [], re = /[^.!?;:·]+(?:[.!?;:·]+|$)\s*/g, m;
    while ((m = re.exec(t)) && m[0]) {
      var p = m[0];
      while (p.length > 90) { var c = p.lastIndexOf(', ', 80); if (c < 20) { break; } out.push(p.slice(0, c + 2)); p = p.slice(c + 2); }
      out.push(p);
    }
    return out.length ? out : [t];
  }
  // Pure: pace(phrase, speed) → { say, rest } in ms: the time to reveal it, then the pause after it (longer at a stop).
  function pace(p, speed) {
    var s = Math.max(1, speed || 1), say = Math.round(Math.max(MIN, Math.min(MAX, MS_PER_CHAR * p.trim().length)) / s);
    return { say: say, rest: Math.round((/[.!?]\s*$/.test(p) ? STOP : BREATH) / s) };
  }
  // Pure: mouth(phrase, k) → the face index for the k-th beat of a phrase: open shapes follow its vowels; 0 is closed.
  function mouth(p, k) {
    var v = String(p).toLowerCase().replace(/[^aeiou]/g, ''); if (!v) { return 0; }
    return 1 + ('aeiou'.indexOf(v[k % v.length]) % 4);
  }
  function reduced(win) { try { return !!win.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } }
  // show(target, text, opts) → { el, skip(), faster(), done }. target keeps the full text for readers; the head is put
  // just before it. opts: { who, voice } — voice: speak it here (the log is not spoken by sound_first.js).
  function show(target, text, opts) {
    var doc = target.ownerDocument, win = doc.defaultView || root, o = opts || {}, list = phrases(text), still = reduced(win);
    var box = doc.createElement(target.tagName === 'LI' ? 'li' : 'span'); box.className = 'th'; box.dataset.state = 'speaking';
    var art = doc.createElement('span'); art.className = 'th-art'; art.setAttribute('aria-hidden', 'true');
    var face = doc.createElement('img'); face.className = 'th-face'; face.alt = ''; face.width = 56; face.height = 56; face.decoding = 'async'; face.src = FACES[0];
    var says = doc.createElement('span'); says.className = 'th-says'; says.dataset.t = '';
    if (o.who) { says.dataset.who = o.who; }
    art.append(face, says); box.append(art);
    var bar = doc.createElement('span'); bar.className = 'th-bar';
    var skipB = doc.createElement('button'), fastB = doc.createElement('button');
    skipB.type = fastB.type = 'button'; skipB.textContent = 'Skip'; fastB.textContent = 'Faster'; fastB.setAttribute('aria-pressed', 'false');
    skipB.setAttribute('aria-label', 'Skip: show the whole answer'); fastB.setAttribute('aria-label', 'Faster: reveal at double pace');
    bar.append(skipB, fastB); box.append(bar);
    target.classList.add('th-veiled'); target.parentNode.insertBefore(box, target);
    var i = 0, shown = '', speed = 1, timer = 0, beat = 0, over = false, resolve;
    var done = new Promise(function (r) { resolve = r; });
    function paint(t, f) { says.dataset.t = t; face.src = FACES[f]; }
    function end() {
      if (over) { return; } over = true; win.clearTimeout(timer); win.clearInterval(beat);
      paint(text, 0); box.dataset.state = 'said'; bar.remove(); resolve(true);
    }
    function step() {
      if (i >= list.length) { end(); return; }
      var p = list[i++], t = pace(p, speed), k = 0, n = Math.max(1, Math.round(t.say / 110));
      win.clearInterval(beat);
      beat = win.setInterval(function () { k++; var c = p.slice(0, Math.ceil(p.length * Math.min(1, k / n))); if (k < n) { c = c.slice(0, c.lastIndexOf(' ') + 1); } paint(shown + c, k >= n ? 0 : mouth(p, k)); if (k >= n) { win.clearInterval(beat); } }, 110);
      timer = win.setTimeout(function () { win.clearInterval(beat); shown += p; paint(shown, 0); timer = win.setTimeout(step, t.rest); }, t.say);
    }
    skipB.addEventListener('click', end); // the voice, if on, goes on: it says the same text
    fastB.addEventListener('click', function () { speed = speed === 1 ? 2 : 1; fastB.setAttribute('aria-pressed', String(speed === 2)); });
    if (o.voice && doc.documentElement.dataset.audioOnly === 'on' && win.speechSynthesis && win.SpeechSynthesisUtterance) {
      try { var u = new win.SpeechSynthesisUtterance(text); win.speechSynthesis.cancel(); win.speechSynthesis.speak(u); } catch (e) { /* no voice: the text stays */ }
    }
    if (still) { end(); } else { step(); }
    return { el: box, skip: end, faster: function () { fastB.click(); }, done: done };
  }
  var api = { FACES: FACES, phrases: phrases, pace: pace, mouth: mouth, show: show };
  if (typeof module === 'object' && module.exports) { module.exports = api; return; }
  root.AtlasTalkHead = api;
  var css = root.document && root.document.createElement('link');
  if (css) { css.rel = 'stylesheet'; css.href = '/game/talk_head.css'; root.document.head.appendChild(css); }
})(typeof window !== 'undefined' ? window : globalThis);
