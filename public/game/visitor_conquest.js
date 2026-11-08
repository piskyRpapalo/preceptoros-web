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
  // Legible places (Doogee review, 2026-11-02): each name is bubble letters 14 CSS px tall on an ink plate, never under
  // another name or the crab (canvas.dataset.youx/youy); a plate that would collide steps down until it is free, or is
  // left out; the zoom plate counts as taken. The boxes, in CSS px, are written to surface.dataset.places for the browser guard.
  var CAP = 14, PAD = 6;
  function hits(a, b) { return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h; }
  surface.addEventListener('visitor:draw', function () {
    if (!context) { surface.dataset.places = '[]'; return; }
    var g = surface.getContext('2d'), width = surface.width, height = surface.height;
    var px = width / (surface.clientWidth || width), cssW = width / px, cssH = height / px;
    var scale = Math.min(width, height) / 1300, cleared = circles(), taken = [], boxes = [];
    var yx = Number(surface.dataset.youx), yy = Number(surface.dataset.youy);
    if (isFinite(yx) && isFinite(yy) && surface.dataset.youx !== undefined) { taken.push({ x: yx / px - 28, y: yy / px - 40, w: 56, h: 56 }); }
    // The building names (map_chunks.js names()) are taken too: a place name never sits on a building's pill.
    try { JSON.parse(surface.dataset.pills || '[]').forEach(function (b) { taken.push({ x: b[0] / px, y: b[1] / px, w: b[2] / px, h: b[3] / px }); }); } catch (e) { /* no pills yet */ }
    // The zoom plate sits over the map's top-right corner: no name goes under it.
    var zp = doc.getElementById('zoom-controls'), sr = surface.getBoundingClientRect();
    if (zp) { var zr = zp.getBoundingClientRect(); if (zr.width) { taken.push({ x: zr.left - sr.left, y: zr.top - sr.top, w: zr.width, h: zr.height }); } }
    root.AtlasVisitorBattle.places().forEach(function (place) {
      var x = (width / 2 + place.coordinate[0] * scale) / px, y = (height / 2 + place.coordinate[1] * scale) / px;
      var clear = root.AtlasNiebla.niebla(place.coordinate[0], place.coordinate[1], cleared) === 0;
      var tx = place.name + (records[place.id] ? ' +' : ''), lw = root.AtlasAchoLetters.layout(tx).width * CAP / 12;
      var box = { x: Math.round(x - lw / 2 - PAD), y: Math.round(y - CAP / 2 - PAD), w: Math.round(lw + 2 * PAD), h: CAP + 2 * PAD };
      for (var i = 0; i < 12 && taken.some(function (t) { return hits(box, t); }); i++) { box.y += box.h + 2; }
      if (taken.some(function (t) { return hits(box, t); }) || box.x < 0 || box.y < 0 || box.x + box.w > cssW || box.y + box.h > cssH) { return; }
      taken.push(box); boxes.push({ name: place.name, x: box.x, y: box.y, w: box.w, h: box.h, cap: CAP });
      var cx = box.x + box.w / 2, cy = box.y + box.h / 2, hw = box.w / 2, hh = box.h / 2;
      var sentence = place.name + (records[place.id] ? ' · conquered this visit' : ' · local practice place') + ' · sound NO_DATA: off';
      var frame = { v: 'preceptoros.acho/1', id: 'visitor-place', t: context.game.state().step, atoms: [{ k: 'place', r: sentence, i: [
        { o: 'ribbon', f: 'ink', s: 'paper', lw: 2, closed: true, pts: [[-hw, -hh], [hw, -hh], [hw, hh], [-hw, hh]] },
        { o: 'letters', x: 0, y: 0, tx: tx, sz: CAP, f: 'paper', s: 'ink', sh: [0, 0, 'ink'] }] }], bands: ['paper', 'ink'], change: [sentence], sound: 'NO_DATA', soundCause: 'sound off', motion: 'still' };
      if (new TextEncoder().encode(JSON.stringify(frame)).length >= 1024) { return; }
      g.save(); g.setTransform(px, 0, 0, px, cx * px, cy * px); g.globalAlpha = clear ? 1 : 0.6;
      root.AtlasComicAtoms.paint(g, root.AtlasAcho.compile(frame)); g.restore();
    });
    surface.dataset.places = JSON.stringify(boxes);
  });
})(globalThis);
