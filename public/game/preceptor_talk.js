// The preceptor's dialogue box (Sovereign, 2026-11-08; odd/tasks/preceptor-talk.md): a small header above the gamepad
// where the preceptor talks to the visitor without hiding the map. Deterministic: each line is a function of what the
// visitor has done (the crab walked, a building opened, the visit started), never of the clock or chance. Interactive:
// every line offers its own answers (44 px buttons). The line is spoken by aria-live; nothing is stored or sent.
(function (root) {
  'use strict';
  // LINES: id → [text, [[answer, next id], …]]. «wait:<event>» lines move on by themselves when the event happens.
  var LINES = {
    hello: ['This little crab is you. Shall we walk?', [['Walk', 'walk'], ['A building', 'building'], ['Later', 'rest']]],
    walk: ['Right stick walks. Left stick looks around.', [['A building', 'building'], ['Later', 'rest']], 'walked'],
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
    return at;
  }
  function choose(at, i) { var l = LINES[at]; return l && l[1][i] ? l[1][i][1] : at; }

  function mount(doc, win) {
    var pad = doc.getElementById('gamepad');
    if (!pad || doc.getElementById('preceptor-talk')) { return null; }
    var box = doc.createElement('section'); box.id = 'preceptor-talk'; box.setAttribute('aria-label', 'Your preceptor');
    var head = doc.createElement('p'); head.className = 'pt-line';
    var who = doc.createElement('span'); who.className = 'pt-who'; who.textContent = 'Preceptor';
    var line = doc.createElement('span'); line.setAttribute('aria-live', 'polite');
    var row = doc.createElement('div'); row.className = 'pt-row';
    head.appendChild(who); head.appendChild(line); box.appendChild(head); box.appendChild(row);
    pad.parentNode.insertBefore(box, pad);
    var at = 'hello';
    function draw() {
      var l = LINES[at]; line.textContent = l[0]; row.textContent = ''; box.dataset.at = at; box.classList.toggle('pt-rest', at === 'rest');
      l[1].forEach(function (a, i) {
        var b = doc.createElement('button'); b.type = 'button'; b.textContent = a[0];
        b.addEventListener('click', function () { at = choose(at, i); draw(); });
        row.appendChild(b);
      });
    }
    function on(event) { var to = next(at, event); if (to !== at) { at = to; draw(); } }
    var s = doc.getElementById('surface'), home = null;
    if (s) {
      s.addEventListener('visitor:draw', function () {
        var ow = win.AtlasOpenworldView && win.AtlasOpenworldView(), w = ow && ow.controls && ow.controls.walker && ow.controls.walker();
        if (!w) { return; }
        var k = w.q + ',' + w.r;
        if (home === null) { home = k; } else if (k !== home) { on('walked'); }
      });
    }
    doc.addEventListener('building:enter', function () { on('entered'); });
    var vp = doc.getElementById('visitor-play');
    if (vp) { vp.addEventListener('visitor:changed', function () { if (doc.getElementById('visitor-beacon') || doc.querySelector('#visitor-play .quests')) { on('playing'); } }); }
    draw();
    return { at: function () { return at; }, say: on };
  }

  var api = { LINES: LINES, next: next, choose: choose, mount: mount };
  if (typeof module === 'object' && module.exports) { module.exports = api; }
  root.AtlasPreceptorTalk = api;
  if (root.document && root.document.getElementById) { api.view = mount(root.document, root); }
})(typeof window !== 'undefined' ? window : globalThis);
