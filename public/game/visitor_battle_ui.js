(function (root) {
  'use strict';
  var box = root.document.getElementById('visitor-play'), last = null, renderer = null, running = false;
  if (!box) { return; }
  box.addEventListener('visitor:render', function (event) {
    var detail = event.detail, state = detail.state;
    detail.squad = state.troops.map(function (x) { return x.adopcion && x.adopcion.tropa; }); // the House board draws these (visitor_view.js)
    var legend = root.document.createElement('p'); legend.textContent = 'Practice battles · historical provisional rules · balance NO_DATA. No rating or loot. Squad limit 10.'; detail.controls.append(legend);
    root.AtlasVisitorBattle.places().forEach(function (place) {
      var button = root.document.createElement('button'); button.type = 'button'; button.textContent = 'Fight · ' + place.name;
      button.id = 'visitor-fight-' + place.id; button.style.minHeight = '44px'; button.disabled = !state.troops.length || state.busy;
      button.addEventListener('click', async function () {
        if (running) { return; } running = true; button.disabled = true;
        try {
          var troops = detail.game.state().troops.slice(0, 10).map(function (x) { return x.adopcion.tropa; });
          var result = await root.AtlasVisitorBattle.run(place.id, troops, detail.account.info().seed);
          if (!await root.AtlasVisitorBattle.verify(result, detail.account.info().seed)) { throw new Error('Replay did not verify'); }
          detail.account.info(); last = result; if (detail.game.fought) { detail.game.fought(result.combat.gana === 'asalto'); }
          show(result);
          box.dispatchEvent(new CustomEvent('visitor:battle', { detail: result }));
        } catch (error) { legend.textContent = 'NO_DATA: ' + error.message; }
        finally { running = false; button.disabled = false; }
      }); detail.controls.append(button);
    });
  });
  function show(result) {
    var old = root.document.querySelector('#stage > dialog.on-map') || box.querySelector('dialog'); if (old) { old.close(); old.remove(); }
    if (renderer) { renderer.para(); }
    var dialog = root.document.createElement('dialog'); dialog.setAttribute('aria-label', 'Wave battle over OpenWorld'); dialog.style.width = 'min(90vw, 800px)';
    var sentence = root.document.createElement('p'); sentence.id = 'visitor-battle-result';
    var winner = (result.combat.gana === 'asalto' ? 'Visitor wins' : result.combat.gana === 'defensa' ? 'Patrol wins' : 'Draw') + ' · ' + result.combat.rondas + ' rounds · balance NO_DATA: historical provisional rules.';
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
    renderer = root.AtlasWaveDuel.escena(canvas, result.defenders, result.attackers, result.combat, { semilla: result.seed, quieto: root.matchMedia('(prefers-reduced-motion: reduce)').matches, emulado: 0, alFin: finish });
    if (root.matchMedia('(prefers-reduced-motion: reduce)').matches) { renderer.salta(); finish(); }
  }
  root.addEventListener('pagehide', function () { last = null; if (renderer) { renderer.para(); } });
})(globalThis);
