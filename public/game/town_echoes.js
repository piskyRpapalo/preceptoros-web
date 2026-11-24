// Town echoes (Sovereign 2026-11-24, «la nueva ronda para actualizar los eventos»). Of the three building classes
// (odd/tasks/three-building-classes.md) two already speak on the 'acho:event' bus: a node's building (online_nodes.js,
// building.state) and a whitepaper conquest (holdings_map.js, holding.won). The tutorial buildings opened in silence:
// a real conquest unlocked the workshop, the agora… and nothing said so. This piece only listens to the visit
// (visitor:render, visitor:battle), reads each town building's state from ow_calm.js, and when one goes from locked to
// available it says one echo, «Workshop opens in the town», with the building's hex in its id, so echo_feed.js lists it
// and breathes a ring out of that hex on the map floor. Nothing is invented: no visit, no change, no echo.
(function (root) {
  'use strict';
  var NAMES = { hostel: 'Hostel', coliseum: 'Coliseum', choir: 'Choir', workshop: 'Workshop', tower: 'Tower', agora: 'Agora', customs: 'Customs', 'visitor-house': 'Visitor house', doctor: 'Doctor' };
  // opened(before, now) → the ids that were 'locked' and are now 'available'. Pure; tested in town_echoes_cases.
  function opened(before, now) { return Object.keys(now || {}).filter(function (id) { return (before || {})[id] === 'locked' && now[id] === 'available'; }); }
  // echo(id, q, r) → the acho:event detail that one opening says. Pure.
  function echo(id, q, r) {
    var line = (NAMES[id] || id) + ' opens in the town · walk to it';
    return { id: 'town/open/' + id + '/' + q + ',' + r, event: { kind: 'town.open', source: 'local' },
      frame: { v: 'preceptoros.acho/1', id: 'town/open', change: [line], sound: 'rise', motion: 'pulse' }, news: [] };
  }
  var api = { opened: opened, echo: echo, NAMES: NAMES };
  if (typeof module === 'object' && module.exports) { module.exports = api; return; }
  root.AtlasTownEchoes = api;
  var doc = root.document, last = null;
  function read() {
    var C = root.AtlasOwCalm, MP = root.AtlasMapPainter, V = MP && MP.view && MP.view(), o = {}, at = {};
    if (!C || !C.stateOf || !V || !V.world || !V.world.markList) { return null; }
    V.world.markList.forEach(function (m) { if (m.town && !o[m.id]) { o[m.id] = C.stateOf(m); at[m.id] = m; } });
    return { states: o, at: at };
  }
  function look() {
    var s = read(); if (!s) { return; }
    if (last) { opened(last, s.states).forEach(function (id) { var m = s.at[id]; doc.dispatchEvent(new root.CustomEvent('acho:event', { detail: echo(id, m.q, m.r) })); }); }
    last = s.states;
  }
  var play = doc.getElementById('visitor-play');
  if (play) {
    play.addEventListener('visitor:render', function () { root.setTimeout(look, 0); });
    play.addEventListener('visitor:battle', function () { root.setTimeout(look, 600); }); // the conquest lands after the replay is recorded
    play.addEventListener('visitor:end', function () { last = null; });
  }
  look();
})(typeof window !== 'undefined' ? window : globalThis);
