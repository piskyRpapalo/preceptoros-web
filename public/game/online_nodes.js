// Read-only UI projection of the existing /api/world-state feed. No node creation, heartbeat or grants.
// A node without LIVE+alive is never offered as a destination. Conquest/visitors are separate identities.
(function (root) {
  'use strict';
  // Same canonical node-id grammar as the gateway src/index.js NODE_ID; this does not grant admission.
  var ID = /^[a-z0-9][a-z0-9._-]{0,63}$/;
  function liveNodes(rows) {
    if (!Array.isArray(rows)) { return []; }
    var seen = Object.create(null), out = [];
    rows.slice(0, 64).forEach(function (n) {
      if (!n || typeof n !== 'object' || typeof n.id !== 'string' || !ID.test(n.id)
          || n.alive !== true || n.seal !== 'LIVE' || !Number.isSafeInteger(n.q) || !Number.isSafeInteger(n.r)
          || seen[n.id]) { return; }
      seen[n.id] = true;
      out.push({ id: n.id, q: n.q, r: n.r, seal: 'LIVE' });
    });
    return out.sort(function (a, b) { return a.id.localeCompare(b.id); });
  }
  function mount(doc, win) {
    if (!doc || !doc.getElementById) { return null; }
    var toggle = doc.getElementById('online-nodes-toggle'), panel = doc.getElementById('online-nodes'),
      otherToggle = doc.getElementById('online-players-toggle'), otherPanel = doc.getElementById('online-players'),
      select = doc.getElementById('online-node-select'), visit = doc.getElementById('online-node-visit'),
      state = doc.getElementById('online-nodes-state'), service = doc.getElementById('online-node-service'),
      buildingState = doc.getElementById('online-buildings-state'), buildingList = doc.getElementById('online-buildings-list');
    if (!toggle || !panel || !otherToggle || !otherPanel || !select || !visit || !state || !service) { return null; }
    var nodes = [], principalBuildings = [], principalBuildingCoverage = { estado: 'NO_DATA', causa: 'not_checked' };
    function setPanel(button, element, open) {
      element.hidden = !open;
      button.setAttribute('aria-expanded', open ? 'true' : 'false');
    }
    toggle.addEventListener('click', function () {
      var next = panel.hidden;
      setPanel(otherToggle, otherPanel, false);
      setPanel(toggle, panel, next);
    });
    otherToggle.addEventListener('click', function () {
      var next = otherPanel.hidden;
      setPanel(toggle, panel, false);
      setPanel(otherToggle, otherPanel, next);
    });
    function announce(sentence, ok, cause) {
      state.textContent = sentence;
      state.dataset.state = ok ? 'MEDIDO' : 'NO_DATA';
      state.dataset.cause = ok ? '' : cause;
      state.dataset.world = JSON.stringify({ liveNodes: nodes.map(function (n) { return n.id; }), principalBuildings: principalBuildings,
        principalBuildingsCoverage: principalBuildingCoverage });
      var F = root.AtlasStateFrames;
      if (!F || !F.stateFrame) { state.dataset.acho = 'NO_DATA(frame_core_unavailable)'; return; }
      var frame = F.stateFrame({id:'world/nodes',sentence:sentence,waves:[]});
      frame.seal = !ok ? 'NO_DATA' : nodes.length ? 'LIVE' : 'STATIC';
      if (F.valida(frame).length) { state.dataset.acho = 'NO_DATA(frame_breaks_the_law)'; return; }
      state.dataset.acho = JSON.stringify(frame);
      if (typeof win.CustomEvent === 'function') {
        doc.dispatchEvent(new win.CustomEvent('acho:event', { detail: { id: 'world/nodes', frame: frame,
          world: { liveNodes: nodes.map(function (n) { return n.id; }), principalBuildings: principalBuildings,
            principalBuildingsCoverage: principalBuildingCoverage } } }));
      }
    }
    function updateService() {
      var id = select.value, found = nodes.some(function (n) { return n.id === id; });
      visit.disabled = !found;
      if (!found) { service.textContent = 'NO_DATA: no verified node selected.'; return; }
      var b = principalBuildings.find(function (x) { return x && x.node === id && typeof x.id === 'string'; });
      service.textContent = (b ? 'Persistent principal building ' + b.id + ' · ' + b.estado + '. ' : '') +
        'NO_DATA: this node has no independently verified service grant for this control.';
    }
    function selectBuilding(b) {
      if (typeof win.CustomEvent === 'function') { doc.dispatchEvent(new win.CustomEvent('world:building-selected', { detail: { building: b } })); }
    }
    function buildingView(b) {
      var sentence = 'Principal building ' + b.id + ', owned by ' + b.node + ', parcel ' + b.q + ', ' + b.r
        + '. Node status ' + b.estado + '. The building remains registered while the node is offline; this is not a LIVE heartbeat.';
      var F = root.AtlasStateFrames, frame = F && F.stateFrame
        ? F.stateFrame({ id: 'building/' + b.id, sentence: sentence, waves: [] })
        : { v: 'preceptoros.acho/1', id: 'building/' + b.id, atoms: [{ k: 'principal-building', r: sentence, i: [] }], change: [sentence], sound: 'NO_DATA: no building sound declared' };
      frame.seal = b.estado; frame.status = b.estado; frame.source = 'gateway:/api/world-state';
      frame.owner = b.node; frame.q = b.q; frame.r = b.r;
      return { sentence: sentence, frame: frame };
    }
    doc.addEventListener('world:building-selected', function (event) {
      var b = event.detail && event.detail.building;
      if (!b || typeof b.id !== 'string' || ['LIVE', 'STALE', 'OFFLINE'].indexOf(b.estado) < 0) { return; }
      var view = buildingView(b), frame = view.frame;
      doc.dispatchEvent(new win.CustomEvent('acho:event', { detail: { id: 'building/' + b.id,
        event: { kind: 'building.state', status: b.estado, source: 'gateway' }, frame: frame, news: [] } }));
      var ow = win.AtlasOpenworldView && win.AtlasOpenworldView();
      if (ow && ow.controls && ow.controls.say) { ow.controls.say(view.sentence); }
      var B = root.AtlasNodeBeacon, owner = B && B.nodes && B.nodes().find(function (n) { return n.id === b.node; });
      if (owner && B.TALKS[owner.id]) { B.open(owner); }
    });
    function render(data) {
      var old = select.value;
      nodes = liveNodes(data && data.nodes);
      principalBuildings = data && Array.isArray(data.principalBuildings) ? data.principalBuildings.filter(function (b) {
        return b && typeof b.id === 'string' && ID.test(b.id) && typeof b.node === 'string' && ID.test(b.node)
          && Number.isSafeInteger(b.q) && Number.isSafeInteger(b.r) && ['LIVE', 'STALE', 'OFFLINE'].indexOf(b.estado) >= 0;
      }).slice(0, 64) : [];
      principalBuildingCoverage = data && data.principalBuildingsCoverage || { estado: 'NO_DATA', causa: 'persistent_building_projection_not_published' };
      while (select.firstChild) { select.removeChild(select.firstChild); }
      var empty = doc.createElement('option'); empty.value = ''; empty.textContent = nodes.length ? 'Choose a live node' : 'No verified live nodes';
      select.appendChild(empty);
      nodes.forEach(function (n) {
        var option = doc.createElement('option');
        option.value = n.id; option.textContent = n.id + ' · LIVE';
        select.appendChild(option);
      });
      if (nodes.some(function (n) { return n.id === old; })) { select.value = old; }
      else { select.value = ''; }
      var buildingsMeasured = principalBuildingCoverage.estado === 'MEDIDO';
      toggle.textContent = 'Nodes (' + nodes.length + ')';
      if (buildingState) { buildingState.textContent = buildingsMeasured
        ? principalBuildings.length + ' persistent principal building' + (principalBuildings.length === 1 ? '' : 's') +
          ' registered in the admission registry. Their status does not increase the LIVE node count.'
        : 'NO_DATA: ' + (principalBuildingCoverage.causa || 'persistent_building_projection_not_published'); }
      if (buildingList) {
        while (buildingList.firstChild) { buildingList.removeChild(buildingList.firstChild); }
        principalBuildings.forEach(function (b) {
          var li = doc.createElement('li'), button = doc.createElement('button'); button.type = 'button';
          button.textContent = b.id + ' · ' + b.node + ' · ' + b.estado;
          button.setAttribute('aria-label', 'Principal building ' + b.id + ', owner ' + b.node + ', status ' + b.estado +
            ', parcel ' + b.q + ', ' + b.r + '. Offline status does not mean a LIVE node.');
          button.addEventListener('click', function () { selectBuilding(b); }); li.appendChild(button); buildingList.appendChild(li);
        });
        if (!principalBuildings.length) { var emptyBuilding = doc.createElement('li'); emptyBuilding.textContent = buildingsMeasured
          ? 'No verified principal buildings are currently projected.' : (buildingState ? buildingState.textContent : 'NO_DATA: building registry not checked.'); buildingList.appendChild(emptyBuilding); }
      }
      if (data && data.ok) {
        announce(nodes.length + ' independently reported LIVE node' + (nodes.length === 1 ? '' : 's') + ' from /api/world-state; ' +
          (buildingsMeasured ? principalBuildings.length + ' persistent principal building' + (principalBuildings.length === 1 ? '' : 's') +
            ' registered in the admission registry' : 'principal-building count NO_DATA') + '. Building records do not create LIVE nodes.', true, '');
      } else {
        announce('NO_DATA: ' + ((data && data.cause) || 'node_state_not_verified'), false,
          ((data && data.cause) || 'node_state_not_verified'));
      }
      updateService();
    }
    select.addEventListener('change', updateService);
    visit.addEventListener('click', function () {
      var id = select.value, n = nodes.find(function (v) { return v.id === id; });
      if (!n || typeof win.CustomEvent !== 'function') { return; }
      doc.dispatchEvent(new win.CustomEvent('online:walk-node', { detail: { id: n.id, q: n.q, r: n.r } }));
    });
    doc.addEventListener('world:nodes', function (event) {
      var d = event.detail || {}; api.last = d; /* kept for pieces that load later */
      render({ ok: d.ok === true, nodes: d.nodes, buildings: d.buildings, principalBuildings: d.principalBuildings,
        principalBuildingsCoverage: d.principalBuildingsCoverage, cause: d.cause });
    });
    doc.addEventListener('world:summary', function (event) {
      var d = event.detail || {};
      if (d.ok !== true) { render({ ok: false, nodes: [], buildings: [], principalBuildings: [], cause: d.cause || 'node_feed_failed' }); }
    });
    render({ ok: false, nodes: [], cause: 'node_feed_not_checked' });
    return { state: function () { return { nodes: nodes.slice(), selected: select.value }; } };
  }
  var api = { liveNodes: liveNodes, buildingView: function (b) { return b && buildingView(b); }, mount: mount, mounted: null, last: null };
  if (typeof module === 'object' && module.exports) { module.exports = api; }
  root.AtlasOnlineNodes = api;
  if (root.document) { api.mounted = mount(root.document, root); }
})(typeof window !== 'undefined' ? window : globalThis);
