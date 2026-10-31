// Neutral terminal view of the shared OpenWorld colony. State and movement rules are shared with /openworld/;
// the walker exists only for this visit and can stand only on a validated LIVE or STALE node.
(function (root) {
  'use strict';
  var doc = root.document, canvas = doc.getElementById('map'), joy = doc.getElementById('joy');
  var status = doc.getElementById('state'), walkerText = doc.getElementById('walker'), causeText = doc.getElementById('cause');
  var CC = root.AtlasColonyControls, CP = root.AtlasColoniaPagina, OS = root.AtlasOpenworldState;
  var colony = null, looks = {}, seals = {}, walker = null, sourceNodes = [], pressed = false, vector = [0, 0], lastDirection = '', frame = 0, ticks = 0;
  var directions = Object.keys(CC.DIRS);

  function axialDirection(x, y) {
    var best = null, score = -Infinity;
    directions.forEach(function (name) {
      var d = CC.DIRS[name], px = d[0] + d[1] / 2, py = d[1] * Math.sqrt(3) / 2;
      var dot = x * px + y * py;
      if (dot > score) { score = dot; best = name; }
    });
    return best;
  }

  function paintJoystick(dx, dy) {
    var box = joy.getBoundingClientRect(), dpr = Math.min(2, root.devicePixelRatio || 1), size = Math.max(96, Math.round(box.width));
    if (joy.width !== Math.round(size * dpr) || joy.height !== Math.round(size * dpr)) { joy.width = Math.round(size * dpr); joy.height = Math.round(size * dpr); }
    var g = joy.getContext('2d'), c = size / 2, r = size * .34;
    g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, size, size);
    g.fillStyle = '#f2f5f7'; g.fillRect(0, 0, size, size);
    g.strokeStyle = '#20182b'; g.lineWidth = 3; g.beginPath(); g.arc(c, c, r, 0, Math.PI * 2); g.stroke();
    g.beginPath(); g.moveTo(c - r, c); g.lineTo(c + r, c); g.moveTo(c - r / 2, c - r * .866); g.lineTo(c + r / 2, c + r * .866); g.moveTo(c + r / 2, c - r * .866); g.lineTo(c - r / 2, c + r * .866); g.stroke();
    var mag = Math.hypot(dx, dy), reach = Math.min(r * .55, mag * r * .55), unit = mag ? [dx / mag, dy / mag] : [0, 0];
    g.fillStyle = '#00b9de'; g.strokeStyle = '#20182b'; g.lineWidth = 3; g.beginPath(); g.arc(c + unit[0] * reach, c + unit[1] * reach, size * .14, 0, Math.PI * 2); g.fill(); g.stroke();
  }

  function draw() {
    var d = Math.min(2, root.devicePixelRatio || 1), w = Math.max(1, root.innerWidth), h = Math.max(1, root.innerHeight);
    if (canvas.width !== Math.round(w * d) || canvas.height !== Math.round(h * d)) { canvas.width = Math.round(w * d); canvas.height = Math.round(h * d); }
    if (colony) {
      try { CP.draw(canvas, colony, 0, true, looks, seals, walker); }
      catch (e) { causeText.textContent = 'NO_DATA: colony renderer refused the state (' + e.message + ').'; }
      var scene = CP.scene(colony, 0, true, looks, seals);
      canvas.setAttribute('aria-label', 'Shared OpenWorld colony map. ' + CP.texto(scene) + (walker ? '. Ephemeral walker on ' + walker.node : '. No walker available.'));
      status.textContent = CP.texto(scene) + (walker ? ' · walker ' + walker.node : ' · no walkable live node');
    } else {
      var g = canvas.getContext('2d'); g.setTransform(d, 0, 0, d, 0, 0); g.fillStyle = '#17131f'; g.fillRect(0, 0, w, h);
      status.textContent = 'NO_DATA: no colony node sealed LIVE or STALE is available.';
      canvas.setAttribute('aria-label', 'Shared OpenWorld colony map. NO_DATA: no colony node sealed LIVE or STALE is available.');
    }
    walkerText.textContent = walker ? 'Ephemeral walker: ' + walker.node + ' · not node state · seal NO_DATA.' : 'Ephemeral walker: NO_DATA · no eligible starting node.';
    paintJoystick(vector[0], vector[1]);
  }

  function move(name) {
    if (!colony || !walker) { causeText.textContent = 'NO_DATA: no LIVE or STALE colony node is available as a starting point.'; return; }
    var d = CC.DIRS[name], q = walker.q + d[0], r = walker.r + d[1], result = CC.move(walker, name, colony.nodes);
    if (!result.ok) {
      var blocked = sourceNodes.filter(function (n) { return n.q === q && n.r === r; })[0];
      causeText.textContent = blocked ? 'NO_DATA: node ' + blocked.id + ' is sealed ' + blocked.seal + '; only LIVE or STALE nodes are walkable.' : result.cause + '; only LIVE or STALE colony nodes are walkable.';
      return;
    }
    walker = result.walker;
    causeText.textContent = 'Moved on the shared map. Walker state is ephemeral and is not saved.';
    draw();
  }

  function directionFromPointer(e) {
    var b = joy.getBoundingClientRect(), x = (e.clientX - b.left) / b.width - .5, y = (e.clientY - b.top) / b.height - .5;
    var l = Math.hypot(x, y); vector = l > .12 ? [x / l, y / l] : [0, 0];
    var next = l > .12 ? axialDirection(vector[0], vector[1]) : '';
    if (next && next !== lastDirection) { move(next); lastDirection = next; }
    else if (next && pressed && ++ticks % 18 === 0) { move(next); }
    paintJoystick(vector[0], vector[1]);
  }

  function finish() {
    pressed = false; vector = [0, 0]; lastDirection = ''; ticks = 0;
    if (frame) { root.cancelAnimationFrame(frame); frame = 0; }
    paintJoystick(0, 0);
  }

  joy.addEventListener('pointerdown', function (e) { joy.setPointerCapture(e.pointerId); pressed = true; ticks = 0; directionFromPointer(e); e.preventDefault(); });
  joy.addEventListener('pointermove', function (e) { if (pressed) { directionFromPointer(e); } });
  joy.addEventListener('pointerup', finish); joy.addEventListener('pointercancel', finish);
  joy.addEventListener('keydown', function (e) {
    var keys = { ArrowRight: 'east', ArrowUp: 'north-east', ArrowLeft: 'west', ArrowDown: 'south-west' };
    if (keys[e.key]) { e.preventDefault(); move(keys[e.key]); }
    else if (e.key === 'Enter' && walker) { var entered = CC.enter(walker, looks[walker.node], null); causeText.textContent = 'Terminal look: ' + entered.look + ' · source ' + entered.source + ' · walker remains ephemeral.'; }
  });
  root.addEventListener('resize', draw);

  root.fetch('/openworld/estado.json', { cache: 'no-cache' }).then(function (r) {
    if (!r.ok) { throw new Error('estado.json returned HTTP ' + r.status); }
    return r.json();
  }).then(function (data) {
    var parsed = OS.leer(data);
    colony = parsed.colonia; looks = parsed.looks; seals = parsed.seals;
    sourceNodes = data && data.colonia && Array.isArray(data.colonia.nodes) ? data.colonia.nodes : [];
    var home = colony && colony.nodes.filter(function (n) { return n.id === 'cabin'; })[0] || colony && colony.nodes[0];
    walker = home ? { node: home.id, q: home.q, r: home.r } : null;
    causeText.textContent = colony ? 'State source: /openworld/estado.json · validated by openworld_state.js. Movement follows colony_controls.js.' : 'NO_DATA: ' + parsed.hidden + ' nodes are hidden because none is sealed LIVE or STALE.';
    draw();
  }).catch(function (e) { causeText.textContent = 'NO_DATA: shared state unavailable or invalid (' + e.message + ').'; draw(); });
  draw();
})(window);
