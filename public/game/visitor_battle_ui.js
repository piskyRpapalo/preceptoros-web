(function (root) {
  'use strict';
  var box = root.document.getElementById('visitor-play'), last = null, renderer = null, running = false;
  if (!box) { return; }
  var doc = root.document, cur = null, surface = doc.getElementById('surface');
  // House keeps the squad and one honest line; the fights are the NPC buildings on the map (odd/tasks/fog-and-conquest.md C2:
  // the Sovereign moved the combat places out of House; the account fights and conquers the NPC buildings).
  box.addEventListener('visitor:render', function (event) {
    var detail = event.detail, state = detail.state; cur = detail;
    detail.squad = state.troops.map(function (x) { return x.adopcion && x.adopcion.tropa; }); // the House board draws these (visitor_view.js)
    var legend = doc.createElement('p'); legend.id = 'house-fights';
    legend.textContent = 'Fights: walk to a grey NPC building on the map and challenge it. Practice rules · balance NO_DATA. No rating or loot. Squad limit 10.';
    detail.controls.append(legend); offer();
  });
  async function fight(placeId, button, mk) {
    if (running || !cur) { return; } running = true; button.disabled = true;
    try {
      var troops = cur.game.state().troops.slice(0, 10).map(function (x) { return x.adopcion.tropa; });
      var result = await root.AtlasVisitorBattle.run(placeId, troops, cur.account.info().seed);
      if (!await root.AtlasVisitorBattle.verify(result, cur.account.info().seed)) { throw new Error('Replay did not verify'); }
      last = result; var won = result.combat.gana === 'asalto'; if (cur.game.fought) { cur.game.fought(won); }
      if (won && mk) { conquer(mk); }
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
    if (!sheet || sheet.hidden || !mk || !mk.fog) { return; }
    var st = cur && cur.game && cur.game.state && cur.game.state(), b = doc.createElement('button'), ready = !!(st && st.troops && st.troops.length); b.type = 'button'; b.id = 'bs-challenge'; b.className = 'bs-card';
    b.style.minHeight = '44px'; b.disabled = !ready || running;
    b.textContent = ready ? 'Challenge the NPC of this ' + String(mk.id).replace(/-/g, ' ') : 'Challenge · NO_DATA: adopt a troop in House first';
    b.addEventListener('click', function () { fight('b:' + mk.id + ':' + mk.q + ',' + mk.r, b, mk); });
    sheet.insertBefore(b, sheet.lastChild);
  }
  if (surface && root.MutationObserver) { new root.MutationObserver(offer).observe(surface, { attributes: true, attributeFilter: ['data-sel'] }); }
  root.AtlasVisitorConquer = conquer; // the guard checks the conquest path without depending on a duel's outcome
  function show(result) {
    var old = root.document.querySelector('#stage > dialog.on-map') || box.querySelector('dialog'); if (old) { old.close(); old.remove(); }
    if (renderer) { renderer.para(); }
    var dialog = root.document.createElement('dialog'); dialog.setAttribute('aria-label', 'Wave battle over OpenWorld'); dialog.style.width = 'min(90vw, 800px)';
    var sentence = root.document.createElement('p'); sentence.id = 'visitor-battle-result';
    var winner = (result.combat.gana === 'asalto' ? 'Visitor wins' : result.combat.gana === 'defensa' ? 'NPC wins' : 'Draw') + ' · ' + result.combat.rondas + ' rounds · balance NO_DATA: historical provisional rules.';
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
    dialog.append(sentence, canvas, bar, status, close);
    var CS = root.AtlasCrabStage; if (!(CS && CS.hold(dialog))) { box.append(dialog); dialog.showModal(); } // on the map, over the crab (crab_stage.js)
    function finish() { sentence.textContent = winner; canvas.setAttribute('aria-label', winner); }
    renderer = root.AtlasWaveDuel.escena(canvas, result.defenders, result.attackers, result.combat, { semilla: result.seed, quieto: root.matchMedia('(prefers-reduced-motion: reduce)').matches, emulado: 0, alFin: finish, origen: dialog.classList.contains('duel') ? [0.5, 0.5] : null }); // staged: the camera centres the crab
    if (root.matchMedia('(prefers-reduced-motion: reduce)').matches) { renderer.salta(); finish(); }
  }
  root.addEventListener('pagehide', function () { last = null; if (renderer) { renderer.para(); } });
})(globalThis);
