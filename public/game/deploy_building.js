(function (root) {
  'use strict';
  var NODE = typeof module === 'object' && !!module.exports;
  var L = NODE ? require('./reef_building_lifecycle.js') : root.ReefBuildingLifecycle;
  var CEIL = 1024, PIECE = 16384, TOUCH = 44;
  var KINDS = { radio: 'boya', observatory: 'observatorio', tombstones: 'lapidas', crystal: 'cristal', bottle: 'botella',
    monument: 'monumento', nursery: 'vivero', beacon: 'baliza', names: 'nombres' };
  var MISSING = { tv: 'no TV building in the canon: preceptoros.edificio/1 has nine types' };
  var SKINS = { 'marine radio': 'radio', 'zombie radio': 'radio' };

  var api = {};
  function audio() { return api.audio || (NODE ? null : root.AudioFeedbackManager); }
  function voice(verb, state, cause) {
    var A = audio();
    if (!A || typeof A.verb !== 'function') { return { sello: 'NO_DATA', causa: 'audio grammar not loaded' }; }
    var v = A.verb(verb, state, cause);
    return v ? { motivo: v.motivo, texto: v.texto } : { sello: 'NO_DATA', causa: 'audio grammar rejected the pair' };
  }
  function kindOf(name) {
    var n = String(name || '').toLowerCase();
    if (Object.prototype.hasOwnProperty.call(SKINS, n)) { return { kind: SKINS[n], skin: n }; }
    return { kind: n, skin: null };
  }
  function measurements(name) {
    var k = kindOf(name);
    if (MISSING[k.kind]) { return { sello: 'NO_DATA', causa: MISSING[k.kind] }; }
    if (!Object.prototype.hasOwnProperty.call(KINDS, k.kind)) {
      return { sello: 'NO_DATA', causa: k.skin === null ? 'unknown building or skin without base measures' : 'skin without base building' };
    }
    return { base: k.kind, skin: k.skin, tipo: KINDS[k.kind], tiles: [1, 4], touch_px: TOUCH, piece_ceiling_b: PIECE, packet_ceiling_b: CEIL,
      contrast: { sello: 'NO_DATA', causa: 'contrast not measured for this building' },
      ram: { sello: 'NO_DATA', causa: 'memory not measured on a node' } };
  }
  function bytes(o) {
    var s = JSON.stringify(o), n = 0;
    for (var i = 0; i < s.length; i++) { var c = s.charCodeAt(i); n += c < 0x80 ? 1 : c < 0x800 ? 2 : (c >= 0xd800 && c <= 0xdbff) ? (i++, 4) : 3; }
    return n;
  }
  function fit(p) {
    if (bytes(p) < CEIL) { return p; }
    return { esquema: p.esquema, intent: p.intent, estado: 'NO_DATA', causa: 'packet over ' + CEIL + ' UTF-8 bytes; nothing partial is sent' };
  }

  function deploy(name, cell, cycle) {
    var m = measurements(name), base = { esquema: 'preceptoros.orquestador/1', intent: 'DEPLOY_BUILDING' };
    if (m.sello === 'NO_DATA') { return fit(Object.assign(base, { estado: 'NO_DATA', causa: m.causa, voz: voice('deploy', 'NO_DATA', m.causa) })); }
    var c = cell || {}, ok = Number.isSafeInteger(c.col) && Number.isSafeInteger(c.fila) && Number.isSafeInteger(cycle) && cycle >= 0;
    if (!ok) { return fit(Object.assign(base, { estado: 'NO_DATA', causa: 'cell or game cycle not measured', voz: voice('deploy', 'NO_DATA', 'cell or game cycle not measured') })); }
    var manifest = { esquema: 'preceptoros.edificio/1', id: (m.base + '-' + c.col + '-' + c.fila).replace(/[^a-z0-9-]/g, '').slice(0, 40), tipo: m.tipo,
      col: c.col, fila: c.fila, huella: 1, nace_tic: cycle, madura_tics: 10, desgaste_por_tic: 1 };
    var bad = L && L.valida ? L.valida(manifest) : 'lifecycle not loaded';
    if (bad) { return fit(Object.assign(base, { estado: 'NO_DATA', causa: 'manifest: ' + bad, voz: voice('deploy', 'NO_DATA', 'manifest: ' + bad) })); }
    return fit(Object.assign(base, { estado: 'PROPOSED', requiere: 'FIRMO DESPLIEGUE', efecto: 'none until signed', manifiesto: manifest,
      mesuras: { tiles: m.tiles, touch_px: m.touch_px, piece_ceiling_b: m.piece_ceiling_b }, voz: voice('deploy', 'PROPOSED') }));
  }
  function query(manifest, cycle) {
    var base = { esquema: 'preceptoros.orquestador/1', intent: 'QUERY_STATE' };
    if (!L || typeof L.estado !== 'function') { return fit(Object.assign(base, { estado: 'NO_DATA', causa: 'lifecycle not loaded' })); }
    var e = L.estado(manifest, cycle), s = e.fase === 'NO_DATA' ? 'NO_DATA' : e.fase === 'gastado' ? 'STALE' : 'MEASURED';
    var cause = s === 'NO_DATA' ? e.causa : s === 'STALE' ? 'worn: ' + e.desgaste + '/1000' : null;
    return fit(Object.assign(base, { estado: s, fase: e.fase, vida: e.vida == null ? null : e.vida, causa: cause, voz: voice('state', s, cause) }));
  }
  function updateRag() {
    var cause = 'RAG sources live in the app behind its frontier; the web never edits them';
    return { esquema: 'preceptoros.orquestador/1', intent: 'UPDATE_RAG', estado: 'NO_DATA', causa: cause, requiere: 'FIRMO', voz: voice('rag', 'NO_DATA', cause) };
  }

  Object.assign(api, { INTENTS: ['DEPLOY_BUILDING', 'QUERY_STATE', 'UPDATE_RAG'], KINDS: Object.keys(KINDS), SKINS: Object.keys(SKINS),
    measurements: measurements, deploy: deploy, query: query, updateRag: updateRag, bytes: bytes });
  if (NODE) { module.exports = api; } else { root.AtlasDeployBuilding = api; }
})(this);
