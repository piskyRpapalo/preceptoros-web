(function (root) {
  'use strict';
  var box = root.document.getElementById('visitor-play'), last = null, renderer = null, running = false;
  if (!box) { return; }
  var doc = root.document, cur = null, surface = doc.getElementById('surface');
  var face = doc.createElement('script'); face.src = '/game/duel_face.js'; doc.head.appendChild(face); // the duel's creature-wave face
  var cq = doc.createElement('script'); cq.src = '/game/conquest_sheet.js'; doc.head.appendChild(cq);
  var ca = doc.createElement('script'); ca.src = '/game/combat_acho.js'; doc.head.appendChild(ca); // the fighters' cards, voice and data-* (BEAUTY-02 p2) // C3: the Conquest card in Town
  // House keeps the squad and one honest line; the fights are the NPC buildings on the map (odd/tasks/fog-and-conquest.md C2:
  // the Sovereign moved the combat places out of House; the account fights and conquers the NPC buildings).
  box.addEventListener('visitor:render', function (event) {
    var detail = event.detail, state = detail.state; cur = detail;
    detail.squad = state.troops.map(function (x) { return x.adopcion && x.adopcion.tropa; }); // the House board draws these (visitor_view.js)
    var legend = doc.createElement('p'); legend.id = 'house-fights';
    // The fights are the grey NPC buildings (fog restored 2026-11-15, fog-and-conquest.md C2); the Coliseum also hosts a
    // practice wave against the house patrol, with the real rules and replay — no reward, no territory, nothing stored.
    legend.textContent = 'Fights: each grey building in the fog is held by an NPC guardian. Walk to one (the ⚔ arrow at the map edge points the way) and challenge it; a win holds it for this visit. A practice wave at the Coliseum gives nothing. Squad limit 10.';
    var go = doc.createElement('button'); go.type = 'button'; go.id = 'house-coliseum'; go.textContent = 'Go to the Coliseum'; go.style.minHeight = '44px';
    go.addEventListener('click', function () { var BS = root.AtlasBuildingSheet; if (BS && BS.open) { BS.open('coliseum'); } });
    var walk = doc.createElement('button'); walk.type = 'button'; walk.id = 'house-guardian'; walk.textContent = 'Walk to the nearest guardian'; walk.style.minHeight = '44px';
    walk.addEventListener('click', function () { var F = root.AtlasMapFog, x = doc.getElementById('voices-x'); if (x) { x.click(); } if (F && F.go) { F.go(); } }); // the panel closes: the map leads
    detail.controls.append(legend, walk, go); offer();
  });
  async function fight(placeId, button, mk, practice) {
    if (running || !cur) { return; } running = true; button.disabled = true;
    try {
      var troops = cur.game.state().troops.slice(0, 10).map(function (x) { return x.adopcion.tropa; });
      var result = await root.AtlasVisitorBattle.run(placeId, troops, cur.account.info().seed);
      if (!await root.AtlasVisitorBattle.verify(result, cur.account.info().seed)) { throw new Error('Replay did not verify'); }
      last = result; result.practice = !!practice; var won = result.combat.gana === 'asalto';
      if (!practice) { if (cur.game.fought) { cur.game.fought(won); } if (won && mk) { conquer(mk); } } // practice counts nothing
      show(result);
      box.dispatchEvent(new CustomEvent('visitor:battle', { detail: result }));
    } catch (error) { button.textContent = 'NO_DATA: ' + error.message; }
    finally { running = false; button.disabled = false; }
  }
  // conquer(mk): a win takes the building for this visit only (never stored or sent): colour, a flag, a wide clearing.
  // The floor is baked, so the painter's bake cache is dropped once to repaint the building in colour.
  function conquer(mk) {
    mk.fog = false; mk.won = true; if (root.AtlasMapFog && root.AtlasMapFog.won) { root.AtlasMapFog.won(mk); }
    var MP = root.AtlasMapPainter, ow = root.AtlasOpenworldView && root.AtlasOpenworldView();
    if (MP && MP.resetCache) { MP.resetCache(); }
    if (ow && ow.redraw) { ow.redraw(); }
  }
  // offer(): while a grey NPC building's card is open, the card offers the challenge (or says why it cannot).
  function offer() {
    var sheet = doc.getElementById('building-sheet'), old = doc.getElementById('bs-challenge'); if (old) { old.remove(); }
    var V = root.AtlasMapPainter && root.AtlasMapPainter.view && root.AtlasMapPainter.view(), key = surface && surface.dataset.sel;
    var mk = V && key && V.world.marks && V.world.marks[key];
    var drill = mk && !mk.fog && mk.id === 'coliseum', pat = drill && root.AtlasValores && root.AtlasValores.patrullas[0];
    if (!sheet || sheet.hidden || !mk || !(mk.fog || pat)) { return; }
    var st = cur && cur.game && cur.game.state && cur.game.state(), b = doc.createElement('button'), ready = !!(st && st.troops && st.troops.length); b.type = 'button'; b.id = 'bs-challenge'; b.className = 'bs-card';
    b.style.minHeight = '44px'; b.disabled = running;
    b.textContent = !ready ? (cur ? 'No troop yet · go to House and hatch one' : 'No visit yet · press Play') : drill ? 'Practice wave · your squad against the house patrol · no reward' : 'Challenge the NPC of this ' + String(mk.id).replace(/-/g, ' ');
    b.addEventListener('click', function () { var x = sheet.querySelector('.bs-bar button:last-child'); if (x) { x.click(); }
      if (!ready) { var go = cur ? doc.querySelector('.cats [data-cat=Army]') : ['gp-play', 'welcome-play', 'play-now'].map(function (i) { return doc.getElementById(i); }).find(function (e) { return e && !e.hidden && e.offsetParent; }); if (go) { go.click(); } /* House lives in Profile */ root.setTimeout(function () { box.scrollIntoView({ block: 'start' }); }, 300); return; } /* a way forward, not a dead end (2026-11-15) */ /* the card closes: the wave gets the whole map */ if (drill) { fight(pat.id, b, null, true); } else { fight('b:' + mk.id + ':' + mk.q + ',' + mk.r, b, mk); } });
    sheet.insertBefore(b, sheet.lastChild);
  }
  if (surface && root.MutationObserver) { new root.MutationObserver(offer).observe(surface, { attributes: true, attributeFilter: ['data-sel'] }); }
  root.AtlasVisitorConquer = conquer; // the guard checks the conquest path without depending on a duel's outcome
  function show(result) {
    var old = root.document.querySelector('#stage > dialog.on-map') || box.querySelector('dialog'); if (old) { old.close(); old.remove(); }
    if (renderer) { renderer.para(); }
    var dialog = root.document.createElement('dialog'); dialog.setAttribute('aria-label', 'Wave battle over OpenWorld'); dialog.style.width = 'min(90vw, 800px)';
    var sentence = root.document.createElement('p'); sentence.id = 'visitor-battle-result';
    var winner = (result.combat.gana === 'asalto' ? (result.practice ? 'Your squad wins' : 'Visitor wins') : result.combat.gana === 'defensa' ? (result.practice ? 'The patrol wins' : 'NPC wins') : 'Draw') + ' · ' + result.combat.rondas + ' rounds' + (result.practice ? ' · practice: no reward, no territory' : '') + ' · balance NO_DATA: historical provisional rules.';
    sentence.textContent = 'Round by round…'; // the winner is set only when the replay ends (finish)
    var canvas = root.document.createElement('canvas'); canvas.style.width = '100%'; canvas.setAttribute('role', 'img'); canvas.setAttribute('aria-label', sentence.textContent);
    var close = root.document.createElement('button'); close.textContent = 'Return to the map'; close.style.minHeight = '44px'; close.addEventListener('click', function () { dialog.close(); });
    dialog.addEventListener('close', function () { if (renderer) { renderer.para(); renderer = null; } });
    var replay = root.AtlasBattleReplayControls, state = replay.start(), bar = root.document.createElement('div');
    var status = root.document.createElement('p'); status.setAttribute('role', 'status'); status.textContent = replay.label(state);
    function control(text, action, pressed) {
      var b = root.document.createElement('button'); b.type = 'button'; b.textContent = text; b.style.minHeight = '44px'; b.style.minWidth = '44px';
      if (pressed !== undefined) { b.setAttribute('aria-pressed', String(pressed)); }
      b.addEventListener('click', function () { state = action(state); if (renderer) { renderer.velocidad(replay.rate(state)); } status.textContent = replay.label(state); render(); });
      return b;
    }
    function render() {
      bar.replaceChildren();
      bar.append(state.paused ? control('Play', replay.play) : control('Pause', replay.pause));
      replay.SPEEDS.forEach(function (v) { bar.append(control('×' + v, function (st) { return replay.setSpeed(st, v); }, state.speed === v)); });
    }
    render();
    var CA = root.AtlasCombatAcho, still = root.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var strip = CA ? CA.strip(root.document, result, { practice: result.practice, reduce: still, names: [result.practice ? 'The patrol' : 'The NPC', 'Your squad'] }) : null;
    dialog.append(sentence, canvas); if (strip) { dialog.append(strip.el); } dialog.append(bar, status, close);
    var CS = root.AtlasCrabStage; if (!(CS && CS.hold(dialog))) { box.append(dialog); dialog.showModal(); } // on the map, over the crab (crab_stage.js)
    function finish() { sentence.textContent = winner; canvas.setAttribute('aria-label', winner); if (strip) { strip.end(); } }
    var F = root.AtlasDuelFace, L = { log: function () { return result.hits || []; }, alGolpe: function (k) { if (strip) { strip.at(k); } } };
    // the creature-wave face when the wave renderer is there (duel_face.js); else the older face, never a blank
    renderer = F && F.ready() ? F.scene(canvas, result.defenders, result.attackers, result.combat, Object.assign(L, { campo: true, lugar: result.place, semilla: result.seed, quieto: root.matchMedia('(prefers-reduced-motion: reduce)').matches, emulado: 0, alFin: finish, origen: dialog.classList.contains('duel') ? [0.5, 0.5] : null })) : root.AtlasWaveDuel.escena(canvas, result.defenders, result.attackers, result.combat, { semilla: result.seed, quieto: root.matchMedia('(prefers-reduced-motion: reduce)').matches, emulado: 0, alFin: finish, origen: dialog.classList.contains('duel') ? [0.5, 0.5] : null }); // staged: the camera centres the crab
    if (root.matchMedia('(prefers-reduced-motion: reduce)').matches) { renderer.salta(); finish(); }
  }
  root.addEventListener('pagehide', function () { last = null; if (renderer) { renderer.para(); } });
})(globalThis);
