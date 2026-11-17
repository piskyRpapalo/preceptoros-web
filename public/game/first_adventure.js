// The first adventure (Mission B, 2026-11-16): the tutorial as a walk, built on what exists. One card at the top of the
// map says the step and offers «Go» when there is a road; the crab walks it hex by hex through the map's own step
// control (the same one as the sticks: no teleport, nothing signed by itself). A gold «!» marks the one button to press
// next; the preceptor's head (talk_head.js) explains. Order, fitted to the contracts (the crab is born at Node 0's
// door, the hall on cell 0,0; tutorial_walk.js: the first node, then the beacon):
//   born → play (sign the visit on this device) · meet (the preceptor at Node 0) · beacon (Node 0's beacon: copper)
//   · summon · practice (Go to the coliseum: a practice wave, nothing won or lost) · conquest (Go to a grey building;
//   only a real win counts: a loss says so and lets you try again or skip) · town (what the win opened, the doctor
//   among the basics) · explore (free).
// «Skip tutorial» stores skipped; Help keeps «Resume the first adventure». Steps are derived from the visit's state
// each time (pure: step(s)), so a reload resumes where the visit is; nothing is invented, nothing is sent.
(function (root) {
  'use strict';
  var TOUR = 'preceptoros.tour';
  var STEPS = Object.freeze([
    ['play', 'This little crab is you, at the door of Node 0. Press Play: your visit is signed on this device.'],
    ['meet', 'Hello, I am your preceptor. Node 0 is the town hall: the rack\'s AI answers there. Every building is a door; every number on this map is measured. Shall we begin?'],
    ['beacon', 'Node 0\'s beacon gives your first copper. Press «Visit the beacon».'],
    ['summon', 'Copper buys a summon: an egg that hatches into a troop. The beacon\'s copper pays for two: press the reef summon twice.'],
    ['practice', 'Your troop can practise. Press Go: we walk to the coliseum, hex by hex, and try a practice wave. Nothing is won or lost.'],
    ['conquest', 'Now a real fight. Press Go: we walk to the nearest grey building. Challenge its guardian; only a win counts.'],
    ['town', 'Your conquest opened new buildings in the town. The doctor on duty was open from the start: it makes the game readable for everyone.'],
    ['explore', 'The map is yours. Walk freely; Help keeps every step of this adventure.']
  ].map(Object.freeze));
  var IDS = STEPS.map(function (s) { return s[0]; });
  // Pure: step(v) → the id of the next step, from what the visit has really done. v: { visit, met, claimed, troops,
  // eggs, practised, wins, seen, later } (seen: the town step was read; later: the conquest put off after a loss). 'done' after explore.
  function step(v) {
    v = v || {};
    if (!v.visit) { return 'play'; }
    if (!v.met) { return 'meet'; }
    if (!v.claimed) { return 'beacon'; }
    if (!v.troops && !v.eggs || (v.canSummon && (v.troops || 0) + (v.eggs || 0) < 2)) { return 'summon'; } // two reef summons: the beacon's copper
    if (!v.practised) { return 'practice'; }
    if (!v.wins) { return v.later ? 'explore' : 'conquest'; } // later: no valid win yet, nothing opened
    if (!v.seen) { return 'town'; }
    return 'explore';
  }
  function index(id) { return IDS.indexOf(id); }
  function say(id) { var i = index(id); return i < 0 ? '' : STEPS[i][1]; }
  // Pure: target(id, v) → the selectors of the one control to mark «!», first visible wins ('' when Go is the action).
  function target(id, v) {
    return { play: ['#gp-play', '#welcome-play'], meet: ['#fa-ok'], beacon: ['#visitor-beacon', '.cats [data-cat=Profile]'],
      summon: ['#visitor-summon-tc1', '.cats [data-cat=Profile]'], practice: v && v.at ? ['#bs-challenge'] : ['#fa-go'], // town: first record the win (visitor_conquest.js verifies it)
      conquest: v && v.at ? ['#bs-challenge'] : ['#fa-go', '#fa-ok'], town: ['#visitor-conquer', '#fa-ok'], explore: ['#fa-ok'] }[id] || [];
  }
  var api = { TOUR: TOUR, STEPS: STEPS, IDS: IDS, step: step, say: say, target: target, index: index };
  if (typeof module === 'object' && module.exports) { module.exports = api; return; }
  // One journey per page: a second script load must never install another card,
  // marker, listener, timer or independent progress state.
  if (root.AtlasFirstAdventure && root.document && root.document.getElementById('fa')) { return; }
  root.AtlasFirstAdventure = api;
  var doc = root.document, stage = doc.getElementById('stage'), play = doc.getElementById('visitor-play');
  if (!stage || !play) { return; }
  function get() { try { return root.localStorage.getItem(TOUR) || ''; } catch (e) { return ''; } }
  function put(v) { try { root.localStorage.setItem(TOUR, v); } catch (e) { /* not kept: the card still works this visit */ } if (root.AtlasOwCalm) { root.AtlasOwCalm.refresh(); } }
  var threat = '', st = null, met = false, seen = false, practised = false, lost = 0, later = false, at = '', walking = 0, said = '';
  var card = doc.createElement('section'); card.id = 'fa'; card.setAttribute('aria-label', 'First adventure');
  var count = doc.createElement('p'); count.className = 'fa-count';
  var line = doc.createElement('p'); line.className = 'fa-line'; line.setAttribute('role', 'status');
  var row = doc.createElement('div'); row.className = 'fa-row';
  var go = doc.createElement('button'); go.type = 'button'; go.id = 'fa-go'; go.textContent = 'Go';
  var okB = doc.createElement('button'); okB.type = 'button'; okB.id = 'fa-ok'; okB.textContent = 'OK';
  var skip = doc.createElement('button'); skip.type = 'button'; skip.id = 'fa-skip'; skip.textContent = 'Skip tutorial';
  row.append(go, okB, skip); card.append(count, line, row); stage.appendChild(card);
  var bang = doc.createElement('span'); bang.id = 'fa-bang'; bang.setAttribute('aria-hidden', 'true'); bang.textContent = '!'; doc.body.appendChild(bang);
  var css = doc.createElement('link'); css.rel = 'stylesheet'; css.href = '/game/first_adventure.css'; doc.head.appendChild(css);
  function view() { var MP = root.AtlasMapPainter; return MP && MP.view && MP.view(); }
  function wins() { var V = view(); return V && V.world && V.world.markList ? V.world.markList.filter(function (m) { return m.won; }).length : 0; }
  function now() {
    var s = st || {};
    return step({ visit: !!doc.getElementById('visitor-beacon') || !!st, met: met, claimed: !!s.claimed, troops: (s.troops || []).length, eggs: (s.eggs || []).length, canSummon: !!(s.copper >= 50), practised: practised, wins: wins(), seen: seen, later: later });
  }
  function visible(el) { return !!(el && !el.hidden && !el.disabled && el.getClientRects().length && el.offsetParent !== null); }
  function mark(id) {
    var list = ['.revela .revela-ok'].concat(target(id, { at: at })), el = null; // an egg that hatches now covers the card: its Continue comes first
    var rv = doc.querySelector('#stage > .revela.on-map'), rb = rv && rv.querySelector('.revela-ok'); // a troop is being shown: its Continue comes first (the card waits behind it)
    if (rb && rb.getClientRects().length) { el = rb; }
    for (var i = 0; i < list.length && !el; i++) { var c = doc.querySelector(list[i]); if (visible(c)) { el = c; } }
    var dl = !el && doc.querySelector('#stage > dialog[open]'); if (dl) { el = Array.prototype.find.call(dl.querySelectorAll('button'), function (b) { return /^(Return to the map|Close)$/.test(b.textContent.trim()) && visible(b); }) || null; } // a finished fight still open: the way back
    Array.prototype.forEach.call(doc.querySelectorAll('[data-fa-next]'), function (e) { if (e !== el) { delete e.dataset.faNext; } });
    if (!el) { bang.hidden = true; return null; }
    el.dataset.faNext = '1'; var r = el.getBoundingClientRect();
    if ((r.bottom > root.innerHeight || r.top < 0) && el.scrollIntoView) { el.scrollIntoView({ block: 'nearest' }); }
    // A floating ! overlaps neighbouring buttons in the compact gamepad. Its target has an inset highlight instead.
    bang.hidden = !!el.closest('#gamepad'); if (!bang.hidden) { place(el); }
    return el;
  }
  // place(el): the «!» sits on the marked button's corner. A dialog grows after it is marked (the record button arrives
  // below the verdict), so the corner is read again twice a second while a mark stands: never left on an old spot.
  function place(el) { var r = el.getBoundingClientRect(); bang.style.left = Math.round(r.right + root.scrollX - 12) + 'px'; bang.style.top = Math.round(r.top + root.scrollY - 12) + 'px'; }
  root.setInterval(function () { var e = !bang.hidden && doc.querySelector('[data-fa-next]'); if (e && e.isConnected) { place(e); } }, 500);
  function draw() {
    var t = get(), id = now();
    var waiting = !st && !doc.getElementById('visitor-beacon'), off = waiting || t === 'done' || t === 'skipped';
    // Welcome owns the arrival: the first adventure must not open a second tutorial card before a visit begins.
    card.hidden = off; card.dataset.step = id; if (off) { bang.hidden = true; mark(waiting ? 'play' : ''); return; }
    var i = index(id);
    count.textContent = 'First adventure · ' + (i + 1) + ' of ' + IDS.length;
    var words = say(id);
    if (id === 'practice' && st && !(st.troops || []).length) { words = 'Your egg is hatching into a troop; the house says when. Then press Go to the coliseum.'; }
    var hatching = id === 'conquest' && !walking && !at && st && (st.eggs || []).length > 0; // a real fight waits for the whole squad (measured: two reef troops win about half the time against two reef guards, one alone about one in ten)
    if (hatching) { words = 'Your other egg is still hatching. Wait for it: two troops win about half the time against the weakest guardians; one alone, about one time in ten.'; }
    else if (id === 'conquest' && threat && !lost) { words = threat; }
    if (id === 'conquest' && lost) { words = 'The guardian wins this time (' + lost + (lost === 1 ? ' try' : ' tries') + '): nothing is conquered and the town stays as it was. Press Go: we walk to the next weakest guardian, or choose Later.'; }
    if (line.textContent !== words) { line.textContent = words; said = ''; }
    go.hidden = !(id === 'practice' || id === 'conquest') || !!at; go.textContent = walking ? 'Stop' : 'Go';
    go.disabled = id === 'practice' && st && !(st.troops || []).length || hatching;
    okB.hidden = !(id === 'meet' || id === 'town' || id === 'explore' || (id === 'conquest' && lost)); okB.textContent = id === 'conquest' ? 'Later' : 'OK';
    card.dataset.step = id;
    // the preceptor's head speaks inside this card (talk_head.js); the map bubble stays free for real results
    Array.prototype.forEach.call(card.querySelectorAll('.th'), function (h) { if (said !== id + words) { h.remove(); } });
    if (said !== id + words) { line.classList.remove('th-veiled'); }
    if (said !== id + words && root.AtlasTalkHead && (id === 'meet' || id === 'town' || id === 'practice' || id === 'conquest' || id === 'explore')) { root.AtlasTalkHead.show(line, words); }
    said = id + words;
    root.requestAnimationFrame(function () { mark(id); });
  }
  function hexDist(a, b) { var dq = a.q - b.q, dr = a.r - b.r; return (Math.abs(dq) + Math.abs(dr) + Math.abs(dq + dr)) / 2; }
  // walk(m): the crab walks to m's door, one hex each 260 ms through controls.step; then its card opens (no teleport).
  function walk(m, after) {
    var ow = root.AtlasOpenworldView && root.AtlasOpenworldView(), c = ow && ow.controls, F = root.AtlasMapFog;
    if (!c || !c.step || !c.walker || !F || !F.toward || !m) { line.textContent = 'NO_DATA: the crab is not on the map yet.'; return; }
    var stuck = 0, s = doc.getElementById('surface'); if (s) { delete s.dataset.look; }
    walking = root.setInterval(function () {
      var a = c.walker(), here = a.q + ',' + a.r;
      if (hexDist(a, m) <= 1) { stop(); at = m.q + ',' + m.r; var BS = root.AtlasBuildingSheet, A = root.AtlasMapAura; if (BS && BS.open) { BS.open(m.id); } if (A && A.select && s) { A.select(doc, s, at); } after(m); draw(); return; }
      var dirs = F.toward(a, m); for (var i = 0; i < 3; i++) { c.step(dirs[i]); var b = c.walker(); if (b.q + ',' + b.r !== here) { break; } }
      var n = c.walker(); stuck = n.q + ',' + n.r === here ? stuck + 1 : 0;
      if (stuck > 2) { stop(); line.textContent = 'NO_DATA: the way is blocked here; walk around it with the crab stick, then press Go again.'; }
    }, 260); draw();
  }
  // weakest(list, w) → the grey building whose guardian fields the lightest patrol (values.js order), nearest first,
  // never one already lost to in this visit (a fight is deterministic: the same squad loses the same way). Read only.
  var lostAt = {}, KINDS = { arrecife: 'reef guards', algas: 'kelp guards', ruinas: 'ruin guards', limo: 'silt guards', abismo: 'abyss guards', nucleo: 'core guards' };
  function weakest(list, w) {
    var B = root.AtlasVisitorBattle, P = root.AtlasValores && root.AtlasValores.patrullas, best = null;
    list.forEach(function (m) {
      if (!m.fog || m.won || lostAt[m.q + ',' + m.r] || !B || !P) { return; }
      var pl = B.npcPlace('b:' + m.id + ':' + m.q + ',' + m.r); if (!pl) { return; }
      var tc = pl.troops[0].tc, rank = P.findIndex(function (p) { return p.tc === tc && p.n === pl.troops.length; }), d = hexDist(w, m);
      var c = { m: m, d: d, n: pl.troops.length, tc: tc, kind: KINDS[(P[rank] || {}).id] || 'guards', score: rank * 1000 + d };
      if (!best || c.score < best.score) { best = c; }
    });
    return best;
  }
  api.weakest = weakest;
  function stop() { root.clearInterval(walking); walking = 0; go.textContent = 'Go'; }
  go.addEventListener('click', function () {
    if (walking) { stop(); draw(); return; }
    var V = view(), list = V && V.world && V.world.markList || [], id = now(), m = null;
    if (id === 'practice') { m = list.filter(function (x) { return x.town && x.id === 'coliseum'; })[0]; }
    if (id === 'conquest') { var ow = root.AtlasOpenworldView && root.AtlasOpenworldView(), w = ow && ow.controls && ow.controls.walker && ow.controls.walker(), pick = w && weakest(list, w); m = pick && pick.m;
      if (pick) { threat = line.textContent = 'Walking to the ' + String(m.id).replace(/-/g, ' ') + ' · ' + pick.d + ' hexes · its guardian fields ' + pick.n + ' ' + pick.kind + ' (' + pick.tc + '): the weakest near you.'; } }
    if (!m) { line.textContent = 'NO_DATA: no place for this step on the map.'; return; }
    walk(m, function () {});
  });
  okB.addEventListener('click', function () { var id = now(); if (id === 'meet') { met = true; } else if (id === 'town') { seen = true; } else if (id === 'conquest') { later = true; } else if (id === 'explore') { put('done'); } draw(); });
  skip.addEventListener('click', function () { stop(); put('skipped'); draw(); });
  play.addEventListener('visitor:render', function (e) { var d = e.detail || {}; if (d.state) { st = d.state; } draw(); });
  play.addEventListener('visitor:end', function () { st = null; at = ''; stop(); draw(); });
  play.addEventListener('visitor:battle', function (e) { var d = e.detail || {}; if (d.practice || (d.combat && /coliseum|patrol/.test(String(d.place)))) { practised = true; } else if (d.combat && d.combat.gana === 'asalto') { threat = ''; } else if (d.combat && d.combat.gana !== 'asalto') { lost++; threat = ''; var at0 = /:(-?\d+,-?\d+)$/.exec(String(d.place || '')); if (at0) { lostAt[at0[1]] = 1; } } at = ''; root.setTimeout(draw, 50); });
  var surface = doc.getElementById('surface'); if (surface && root.MutationObserver) { new root.MutationObserver(function () { if (!surface.dataset.sel) { at = ''; } draw(); }).observe(surface, { attributes: true, attributeFilter: ['data-sel'] }); }
  root.addEventListener('resize', function () { mark(now()); });
  doc.addEventListener('click', function () { root.setTimeout(function () { if (!card.hidden) { mark(now()); } }, 150); }); // a panel opened: the «!» follows its button
  doc.addEventListener('scroll', function () { if (!card.hidden) { mark(now()); } }, true);
  // Help keeps the way back: «Resume the first adventure» clears a skip (a finished adventure can be walked again too).
  api.resume = function () { put('started'); draw(); };
  var help = doc.querySelector('.cats [data-cat=Welcome]');
  if (help) { help.addEventListener('click', function () { root.setTimeout(function () {
    var v = doc.getElementById('voices'); if (!v || doc.getElementById('fa-resume')) { return; }
    var b = doc.createElement('button'); b.type = 'button'; b.id = 'fa-resume'; b.textContent = 'Resume the first adventure'; b.style.minHeight = '44px';
    b.addEventListener('click', function () { api.resume(); }); var at0 = v.querySelector('[data-speaker=Tutorial]') || v; at0.appendChild(b);
  }, 0); }); }
  api.draw = draw; api.now = now;
  draw();
})(typeof window !== 'undefined' ? window : globalThis);
