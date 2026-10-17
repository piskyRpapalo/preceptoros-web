(function (root) {
  'use strict';
  var common = typeof module === 'object' && module.exports;
  var B = common ? require('./node_bindings.js') : root.AtlasNodeBindings;
  var N = common ? require('./nodos.js') : root.AtlasNodos;
  var Q = common ? require('./cuenta.js') : root.AtlasCuenta;
  var F = common ? require('./fog_of_war.js') : root.AtlasNiebla;
  var views = new WeakSet();
  function freeze(value) {
    if (value && typeof value === 'object') { Object.keys(value).forEach(function (key) { freeze(value[key]); }); Object.freeze(value); }
    return value;
  }
  function nodes(receipt, lang) {
    var cause = B.message('hardware_unmeasured', lang);
    var out = B.isVerified(receipt) ? receipt.bindings.map(function (binding) {
      function absent() { return { estado: 'NO_DATA', valor: null, causa: cause }; }
      var site = F && F.sitioNodo(binding.node);
      return { nodo: binding.node, admin: binding.account, credential_sha256: binding.credential_sha256,
        position: site ? { x: site.x, y: site.y } : null,
        position_cause: site ? null : B.message('position_unassigned', lang),
        aparato: { dispositivo: cause, medidas: { ram_mib: absent(), gen_cps: absent() } } };
    }) : [];
    freeze(out); views.add(out); return out;
  }
  function isNodes(value) { return views.has(value); }
  function select(value, fallback) { return value === undefined ? fallback : isNodes(value) ? value : []; }
  function find(receipt, account) {
    return B.isVerified(receipt) ? receipt.bindings.find(function (binding) { return binding.account === account; }) : null;
  }
  function state(receipt, account) {
    var binding = find(receipt, account);
    return binding ? freeze(Q.estadoNodo({ nodo: binding.node })) : null;
  }
  function traits(receipt, account, weights) {
    if (!find(receipt, account)) { return null; }
    var error = N.validaPesos(weights); if (error) { return null; }
    return freeze(N.rasgosDeNiveles({ ram_mib: null, gen_cps: null }, weights));
  }
  var api = Object.freeze({ nodes: nodes, isNodes: isNodes, select: select, state: state, traits: traits });
  if (common) { module.exports = api; } else { root.AtlasNodeProjection = api; }
})(globalThis);
