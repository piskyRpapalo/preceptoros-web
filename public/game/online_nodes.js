// Read-only UI projection of the existing /api/world-state feed. No node creation, heartbeat or grants.
// A node without LIVE+alive is never offered as a destination. Conquest/visitors are separate identities.
(function (root) {
  'use strict';
  var ID = /^[a-z0-9][a-z0-9-]{0,63}$/;
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
      state = doc.getElementById('online-nodes-state'), service = doc.getElementById('online-node-service');
    if (!toggle || !panel || !otherToggle || !otherPanel || !select || !visit || !state || !service) { return null; }
    var nodes = [], buildings = [];
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
      var F = root.AtlasStateFrames;
      if (!F || !F.stateFrame) { state.dataset.acho = 'NO_DATA(frame_core_unavailable)'; return; }
      var frame = F.stateFrame({id:'world/nodes',sentence:sentence,waves:[]});
      frame.seal = !ok ? 'NO_DATA' : nodes.length ? 'LIVE' : 'STATIC';
      if (F.valida(frame).length) { state.dataset.acho = 'NO_DATA(frame_breaks_the_law)'; return; }
      state.dataset.acho = JSON.stringify(frame);
      if (typeof win.CustomEvent === 'function') {
        doc.dispatchEvent(new win.CustomEvent('acho:event', { detail: { id: 'world/nodes', frame: frame } }));
      }
    }
    function updateService() {
      var id = select.value, found = nodes.some(function (n) { return n.id === id; });
      visit.disabled = !found;
      if (!found) { service.textContent = 'NO_DATA: no verified node selected.'; return; }
      var b = buildings.find(function (x) { return x && x.node === id && typeof x.id === 'string'; });
      service.textContent = (b ? 'Recorded building ' + b.id + '. ' : '') +
        'NO_DATA: this node has no independently verified service grant for this control.';
    }
    function render(data) {
      var old = select.value;
      nodes = liveNodes(data && data.nodes);
      buildings = data && Array.isArray(data.buildings) ? data.buildings.slice(0, 64) : [];
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
      toggle.textContent = 'Nodes (' + nodes.length + ')';
      if (data && data.ok) {
        announce(nodes.length + ' independently reported LIVE node' + (nodes.length === 1 ? '' : 's') +
          ' from /api/world-state. Only LIVE nodes are selectable.', true, '');
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
      var d = event.detail || {};
      render({ ok: d.ok === true, nodes: d.nodes, buildings: d.buildings, cause: d.cause });
    });
    doc.addEventListener('world:summary', function (event) {
      var d = event.detail || {};
      if (d.ok !== true) { render({ ok: false, nodes: [], buildings: [], cause: d.cause || 'node_feed_failed' }); }
    });
    render({ ok: false, nodes: [], cause: 'node_feed_not_checked' });
    return { state: function () { return { nodes: nodes.slice(), selected: select.value }; } };
  }
  var api = { liveNodes: liveNodes, mount: mount, mounted: null };
  if (typeof module === 'object' && module.exports) { module.exports = api; }
  root.AtlasOnlineNodes = api;
  if (root.document) { api.mounted = mount(root.document, root); }
})(typeof window !== 'undefined' ? window : globalThis);
