// Way by ear (Round 7 · tactical audio, Mesa #34; AFB «Blindness Accessibility in Video Games» and RNIB «Design for
// every gamer»: say where a chosen place is, how far, and which control brings you closer — then be quiet).
// A building's card offers «Guide me there». The guide reads real facts only: the crab's hex from the place heading
// (#map-h, «Place · q, r»), the building's hex from the painted map, and the step each arrow key would take from
// AtlasMapChunks.dirOf — the very function the crab stick walks with, camera turn included. Nothing is simulated.
// One state, three readers: the chip on the map (eye: «◎ Lottery · 4 hexes · →»), one spoken line in a status region
// that changes only when asked, when the best key changes, and on arrival (ear: sound_first.js / a screen reader),
// and data-* on the chip (machine: data-target, data-dist, data-key, data-state). With the built-in sound on, an
// optional short tone leans left or right with the key; reduced motion keeps the arrival without its pop.
(function (root) {
  'use strict';
  var KEYS = { ArrowUp: [0, -24], ArrowRight: [24, 0], ArrowDown: [0, 24], ArrowLeft: [-24, 0] };
  var WORD = { ArrowUp: 'Up', ArrowRight: 'Right', ArrowDown: 'Down', ArrowLeft: 'Left' };
  var ARROW = { ArrowUp: '↑', ArrowRight: '→', ArrowDown: '↓', ArrowLeft: '←' };
  // Pure: dist(a, b) → hexes between two axial hexes.
  function dist(a, b) { var dq = a[0] - b[0], dr = a[1] - b[1]; return (Math.abs(dq) + Math.abs(dr) + Math.abs(dq + dr)) / 2; }
  // Pure: here(heading) → [q, r] from «Place · q, r», or null when the heading does not say it.
  function here(text) { var m = /(-?\d+), (-?\d+)\s*$/.exec(String(text || '')); return m ? [+m[1], +m[2]] : null; }
  // Pure: nextKey(from, to, dirOf, dirs, deg, squash) → the arrow key whose step lands nearest the target, and that
  // distance. dirOf maps a screen push to a hex direction name; dirs maps names to axial steps. Ties keep key order.
  function nextKey(from, to, dirOf, dirs, deg, squash) {
    var best = null;
    Object.keys(KEYS).forEach(function (k) {
      var s = dirs[dirOf(KEYS[k][0], KEYS[k][1], deg, squash)]; if (!s) { return; }
      var d = dist([from[0] + s[0], from[1] + s[1]], to); if (!best || d < best.d) { best = { key: k, d: d }; }
    });
    return best;
  }
  // Pure: plan(from, to, dirOf, dirs, deg, squash) → the next one or two keys: a diagonal on hexes is walked by
  // alternating two arrows, and saying both once is quieter than «turn» at every step (measured: 5 turns in 5 steps).
  function plan(from, to, dirOf, dirs, deg, squash) {
    var a = nextKey(from, to, dirOf, dirs, deg, squash); if (!a) { return null; }
    var s = dirs[dirOf(KEYS[a.key][0], KEYS[a.key][1], deg, squash)], b = a.d > 1 ? nextKey([from[0] + s[0], from[1] + s[1]], to, dirOf, dirs, deg, squash) : null;
    return b && b.key !== a.key ? [a.key, b.key] : [a.key];
  }
  // Pure: line(name, d, keys, why) → the sentence for the ear; the chip shows the same facts.
  function line(name, d, keys, why) {
    if (d <= 1) { return 'You are next to ' + name + '. Open Node to go in.'; }
    var k = [].concat(keys || []).map(function (x) { return WORD[x] + ' arrow'; });
    return (why === 'turn' ? 'New heading. ' : '') + name + ': ' + d + ' hexes away. Next: ' + k.join(', then ') + '.';
  }
  function chipText(name, d, keys) { return d <= 1 ? '✓ ' + name + ' · here' : '◎ ' + name + ' · ' + d + ' hexes · ' + [].concat(keys).map(function (x) { return ARROW[x]; }).join(' '); }
  // Pure: heading(keys) → one word for a pair, whatever its order: alternating Left/Up is one heading, not two.
  function heading(keys) { return [].concat(keys || []).slice().sort().join('+'); }

  function mount(doc) {
    var surface = doc.getElementById('surface'), head = doc.getElementById('map-h'); if (!surface || !head) { return false; }
    var chip = doc.createElement('div'), txt = doc.createElement('span'), said = doc.createElement('p'), x = doc.createElement('button');
    chip.id = 'way-guide'; chip.hidden = true; chip.setAttribute('role', 'group'); chip.setAttribute('aria-label', 'Guide');
    txt.className = 'way-text'; said.className = 'way-said'; said.setAttribute('role', 'status'); said.setAttribute('aria-live', 'polite');
    x.type = 'button'; x.className = 'way-x'; x.textContent = '✕'; x.setAttribute('aria-label', 'Stop guiding');
    chip.append(txt, x, said); doc.body.appendChild(chip);
    var G = root.AtlasGamepad; if (G && G.paint) { G.paint(x, 'Stop guiding'); }
    var goal = null, spoken = '';
    function facts() {
      var M = root.AtlasMapChunks, C = root.AtlasColonyControls, CP = root.AtlasColoniaPagina, at = here(head.textContent);
      if (!goal || !M || !M.dirOf || !C || !at) { return null; }
      var p = plan(at, [goal.q, goal.r], M.dirOf, C.DIRS, Number(surface.dataset.angle) || 0, CP && CP.SQUASH);
      return p ? { d: dist(at, [goal.q, goal.r]), keys: p, key: p[0] } : null;
    }
    function tone(key, up) { // optional, only when the person turned the built-in sound on
      if (doc.documentElement.dataset.audioOnly !== 'on') { return; }
      try {
        var A = root.AudioContext || root.webkitAudioContext; if (!A) { return; }
        var c = tone.c || (tone.c = new A()), o = c.createOscillator(), g = c.createGain(), p = c.createStereoPanner ? c.createStereoPanner() : null, t = c.currentTime;
        o.type = 'triangle'; o.frequency.setValueAtTime(up ? 523 : 392, t); if (up) { o.frequency.setValueAtTime(659, t + 0.12); }
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.12, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + (up ? 0.32 : 0.18));
        o.connect(g); if (p) { p.pan.value = key === 'ArrowRight' ? 0.7 : key === 'ArrowLeft' ? -0.7 : 0; g.connect(p); p.connect(c.destination); } else { g.connect(c.destination); }
        o.start(t); o.stop(t + 0.34);
      } catch (e) { /* no audio: the words carry it */ }
    }
    function show(why) {
      var f = facts(); if (!f) { chip.dataset.state = 'nodata'; txt.textContent = '◎ ' + goal.name + ' · NO_DATA · the crab is not on the map yet'; return; }
      chip.dataset.dist = f.d; chip.dataset.key = f.key; txt.textContent = chipText(goal.name, f.d, f.keys);
      var arrived = f.d <= 1, h = heading(f.keys), say = why === 'ask' || arrived || String(goal.key).split('+').indexOf(f.key) < 0; // speak only when the key to press now was not in the last words
      chip.dataset.state = arrived ? 'arrived' : 'guiding';
      // the spoken line is shown only while it is the news: a stale «4 hexes» under a chip saying 3 would let the eye
      // and the ear disagree (measured in the first capture); emptying a polite region announces nothing
      if (say) { var s = line(goal.name, f.d, f.keys, why === 'ask' ? '' : 'turn'); if (s !== spoken) { said.textContent = spoken = s; tone(f.key, arrived); } goal.key = h; } else { said.textContent = ''; spoken = ''; }
      if (arrived) {
        if (root.CustomEvent) { doc.dispatchEvent(new root.CustomEvent('acho:event', { detail: { id: 'way/' + goal.id, event: { kind: 'way.arrived', source: 'local' }, frame: { v: 'preceptoros.acho/1', id: 'way/arrived', change: [line(goal.name, f.d, [])], sound: 'rise', motion: 'pulse' }, news: [] } })); }
        goal = null;
      }
    }
    function place() { // under whatever the top of the map already shows (Walk crab, the brief), never over it
      var low = 8; ['ow-controls', 'ow-brief', 'ow-coords'].forEach(function (id) { var e = doc.getElementById(id), r = e && e.getClientRects().length ? e.getBoundingClientRect() : null; if (r && r.top < 160) { low = Math.max(low, r.bottom + 6); } });
      chip.style.top = Math.round(low) + 'px';
    }
    function stop() { goal = null; spoken = ''; chip.hidden = true; delete chip.dataset.state; said.textContent = ''; }
    x.addEventListener('click', stop);
    new root.MutationObserver(function () { if (goal) { show('step'); } if (!chip.hidden) { place(); } }).observe(head, { childList: true, characterData: true, subtree: true });
    // the card's offer: a building whose sheet is open, at the hex the map painted it on (the nearest one of its kind)
    doc.addEventListener('building:enter', function (e) {
      var sheet = doc.getElementById('building-sheet'), id = e.detail && e.detail.id, old = sheet && sheet.querySelector('.bs-way'); if (old) { old.remove(); }
      var MP = root.AtlasMapPainter, V = MP && MP.view && MP.view(), at = here(head.textContent) || [0, 0], h = doc.getElementById('bs-h');
      if (!sheet || !id || !V || !V.world || !V.world.markList || !h || /^Node\b/.test(h.textContent)) { return; }
      var sel = doc.getElementById('surface').dataset.sel, marks = V.world.markList.filter(function (m) { return m.id === id; });
      var mk = marks.filter(function (m) { return m.q + ',' + m.r === sel; })[0] || marks.sort(function (a, b) { return dist(at, [a.q, a.r]) - dist(at, [b.q, b.r]); })[0];
      if (!mk) { return; }
      var b = doc.createElement('button'), name = mk.name || h.textContent.split(' · ')[0]; b.type = 'button'; b.className = 'bs-way'; b.textContent = '◎ Guide me there';
      b.setAttribute('aria-label', 'Guide me to ' + name + ' by sound and text');
      if (G && G.paint) { G.paint(b, 'Guide me there'); }
      b.addEventListener('click', function () { goal = { id: id, name: name, q: mk.q, r: mk.r, key: null }; spoken = ''; chip.hidden = false; chip.dataset.target = id; place(); show('ask'); });
      var live = sheet.querySelector('#bs-live'), band = sheet.querySelector('.bs-skin');
      if (band) { band.after(b); } else if (live) { sheet.insertBefore(b, live); } else { sheet.appendChild(b); }
    });
    return true;
  }
  var api = { KEYS: KEYS, dist: dist, here: here, nextKey: nextKey, plan: plan, line: line, chipText: chipText, heading: heading };
  if (typeof module === 'object' && module.exports) { module.exports = api; }
  root.AtlasWayByEar = api;
  if (root.document && root.document.getElementById && !(typeof module === 'object' && module.exports)) {
    (function wait(n) { if (!mount(root.document) && n < 30) { root.setTimeout(function () { wait(n + 1); }, 400); } })(0);
  }
})(typeof window !== 'undefined' ? window : globalThis);
