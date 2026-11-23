// The preceptor's dialogue box (Sovereign, 2026-11-08; odd/tasks/preceptor-talk.md), since the commission «the crab alive»
// piece 3 a comic speech bubble on the map whose tail points at the crab: what is said lives in the world, not in a panel. Deterministic: each line is a function of what the
// visitor has done (the crab walked, a building opened, the visit started), never of the clock or chance. Interactive:
// every line offers its own answers (44 px buttons). The line is spoken by aria-live; nothing is stored or sent.
(function (root) {
  'use strict';
  // LINES: id → [text, [[answer, next id], …]]. «wait:<event>» lines move on by themselves when the event happens.
  var LINES = {
    hello: ['This little crab is you. Shall we walk?', [['Walk', 'walk'], ['A building', 'building'], ['Later', 'rest']]],
    walk: ['Right stick walks. Left stick turns and tilts the map.', [['A building', 'building'], ['Later', 'rest']], 'walked'],
    walked: ['Well walked! Each hex is one step of your visit.', [['A building', 'building'], ['Later', 'rest']]],
    building: ['Every building is a door: tap one near you.', [['How to play', 'play'], ['Later', 'rest']], 'entered'],
    entered: ['Enter three buildings: a quest pays copper and light.', [['How to play', 'play'], ['Later', 'rest']]],
    play: ['Press ▶ to start a visit: eggs, summons, quests.', [['Thanks', 'rest']], 'playing'],
    playing: ['Your visit is on. Claim quests in the House.', [['Thanks', 'rest']]],
    rest: ['I am here when you need me.', [['Talk again', 'hello']]]
  };
  var WAITS = { walked: 'walked', entered: 'entered', playing: 'playing' };

  // next(at, event) → the line after an event; the same (at, event) always gives the same line (pure, tested).
  function next(at, event) {
    var l = LINES[at];
    if (l && l[2] && WAITS[l[2]] && event === l[2]) { return l[2]; }
    if (event === 'entered' && (at === 'hello' || at === 'walked' || at === 'walk')) { return 'entered'; }
    if (event === 'walked' && at === 'hello') { return 'walked'; } // a visitor who just walks is answered too
    return at;
  }
  function choose(at, i) { var l = LINES[at]; return l && l[1][i] ? l[1][i][1] : at; }

  function mount(doc, win) {
    var pad = doc.getElementById('gamepad');
    if (!pad || doc.getElementById('preceptor-talk')) { return null; }
    var css = doc.createElement('link'); css.rel = 'stylesheet'; css.href = '/game/talk.css'; doc.head.appendChild(css);
    var trail = doc.createElement('script'); trail.src = '/game/click_trail.js'; doc.head.appendChild(trail); // the app's ball and sting on every click
    var talk = doc.createElement('script'); talk.src = '/game/open_talk.js'; doc.head.appendChild(talk); // E0: the basic chat to the rack (Communication)
    var led = doc.createElement('script'); led.src = '/game/holdings_live.js'; doc.head.appendChild(led); // C8: Buildings owned, from the Rust ledger
    var box = doc.createElement('section'); box.id = 'preceptor-talk'; box.setAttribute('aria-label', 'Your preceptor');
    var head = doc.createElement('p'); head.className = 'pt-line';
    var who = doc.createElement('button'); who.type = 'button'; who.className = 'pt-who'; who.textContent = 'Preceptor'; who.setAttribute('aria-expanded', 'false');
    var line = doc.createElement('span'); line.setAttribute('aria-live', 'polite');
    var row = doc.createElement('div'); row.className = 'pt-row';
    head.appendChild(who); head.appendChild(line); box.appendChild(head); box.appendChild(row);
    var stage = doc.getElementById('stage');
    if (stage) { stage.appendChild(box); box.classList.add('pt-bubble'); } else { pad.parentNode.insertBefore(box, pad); }
    var at = 'hello'; box.classList.add('pt-min'); // minimized by default: it never insists (Sovereign, 2026-11-08); a tap on its name opens it
    who.addEventListener('click', function () { var open = box.classList.toggle('pt-min') === false; who.setAttribute('aria-expanded', String(open)); box.classList.remove('pt-new'); place(); });
    function draw() {
      var l = LINES[at]; unhead(); line.textContent = l[0]; row.textContent = ''; box.dataset.at = at; box.classList.toggle('pt-rest', at === 'rest');
      l[1].forEach(function (a, i) {
        var b = doc.createElement('button'); b.type = 'button'; b.textContent = a[0];
        b.addEventListener('click', function () { at = choose(at, i); draw(); place(); });
        row.appendChild(b);
      });
    }
    // the talking head (talk_head.js) speaks a piece of news; the line keeps the whole text for readers
    function unhead() { line.classList.remove('th-veiled'); Array.prototype.forEach.call(head.querySelectorAll('.th'), function (h) { h.remove(); }); }
    function on(event) { var to = next(at, event); if (to !== at) { at = to; draw(); } }
    // place(): above the crab with the tail down; near the top edge, below it with the tail up. Projection only.
    function place() {
      var sf = doc.getElementById('surface');
      if (!stage || !sf || !sf.dataset.youx) { return; }
      var r = sf.getBoundingClientRect(), st = stage.getBoundingClientRect(), k = r.width / sf.width;
      var cx = r.left - st.left + Number(sf.dataset.youx) * k, cy = r.top - st.top + Number(sf.dataset.youy) * k;
      var gap = 16 + 30 * Math.max(0.5, Number(sf.dataset.zoom) || 1) * k * (sf.width / (r.width || sf.width)); // the crab grows with the zoom
      var w = box.offsetWidth, h = box.offsetHeight;
      var off = !isFinite(cx) || !isFinite(cy) || cx < 0 || cy < 0 || cx > st.width || cy > st.height;
      var above = cy - gap - h, below = cy + 14, up = above >= 8;
      // A piece of news docks at the foot of the map, above the beacon bar (2026-11-15): it must be seen without covering
      // the crabs and the beacon it speaks about; the follow-cam keeps the crab in the middle band, away from the foot.
      var news = box.classList.contains('pt-news'), sb = stage.getBoundingClientRect().bottom, foot = 0;
      ['coop-beacon', 'online-actions'].forEach(function (id) { var e = doc.getElementById(id); if (e && e.offsetParent) { foot = Math.max(foot, sb - e.getBoundingClientRect().top); } });
      var dock = news || off || (!up && below + h > st.height - 8);
      // A crab off-screen must never drag the preceptor's voice over the title or outside the scene.
      var left = dock ? 8 : Math.max(8, Math.min(Math.max(8, st.width - w - 8), cx - w / 2));
      var top = dock ? Math.max(8, st.height - h - 8 - foot) : up ? above : below;
      box.classList.remove('pt-tuck'); box.classList.toggle('pt-docked', dock);
      box.style.left = Math.round(left) + 'px'; box.style.top = Math.round(top) + 'px';
      box.style.setProperty('--tail', Math.round(Math.max(18, Math.min(w - 18, cx - left))) + 'px'); box.classList.toggle('pt-under', !up && !dock);
    }
    // news(text, who): an observed result/resource notice, not a second talking character.
    // The adventure owns the speaking bust; this notification keeps its original text, aria-live and OK.
    function news(text, who, open) {
      // One message on the map (Sovereign, 2026-11-23): while the first adventure's card speaks at the top, a result is
      // written inside it, under the step, instead of opening a second box at the foot of the map.
      var fa = doc.getElementById('fa');
      if (fa && !fa.hidden && fa.offsetParent) {
        var fn = doc.getElementById('fa-news');
        if (!fn) { fn = doc.createElement('p'); fn.id = 'fa-news'; fn.className = 'fa-news'; fn.setAttribute('role', 'status'); var l = fa.querySelector('.fa-line'); fa.insertBefore(fn, l ? l.nextSibling : null); }
        fn.textContent = who + ' · ' + text; return;
      }
      // The resting bubble is gone from the map (Sovereign, 2026-11-14: it covered the world). Only a result that was
      // asked for (a fogged building, a duel) shows here, open, until OK; then nothing rests on the map again.
      var back = at; void open; box.classList.add('pt-news'); box.classList.remove('pt-min', 'pt-new'); who0.setAttribute('aria-expanded', 'true'); unhead(); line.textContent = text; who0.textContent = who; row.textContent = ''; // A result is a receipt, not a second preceptor face.
      var b = doc.createElement('button'); b.type = 'button'; b.textContent = 'OK';
      b.addEventListener('click', function () { box.classList.remove('pt-news'); box.classList.add('pt-min'); who0.setAttribute('aria-expanded', 'false'); who0.textContent = 'Preceptor'; at = back; draw(); place(); });
      row.appendChild(b); place();
    }
    var who0 = who;
    if (stage && win.ResizeObserver) { new win.ResizeObserver(function () { place(); }).observe(stage); } // a panel shrinks the map
    new (win.MutationObserver || function () { this.observe = function () {}; })(function () {
      var res = doc.getElementById('visitor-battle-result'), t = res && res.textContent;
      if (t && t !== 'Round by round\u2026' && box.dataset.said !== t) { box.dataset.said = t; news(t, 'Duel'); }
    }).observe(doc.body || doc.documentElement, { subtree: true, childList: true, characterData: true });
    var s = doc.getElementById('surface'), home = null;
    if (s) {
      s.addEventListener('visitor:draw', function () {
        var ow = win.AtlasOpenworldView && win.AtlasOpenworldView(), w = ow && ow.controls && ow.controls.walker && ow.controls.walker();
        if (!w) { return; }
        var k = w.q + ',' + w.r;
        if (home === null) { home = k; } else if (k !== home) { on('walked'); }
        place();
      });
    }
    doc.addEventListener('building:enter', function () { on('entered'); });
    var vp = doc.getElementById('visitor-play');
    if (vp) { vp.addEventListener('visitor:changed', function () { if (doc.getElementById('visitor-beacon') || doc.querySelector('#visitor-play .quests')) { on('playing'); } }); }
    draw();
    return { at: function () { return at; }, say: on, news: news, place: place };
  }

  var api = { LINES: LINES, next: next, choose: choose, mount: mount };
  if (typeof module === 'object' && module.exports) { module.exports = api; }
  root.AtlasPreceptorTalk = api;
  if (root.document && root.document.getElementById) { api.view = mount(root.document, root); }
})(typeof window !== 'undefined' ? window : globalThis);
