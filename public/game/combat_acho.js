// Combat, alive (BEAUTY-02 p2, 2026-11-15): «a creature that fights unites geometry, motion, colour, harmonics and
// language; hurt, its face changes; winning, the world says so; beaten, its wave goes out» — and every effect is a fact
// the combat already recorded. This file adds no rule and decides nothing. It reads the resolved practice result of
// visitor_battle.js (defenders, attackers, hits = combat.registro, combat.gana) and gives one state to three readers:
//   eye      a card per fighter (small tiles and a falling count while many stand; the last three unfold, named): its own wave (gacha.punto over its harmonics) loses its overtones as life falls —
//            gacha.mezcla from the bare fundamental to the full spectrum by the bounded ratio life / max — and is a
//            flat line once out; a face whose mouth and eyes follow the same mood; the life count in words
//   ear      one line per round in a status region (who hit, how much, who is out, both sides' life), then the verdict
//   machine  data-state, data-round, data-hits, data-life on the strip; data-life, data-mood on every card
// The replay paces it (duel_face.js calls alGolpe(k) after hit k); the clock never decides what happened: stateAt(k)
// is a closed function of the record. Reduced motion jumps to the end with the same words and attributes.
// The sums are checked against the result: a record that does not add up to combat.vida_por_mil is NO_DATA.
(function (root) {
  'use strict';
  var G = typeof module === 'object' && module.exports ? require('./gacha.js') : root.AtlasGacha, NS = 'http://www.w3.org/2000/svg';
  var WORD = { steady: 'steady', hurt: 'hurt', grave: 'badly hurt', out: 'out' };
  var MOUTH = { steady: 'M19 30q5 5 10 0', hurt: 'M19 32h10', grave: 'M19 34q5-5 10 0', out: 'M19 33h10' };
  // Pure: mood(life, max) → steady | hurt | grave | out, by thirds of the fighter's own life.
  function mood(v, m) { var r = m > 0 ? v / m : 0; return v <= 0 ? 'out' : r < 1 / 3 ? 'grave' : r < 2 / 3 ? 'hurt' : 'steady'; }
  function perMil(L, U) { var v = 0, m = 0; L.forEach(function (x, i) { v += x; m += U[i].max; }); return m ? Math.floor(v * 1000 / m) : 0; } // combat_ticks porMil
  var UNFOLD = 3;
  // Pure: view(standing, over) → 'named' when few still stand, or for the survivors once the fight is over (each gets
  // its name); 'tiles' while many stand (a falling count and small waves), and for a side with none left.
  function view(n, over) { return n > 0 && (over || n <= UNFOLD) ? 'named' : 'tiles'; }
  function nodata(cause) { return { ok: false, cause: cause }; }
  // Pure: read(result, names) → the fighters and the record, or NO_DATA with its cause.
  function read(res, names) {
    var c = res && res.combat, hits = res && res.hits, U;
    if (!c || !Array.isArray(hits) || !Array.isArray(res.defenders) || !Array.isArray(res.attackers) || !Array.isArray(c.vida_por_mil)) { return nodata('the battle sent no record'); }
    try { U = [res.defenders, res.attackers].map(function (tr, s) { return tr.map(function (x, i) { var t = G.tirada(x.semilla, x.tc); return { side: s, i: i, max: t.stats.vida, arm: t.armonicos }; }); }); } catch (e) { return nodata('a fighter could not be read'); }
    if (!hits.every(function (e) { return Array.isArray(e) && e.length === 5 && (e[1] === 0 || e[1] === 1) && U[e[1]][e[2]] && U[1 - e[1]][e[3]] && Number.isInteger(e[4]); })) { return nodata('a hit names no fighter'); }
    var f = { ok: true, U: U, hits: hits, gana: c.gana, rounds: c.rondas, names: names || ['The patrol', 'Your squad'] }, end = stateAt(f, hits.length);
    if (end.pm[0] !== c.vida_por_mil[0] || end.pm[1] !== c.vida_por_mil[1]) { return nodata('the record does not add up to its result'); }
    return f;
  }
  // Pure: stateAt(f, k) → life of every fighter after the first k hits, both sides per mille, the round, the last hit.
  function stateAt(f, k) {
    var L = f.U.map(function (r) { return r.map(function (u) { return u.max; }); }), last = null;
    f.hits.slice(0, k).forEach(function (e) { last = e; if (e[4] >= 0) { L[1 - e[1]][e[3]] = Math.max(0, L[1 - e[1]][e[3]] - e[4]); } });
    return { k: k, round: last ? last[0] : 0, life: L, pm: [perMil(L[0], f.U[0]), perMil(L[1], f.U[1])], last: last };
  }
  function who(f, s, i) { var n = f.names[0].replace(/^The /, ''); return (s ? 'You ' : n.charAt(0).toUpperCase() + n.slice(1) + ' ') + (i + 1); }
  function pct(f, st) { return 'Life: you ' + Math.floor(st.pm[1] / 10) + ' %, ' + f.names[0].toLowerCase() + ' ' + Math.floor(st.pm[0] / 10) + ' %.'; }
  // Pure: script(f, practice) → [{k, round, line}] one line per round, said once the round's last hit is shown, then the
  // verdict at k = all hits. Same record → same lines, in the same order.
  function script(f, practice) {
    var out = [], k = 0;
    for (var n = 1; n <= f.rounds; n++) {
      var hs = f.hits.filter(function (e) { return e[0] === n; }); if (!hs.length) { continue; }
      var before = stateAt(f, k); k += hs.length; var st = stateAt(f, k), parts = [];
      [1, 0].forEach(function (s) {
        var mine = hs.filter(function (e) { return e[1] === s; }), land = mine.filter(function (e) { return e[4] >= 0; }), dmg = 0;
        land.forEach(function (e) { dmg += e[4]; }); if (!mine.length) { return; }
        parts.push(f.names[s] + ': ' + land.length + (land.length === 1 ? ' hit, ' : ' hits, ') + dmg + ' damage' + (mine.length > land.length ? ', ' + (mine.length - land.length) + ' dodged' : ''));
      });
      var outs = []; st.life.forEach(function (r, s) { r.forEach(function (v, i) { if (!v && before.life[s][i]) { outs.push(who(f, s, i)); } }); });
      out.push({ k: k, round: n, line: 'Round ' + n + ' · ' + parts.join('. ') + '.' + (outs.length ? ' ' + outs.join(', ') + (outs.length > 1 ? ' are' : ' is') + ' out.' : '') + ' ' + pct(f, st) });
    }
    var w = f.gana === 'asalto' ? 'Your squad wins' : f.gana === 'defensa' ? f.names[0] + ' wins' : 'Draw';
    out.push({ k: f.hits.length, round: 0, end: true, line: w + ' after ' + f.rounds + ' rounds. ' + pct(f, stateAt(f, f.hits.length)) + (practice ? ' Practice: nothing is won or lost.' : '') });
    return out;
  }
  // Pure: wavePath(arm, r, box) → the fighter's wave as an SVG path: overtones fade with r (life / max), flat when out.
  function wavePath(arm, r, box) {
    var c = box / 2; if (r <= 0) { return 'M' + (c - 14) + ' ' + c + 'h28'; }
    var a = G.mezcla(arm.slice(0, 1), arm, Math.min(1, r)), R = 0, P = [];
    for (var j = 0; j < 72; j++) { var u = j / 72 * Math.PI * 2, p = G.punto(arm, u), q = G.punto(a, u); R = Math.max(R, Math.hypot(p[0], p[1])); P.push(q); }
    var k = (box * 0.44) / (R || 1) * (0.55 + 0.45 * r);
    return P.map(function (p, j) { return (j ? 'L' : 'M') + (c + p[0] * k).toFixed(1) + ' ' + (c + p[1] * k).toFixed(1); }).join('') + 'Z';
  }
  function svg(tag, at) { var e = root.document.createElementNS(NS, tag); Object.keys(at).forEach(function (n) { e.setAttribute(n, at[n]); }); return e; }
  // strip(doc, result, {practice, names, reduce}) → {el, at(k), end()}: the cards, the spoken line, the round log.
  function strip(doc, res, o) {
    o = o || {}; var f = read(res, o.names), el = doc.createElement('section'), live = doc.createElement('p'), ends = false;
    el.className = 'ca-strip'; el.setAttribute('aria-label', 'The fighters'); live.className = 'ca-live'; live.setAttribute('role', 'status');
    if (!doc.querySelector('link[href="/game/combat_acho.css"]')) { var l = doc.createElement('link'); l.rel = 'stylesheet'; l.href = '/game/combat_acho.css'; doc.head.appendChild(l); }
    if (!f.ok) { el.dataset.state = 'nodata'; live.textContent = 'NO_DATA · ' + f.cause; el.append(live); return { el: el, at: function () {}, end: function () {} }; }
    var lines = script(f, o.practice), sides = [], said = {}, shown = 0, cards = [], log = doc.createElement('ol'), box = doc.createElement('details'), sum = doc.createElement('summary'), ban = doc.createElement('p');
    [1, 0].forEach(function (s) {
      var side = doc.createElement('div'), head = doc.createElement('p'), row = doc.createElement('ul');
      side.className = 'ca-side'; side.dataset.side = s; head.className = 'ca-head'; row.className = 'ca-row'; row.setAttribute('aria-label', f.names[s]);
      side.append(head, row); sides.push({ s: s, el: side, head: head });
      f.U[s].forEach(function (u) {
        var li = doc.createElement('li'), pic = svg('svg', { viewBox: '0 0 48 48', 'aria-hidden': 'true' }), wave = svg('path', { class: 'ca-wave' }), mouth = svg('path', { class: 'ca-mouth' }), t = doc.createElement('span');
        li.className = 'ca-card'; li.dataset.side = s; pic.append(wave, svg('circle', { class: 'ca-eye', cx: 20, cy: 22, r: 2.4 }), svg('circle', { class: 'ca-eye', cx: 28, cy: 22, r: 2.4 }), mouth);
        li.append(pic, t); row.appendChild(li); cards.push({ u: u, li: li, wave: wave, mouth: mouth, t: t });
        li.addEventListener('animationend', function () { li.classList.remove('is-struck'); });
      });
      el.appendChild(side);
    });
    ban.className = 'ca-verdict'; ban.hidden = true; sum.textContent = 'Every round'; box.className = 'ca-log'; box.append(sum, log);
    el.append(live, ban, box);
    function paint(k, over) {
      var st = stateAt(f, k), hit = st.last && k > shown ? st.last : null;
      cards.forEach(function (c) {
        var v = st.life[c.u.side][c.u.i], m = mood(v, c.u.max);
        c.li.dataset.life = v; c.li.dataset.mood = m; c.wave.setAttribute('d', wavePath(c.u.arm, v / c.u.max, 48)); c.mouth.setAttribute('d', MOUTH[m]);
        c.t.textContent = who(f, c.u.side, c.u.i) + ' · ' + v + ' of ' + c.u.max + ' · ' + WORD[m];
        if (hit && !o.reduce && hit[4] >= 0 && 1 - hit[1] === c.u.side && hit[3] === c.u.i) { c.li.classList.remove('is-struck'); void c.li.offsetWidth; c.li.classList.add('is-struck'); }
      });
      sides.forEach(function (x) { // many: tiny tiles and a falling count; few (≤ UNFOLD): the ones still standing unfold with their names
        var n = st.life[x.s].filter(function (v) { return v > 0; }).length, all = st.life[x.s].length;
        x.el.dataset.view = view(n, over); x.el.dataset.standing = n; x.head.textContent = f.names[x.s] + ' · ' + n + ' of ' + all + ' standing';
      });
      el.dataset.round = st.round; el.dataset.hits = k; el.dataset.life = st.pm.join(',');
      if (!ends) { el.dataset.state = 'fighting'; }
    }
    function at(k) {
      k = Math.max(0, Math.min(f.hits.length, k | 0)); if (ends) { return; }
      if (k < shown) { lines.forEach(function (x) { if (x.k > k) { delete said[x.round]; } }); }
      paint(k); shown = k; var news = null;
      lines.forEach(function (x) { if (!x.end && x.k <= k && !said[x.round]) { said[x.round] = 1; news = x.line; var li = doc.createElement('li'); li.textContent = x.line; log.appendChild(li); } });
      if (news) { live.textContent = news; } // several rounds at once (a fast replay): the log keeps all, the voice says the newest
    }
    function end() {
      if (ends) { return; } at(f.hits.length); ends = true; paint(f.hits.length, true); var v = lines[lines.length - 1];
      var s = f.gana === 'asalto' ? 'won' : f.gana === 'defensa' ? 'lost' : 'draw';
      el.dataset.state = s; live.textContent = v.line; ban.hidden = false; ban.dataset.state = s; var big = doc.createElement('strong'), rest = doc.createElement('span'), cut = v.line.indexOf('. ');
      big.textContent = (s === 'won' ? '★ ' : s === 'lost' ? '✕ ' : '= ') + v.line.slice(0, cut); rest.textContent = v.line.slice(cut + 1); ban.replaceChildren(big, rest);
      live.classList.add('ca-quiet'); // the stamp shows the same sentence: the eye reads it once, the ear hears it once
      var li = doc.createElement('li'); li.textContent = v.line; log.appendChild(li); tone(s, f);
      if (root.CustomEvent) { doc.dispatchEvent(new root.CustomEvent('acho:event', { detail: { id: 'battle/' + (res.seed || '').slice(0, 12), event: { kind: 'battle.' + s, source: 'local' }, frame: { v: 'preceptoros.acho/1', id: 'battle/' + s, change: [v.line], sound: s === 'won' ? 'rise' : 'fall', motion: o.reduce ? 'none' : 'pulse' }, news: [] } })); }
    }
    function tone(s, f) { // optional, only with the built-in sound on: the winner's own harmonics, rising; a falling pair when lost
      if (doc.documentElement.dataset.audioOnly !== 'on' || s === 'draw') { return; }
      try {
        var A = root.AudioContext || root.webkitAudioContext, c = new A(), arm = f.U[s === 'won' ? 1 : 0][0].arm, re = new Float32Array(17), im = new Float32Array(17), t = c.currentTime;
        arm.forEach(function (h) { var n = Math.min(16, Math.abs(h[0]) || 1); re[n] += Math.abs(h[1]); im[n] += Math.abs(h[2]); });
        [0, 1].forEach(function (j) { var os = c.createOscillator(), g = c.createGain(), w = t + j * 0.2; os.setPeriodicWave(c.createPeriodicWave(re, im)); os.frequency.value = s === 'won' ? [196, 262][j] : [220, 165][j];
          g.gain.setValueAtTime(0.0001, w); g.gain.exponentialRampToValueAtTime(0.1, w + 0.03); g.gain.exponentialRampToValueAtTime(0.0001, w + 0.3); os.connect(g); g.connect(c.destination); os.start(w); os.stop(w + 0.32); });
      } catch (e) { /* no audio: the words carry it */ }
    }
    paint(0); el.dataset.state = 'fighting';
    return { el: el, at: at, end: end };
  }
  var api = { UNFOLD: UNFOLD, view: view, mood: mood, read: read, stateAt: stateAt, script: script, wavePath: wavePath, strip: strip, WORD: WORD };
  if (typeof module === 'object' && module.exports) { module.exports = api; }
  root.AtlasCombatAcho = api;
})(typeof window !== 'undefined' ? window : globalThis);
