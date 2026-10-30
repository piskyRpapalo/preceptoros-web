(function (root) {
  'use strict';
  var box = root.document.getElementById('visitor-play'), last = null, renderer = null, running = false;
  if (!box) { return; }
  box.addEventListener('visitor:render', function (event) {
    var detail = event.detail, state = detail.state;
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
          detail.account.info(); last = result;
          show(result);
          box.dispatchEvent(new CustomEvent('visitor:battle', { detail: result }));
        } catch (error) { legend.textContent = 'NO_DATA: ' + error.message; }
        finally { running = false; button.disabled = false; }
      }); detail.controls.append(button);
    });
  });
  function show(result) {
    var old = box.querySelector('dialog'); if (old) { old.close(); old.remove(); }
    if (renderer) { renderer.para(); }
    var dialog = root.document.createElement('dialog'); dialog.setAttribute('aria-label', 'Wave battle over OpenWorld'); dialog.style.width = 'min(90vw, 800px)';
    var sentence = root.document.createElement('p'); sentence.id = 'visitor-battle-result';
    sentence.textContent = (result.combat.gana === 'asalto' ? 'Visitor wins' : result.combat.gana === 'defensa' ? 'Patrol wins' : 'Draw') + ' · ' + result.combat.rondas + ' rounds · balance NO_DATA: historical provisional rules.';
    var canvas = root.document.createElement('canvas'); canvas.style.width = '100%'; canvas.setAttribute('role', 'img'); canvas.setAttribute('aria-label', sentence.textContent);
    var close = root.document.createElement('button'); close.textContent = 'Return to the map'; close.style.minHeight = '44px'; close.addEventListener('click', function () { dialog.close(); });
    dialog.addEventListener('close', function () { if (renderer) { renderer.para(); renderer = null; } });
    dialog.append(sentence, canvas, close); box.append(dialog); dialog.showModal();
    renderer = root.AtlasWaveDuel.escena(canvas, result.defenders, result.attackers, result.combat, { semilla: result.seed, quieto: root.matchMedia('(prefers-reduced-motion: reduce)').matches, emulado: 0, anuncia: function (text) { canvas.setAttribute('aria-label', text); } });
    if (root.matchMedia('(prefers-reduced-motion: reduce)').matches) { renderer.salta(); }
  }
  root.addEventListener('pagehide', function () { last = null; if (renderer) { renderer.para(); } });
})(globalThis);
