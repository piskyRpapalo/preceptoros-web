(function (root) {
  'use strict';
  var doc = root.document, box = doc.getElementById('visitor-play'), surface = doc.getElementById('surface');
  if (!box || !surface) { return; }
  var context = null, records = Object.create(null), visit = null;
  var list = doc.createElement('ul'); list.id = 'visitor-conquests'; list.setAttribute('aria-label', 'Session territory records'); box.append(list);
  function changed() {
    list.replaceChildren();
    Object.keys(records).forEach(function (id) { var item = doc.createElement('li'); item.textContent = id + ' · conquered locally at visit step ' + records[id].step + ' · clearing radius 200 · wall-clock date NO_DATA: no trusted date source'; list.append(item); });
    box.dispatchEvent(new Event('visitor:changed'));
  }
  function clear() { records = Object.create(null); context = null; visit = null; changed(); }
  box.addEventListener('visitor:render', function (event) {
    var next = event.detail.account.info().seed;
    if (visit !== next) { records = Object.create(null); visit = next; }
    context = event.detail; changed();
  });
  box.addEventListener('visitor:end', clear);
  root.addEventListener('pagehide', clear);
  box.addEventListener('visitor:battle', function (event) {
    var result = event.detail, captured = context, dialog = box.querySelector('dialog');
    if (!captured || !dialog || result.combat.gana !== 'asalto') { return; }
    var button = doc.createElement('button'); button.id = 'visitor-conquer'; button.textContent = 'Record this local conquest'; button.style.minHeight = '44px';
    button.addEventListener('click', async function () {
      button.disabled = true;
      try {
        if (context !== captured || !await root.AtlasVisitorBattle.verify(result, captured.account.info().seed)) { throw new Error('Current visit and verified victory are required'); }
        captured.account.info();
        if (records[result.place]) { throw new Error('This place is already recorded in this visit'); }
        records[result.place] = { place: result.place, step: captured.game.state().step, seed: result.seed, rules: result.rules };
        changed(); button.textContent = 'Conquest recorded for this visit';
      } catch (error) { button.textContent = 'NO_DATA: ' + error.message; }
    }); dialog.append(button);
  });
  // The old screen-fixed place names (Reef, Kelp, Ruins, Silt, Abyss, Core) are retired (Sovereign, 2026-11-08: «letters of
  // an old engine around the character»). They did not follow the camera; the duels keep their places in the House panel,
  // and odd/tasks/places-on-the-map.md gives the places real hexes. The map writes no place plates any more.
  surface.addEventListener('visitor:draw', function () { surface.dataset.places = '[]'; });
})(globalThis);
