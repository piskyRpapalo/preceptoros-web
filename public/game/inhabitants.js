// E4 + B5 · the inhabitants and their state. Each node of /api/world-state (measured by node heartbeats) is one
// inhabitant of the town. Its state comes from the single table (/game/agent_states.json) through agent_state.js:
// a node with a LIVE heartbeat seal is ready; any other is unavailable with the measured cause no_heartbeat. «working» is
// never said, because the source does not measure activity. Inhabitants are named by number, never by machine id.
(function (root) {
  'use strict';

  // from(worldState, S, table) → { ok, people: [{n, shape, text, say}], line }
  function from(world, S, table) {
    var nodes = world && world.colonia && Array.isArray(world.colonia.nodes) ? world.colonia.nodes : null;
    if (!nodes) {
      var cause = world && world.cobertura && typeof world.cobertura.causa === 'string' ? world.cobertura.causa : 'world_state_unreadable';
      return { ok: false, people: [], line: 'NO_DATA · ' + cause.slice(0, 80) };
    }
    var people = nodes.map(function (node, i) {
      if (!node || typeof node.alive !== 'boolean') { return { n: i + 1, shape: 'dash', text: 'NO_DATA', say: 'inhabitant ' + (i + 1) + ' NO_DATA · alive_not_declared' }; }
      // Ready only with a LIVE heartbeat seal (the same rule as «Nodes online»); alive with a STALE seal is not ready.
      var v = S.view(table, S.replay(table, node.alive && node.seal === 'LIVE' ? [] : [{ event: 'drop', cause: 'no_heartbeat' }]));
      return { n: i + 1, shape: v.shape, text: v.text, say: 'inhabitant ' + (i + 1) + ' ' + v.say };
    });
    var ready = people.filter(function (p) { return p.text === 'ready'; }).length;
    var line = people.length ? people.length + ' inhabitants · ' + ready + ' ready · ' + people.map(function (p) { return p.say; }).join('; ') +
      ' · working NO_DATA (the heartbeat does not measure activity)' : 'no inhabitants yet · the town is empty';
    return { ok: true, people: people, line: line };
  }

  var api = { from: from };
  if (typeof module === 'object' && module.exports) { module.exports = api; }
  root.AtlasInhabitants = api;
})(typeof window !== 'undefined' ? window : globalThis);
