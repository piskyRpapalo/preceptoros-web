// Test map (test environment, not served to the public). A 20-node colony drawn from four camera angles.
// Camera angle = rotation of the axial hex coordinates in 60-degree steps (q, r) -> (-r, q + r).
// Every frame the page draws is kept in window.__frames so a runner can measure it against the frame law.
(function (root) {
  'use strict';
  var CP = root.AtlasColoniaPagina;
  // 20 nodes: a centre and two rings (the first ring 6 nodes, the second ring 12), axial coordinates.
  var RING1 = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];
  var RING2 = [[2, 0], [2, -1], [2, -2], [1, -2], [0, -2], [-1, -1], [-2, 0], [-2, 1], [-2, 2], [-1, 2], [0, 2], [1, 1]];
  var cells = [[0, 0]].concat(RING1, RING2);
  var looks = ['basic', 'atlantis', 'zombie'];
  var seals = ['LIVE', 'STALE', 'NO_DATA'];
  function rot(q, r, k) { for (var i = 0; i < k; i++) { var t = q; q = -r; r = t + r; } return [q, r]; }
  // The colony validator refuses a state of 1024 bytes or more (measured: 18 nodes is the largest valid colony).
  // The 20 nodes are two sectors of 10, each its own colony state, composed on one canvas per angle.
  function estadoAt(k, sector) {
    var ids = [];
    var nodes = cells.map(function (c, i) { return { c: c, i: i }; }).filter(function (x) { return Math.floor(x.i / 10) === sector; })
      .map(function (x) { var p = rot(x.c[0], x.c[1], k); var id = 'n' + String(x.i).padStart(2, '0'); ids.push(id); return { id: id, q: p[0], r: p[1] }; });
    return { nodes: nodes, buildings: nodes.map(function (n) { return { id: 'b-' + n.id, node: n.id }; }), units: [] };
  }
  var looksOf = {}, sealOf = {};
  cells.forEach(function (c, i) { var id = 'n' + String(i).padStart(2, '0'); looksOf[id] = looks[i % looks.length]; sealOf[id] = seals[i % seals.length]; });
  var ANGLES = [0, 1, 2, 3];
  var NAMES = ['angle 0° · north-up', 'angle 60°', 'angle 120°', 'angle 180°'];
  var walker = { node: 'n00' };
  var T = 3;
  var frames = [];
  var angles = document.getElementById('angles');
  ANGLES.forEach(function (k, a) {
    var fig = document.createElement('figure');
    var cv = document.createElement('canvas');
    cv.width = 720; cv.height = 480; cv.setAttribute('role', 'img');
    cv.setAttribute('aria-label', 'Test map, ' + NAMES[a] + ', 20 nodes');
    var cap = document.createElement('figcaption'); cap.textContent = NAMES[a];
    fig.appendChild(cv); fig.appendChild(cap); angles.appendChild(fig);
    var g = cv.getContext('2d');
    g.fillStyle = '#0b0912'; g.fillRect(0, 0, cv.width, cv.height);
    [0, 1].forEach(function (sector) {
      var est = estadoAt(k, sector);
      var tmp = document.createElement('canvas'); tmp.width = 360; tmp.height = 480;
      var w = sector === 0 && est.nodes.some(function (n) { return n.id === walker.node; }) ? walker : null;
      CP.draw(tmp, est, T, true, looksOf, sealOf, w);
      g.drawImage(tmp, sector * 360, 0);
      var sc = CP.scene(est, T, true, looksOf, sealOf);
      sc.bots.forEach(function (b) { frames.push({ angle: k, kind: 'bot', id: b.id, sector: sector, frame: b.frame }); });
      sc.buildings.forEach(function (b) { frames.push({ angle: k, kind: 'building', id: b.id || '', sector: sector, frame: b.frame }); });
      if (w) frames.push({ angle: k, kind: 'walker', id: 'you', sector: sector, frame: CP.youFrame(walker, T, true) });
    });
  });
  root.__frames = frames;
  document.getElementById('legend').innerHTML = '<li>' + frames.length + ' frames drawn (bots, buildings, walker) across ' + ANGLES.length + ' angles. Reduced motion: still image, one tick.</li>';
})(window);
