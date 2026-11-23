// IC7-S2 · state file of /openworld/, schema v2. Pure: no random numbers, no clock reads, no network.
// v1 (`{ esquema, nodes: [] }`) carries no colony. v2 carries `colonia` with nodes that declare their own seal and date:
// `{ id, q, r, alive, seal, since, mana? }`, and buildings `{ id, node }`. Only a node that is alive AND sealed LIVE
// is drawn. STALE stays in the measured source/seal ledger, not on the map; a LIVE seal needs its dated measurement.
// The geometry is checked by colony_state.js (IC1): at most one building per node, unique ids, no dangling references.
(function (root) {
  'use strict';
  var common = typeof module === 'object' && module.exports;
  var colony = common ? require('./colony_state.js') : root.colony;

  var SEALS = ['LIVE', 'STALE', 'STATIC', 'SIMULATED', 'NO_DATA', 'ERROR'];
  var SHOWN = ['LIVE']; // Visible colony only; historical STALE seals remain in `seals`.
  var V1 = 'preceptoros.openworld-estado/1', V2 = 'preceptoros.openworld-estado/2';
  var DATE = /^\d{4}-\d{2}-\d{2}$/;
  var LOOKS = ['basic', 'ocean', 'flat'];   // IC7-S4 (D11): the node's own face and colour family; default basic
  var ID = /^[a-z0-9][a-z0-9._-]{0,63}$/;

  function fail(cause) { throw new Error('openworld_state: ' + cause); }

  // Persistent public buildings do not imply a currently connected node. This sibling
  // projection deliberately stays outside IC1 colonia.nodes and its LIVE-only selectors.
  function principalBuildings(rows) {
    if (rows === undefined) { return []; } // v2 deployed before the additive field
    if (!Array.isArray(rows) || rows.length > 64) { fail('principal buildings must be a bounded array'); }
    var owners = Object.create(null), buildings = Object.create(null);
    return rows.map(function (b) {
      if (!b || typeof b !== 'object' || typeof b.id !== 'string' || !ID.test(b.id)
        || typeof b.node !== 'string' || !ID.test(b.node) || !Number.isSafeInteger(b.q) || !Number.isSafeInteger(b.r)
        || ['LIVE', 'STALE', 'OFFLINE'].indexOf(b.estado) < 0) { fail('malformed principal building'); }
      if (owners[b.node] || buildings[b.id]) { fail('duplicate principal building owner or id'); }
      owners[b.node] = true; buildings[b.id] = true;
      return { id: b.id, node: b.node, q: b.q, r: b.r, estado: b.estado };
    });
  }

  // One node row, checked field by field. Anything unknown or malformed is refused, never guessed.
  function node(n) {
    if (!n || typeof n !== 'object') { fail('node is not an object'); }
    if (typeof n.id !== 'string' || n.id === '') { fail('node without id'); }
    if (!Number.isSafeInteger(n.q) || !Number.isSafeInteger(n.r)) { fail('node ' + n.id + ' without integer q, r'); }
    if (typeof n.alive !== 'boolean') { fail('node ' + n.id + ' without boolean alive'); }
    if (SEALS.indexOf(n.seal) < 0) { fail('node ' + n.id + ' has an unknown seal ' + JSON.stringify(n.seal)); }
    if (n.since !== null && (typeof n.since !== 'string' || !DATE.test(n.since))) { fail('node ' + n.id + ' has a malformed date'); }
    if (n.seal === 'LIVE' && n.since === null) { fail('node ' + n.id + ' is LIVE without a dated measurement'); }
    var look = n.look === undefined ? 'basic' : n.look;
    if (LOOKS.indexOf(look) < 0) { fail('node ' + n.id + ' has an unknown look ' + JSON.stringify(look)); }
    if (n.pending !== undefined && (typeof n.pending !== 'string' || n.pending === '')) { fail('node ' + n.id + ' has a malformed pending piece'); }
    var row = { id: n.id, q: n.q, r: n.r, alive: n.alive, seal: n.seal, since: n.since, look: look, pending: n.pending };
    // Mana is an optional T2 input. Preserve its declared scalar as-is; the Acho adapter turns absent/invalid values
    // into floor height with NO_DATA and a cause instead of rejecting the otherwise valid node or inventing a value.
    if (Object.prototype.hasOwnProperty.call(n, 'mana')) {
      row.mana = n.mana !== null && typeof n.mana === 'object' ? 'invalid declared mana type' : n.mana;
    }
    return row;
  }

  // leer(estado) → { version, colonia, seals, hidden }. colonia is null for v1, and otherwise the IC1 colony of
  // the nodes that are alive and sealed LIVE, with their buildings. Historical STALE remains in `seals`.
  function leer(estado) {
    var e = estado && typeof estado === 'object' ? estado : {};
    if (e.esquema === undefined || e.esquema === V1) {
      return { version: 1, colonia: null, seals: {}, looks: {}, pending: {}, hidden: 0 };
    }
    if (e.esquema !== V2) { fail('unknown schema ' + JSON.stringify(e.esquema)); }
    var c = e.colonia;
    if (!c || typeof c !== 'object' || !Array.isArray(c.nodes) || !Array.isArray(c.buildings)) {
      fail('schema v2 needs colonia with nodes and buildings arrays');
    }
    var nodes = c.nodes.map(node);
    var landmarks = principalBuildings(e.edificios_principales);
    var landmarkCoverage = e.cobertura_edificios && e.cobertura_edificios.estado === 'MEDIDO'
      && Number.isSafeInteger(e.cobertura_edificios.valor) && e.cobertura_edificios.valor === landmarks.length
      && e.cobertura_edificios.fuente === 'node_buildings'
      ? { estado: 'MEDIDO', valor: landmarks.length, fuente: 'node_buildings' }
      : { estado: 'NO_DATA', causa: e.cobertura_edificios && typeof e.cobertura_edificios.causa === 'string'
        ? e.cobertura_edificios.causa.slice(0, 80) : 'persistent_building_projection_not_published' };
    var visibles = nodes.filter(function (n) { return n.alive && SHOWN.indexOf(n.seal) >= 0; });
    var ids = {};
    visibles.forEach(function (n) { ids[n.id] = true; });
    var buildings = c.buildings.filter(function (b) { return b && ids[b.node]; }).map(function (b) { return { id: b.id, node: b.node }; });
    var seals = {}, looks = {}, pending = {}, mana = {};
    nodes.forEach(function (n) { seals[n.id] = n.seal; });
    visibles.forEach(function (n) {
      looks[n.id] = n.look;
      if (n.pending) { pending[n.id] = n.pending; }
      if (Object.prototype.hasOwnProperty.call(n, 'mana')) { mana[n.id] = n.mana; }
    });
    return {
      version: 2,
      colonia: colony({
        nodes: visibles.map(function (n) { return { id: n.id, q: n.q, r: n.r }; }),
        buildings: buildings,
        units: Array.isArray(c.units) ? c.units.filter(function (u) { return u && ids[u.node]; }).map(function (u) { return { id: u.id, node: u.node }; }) : []
      }),
      seals: seals,
      looks: looks,
      mana: mana,
      principalBuildings: landmarks,
      principalBuildingsCoverage: landmarkCoverage,
      pending: pending,
      hidden: nodes.length - visibles.length
    };
  }

  var AtlasOpenworldState = { SEALS: SEALS, SHOWN: SHOWN, LOOKS: LOOKS, V1: V1, V2: V2, leer: leer };
  if (common) { module.exports = AtlasOpenworldState; }
  else { root.AtlasOpenworldState = AtlasOpenworldState; }
})(typeof globalThis === 'object' ? globalThis : this);
