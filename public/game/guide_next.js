// The guide that guides (Sovereign 2026-11-15: «continue with what the carbon feels»). visitor_play.js said «Ask the
// guide in the chat» whenever it had nothing else to say: after Play, after the first wave, after a conquest. This piece
// names the next real step from the visit's own state and the map, with a place and a distance:
//   no copper claimed → the beacon; copper → summon; a troop and a grey building in the fog → that building, N hexes;
//   every building won → hold them. visitor_play.js asks AtlasGuideNext(s) first and keeps its own line as the fallback.
// Presentation only: reads the state, never changes it.
(function (root) {
  'use strict';
  function dist(a, b) { var dq = a.q - b.q, dr = a.r - b.r; return (Math.abs(dq) + Math.abs(dr) + Math.abs(dq + dr)) / 2; }
  // Pure: line(s, here, marks) → the next step in words, or null (the caller keeps its own line).
  function line(s, here, marks) {
    if (!s) { return null; }
    var fog = (marks || []).filter(function (m) { return m.fog; }), won = (marks || []).filter(function (m) { return m.won; });
    if (!s.claimed && s.copper < 50 && !(s.troops && s.troops.length)) { return 'Claim your first copper: House → Visit the beacon.'; }
    if (!(s.troops && s.troops.length)) { return null; } // summoning and gestation keep visitor_play's own lines
    if (fog.length) {
      var p = here || { q: 0, r: 0 }, near = fog.slice().sort(function (a, b) { return dist(p, a) - dist(p, b); })[0], n = dist(p, near);
      return n ? 'A grey building waits in the fog · ' + n + (n === 1 ? ' hex' : ' hexes') + ' away. Walk there and challenge it.' : 'You stand at a grey building: challenge it.';
    }
    return won.length ? 'Every building is yours. Keep walking: each step your garrisons hold.' : null;
  }
  function guide(s) {
    var V = root.AtlasMapPainter && root.AtlasMapPainter.view && root.AtlasMapPainter.view(), ow = root.AtlasOpenworldView && root.AtlasOpenworldView();
    var w = ow && ow.controls && ow.controls.walker ? ow.controls.walker() : null;
    return line(s, w && typeof w.q === 'number' ? w : null, V && V.world && V.world.markList);
  }
  guide.line = line; guide.dist = dist;
  if (typeof module === 'object' && module.exports) { module.exports = guide; }
  root.AtlasGuideNext = guide;
})(typeof window !== 'undefined' ? window : globalThis);
