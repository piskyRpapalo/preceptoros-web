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
  function circles() {
    return root.AtlasVisitorBattle.places().filter(function (place) { return !!records[place.id]; }).map(function (place) { return { x: place.coordinate[0], y: place.coordinate[1], r: 200 }; });
  }
  surface.addEventListener('visitor:draw', function () {
    if (!context) { return; }
    var g = surface.getContext('2d'), width = surface.width, height = surface.height;
    var scale = Math.min(width, height) / 1300, cleared = circles();
    root.AtlasVisitorBattle.places().forEach(function (place) {
      var x = width / 2 + place.coordinate[0] * scale, y = height / 2 + place.coordinate[1] * scale;
      var clear = root.AtlasNiebla.niebla(place.coordinate[0], place.coordinate[1], cleared) === 0;
      var sentence = place.name + (records[place.id] ? ' · conquered this visit' : ' · local practice place') + ' · sound NO_DATA: off';
      var frame = { v: 'preceptoros.bubble/1', id: 'visitor-place', t: context.game.state().step, atoms: [{ k: 'place', r: sentence, i: [{ o: 'letters', x: 0, y: 0, tx: place.name + (records[place.id] ? ' +' : ''), sz: 10, f: 'paper', s: 'ink' }] }], bands: ['paper', 'ink'], change: [sentence], sound: 'NO_DATA', soundCause: 'sound off', motion: 'still' };
      if (new TextEncoder().encode(JSON.stringify(frame)).length >= 1024) { return; }
      g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.translate(x, y); g.globalAlpha = clear ? 1 : 0.5;
      root.AtlasComicAtoms.paint(g, root.AtlasBubble.compile(frame)); g.restore();
    });
  });
})(globalThis);
