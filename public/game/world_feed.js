(function (root) {
  'use strict';
  async function read(fetcher) {
    var controller = new AbortController();
    var timeout = setTimeout(function () { controller.abort(); }, 7000);
    try {
      var response = await fetcher('/api/world-state', {cache: 'no-store', credentials: 'omit', redirect: 'error', signal: controller.signal});
      if (!response.ok) {
        // The worker answers its own NO_DATA (503 with cobertura.causa); say that cause, not a generic one.
        var causa = 'publisher unavailable (HTTP ' + response.status + ')';
        try { var nd = JSON.parse(await response.text()); if (nd && nd.cobertura && typeof nd.cobertura.causa === 'string') causa = nd.cobertura.causa.slice(0, 80); } catch (e) {}
        throw new Error(causa);
      }
      var text = await response.text();
      if (new TextEncoder().encode(text).length > 16384) throw new Error('publisher response too large');
      var data = JSON.parse(text);
      if (!data || data.esquema !== 'preceptoros.openworld-estado/2' || !data.colonia ||
          !Array.isArray(data.colonia.nodes) || !Array.isArray(data.colonia.buildings) || !Array.isArray(data.colonia.units)) {
        throw new Error('publisher response invalid');
      }
      return data;
    } finally { clearTimeout(timeout); }
  }
  // merge(tutorial, live) → the state both terminals draw: the tutorial cabin of the baked state.json, then the live
  // nodes of the heartbeat. A live node on the cabin's id or hex is refused, never drawn over it.
  function merge(tutorial, live) {
    var cabin = tutorial && tutorial.colonia && Array.isArray(tutorial.colonia.nodes) ? tutorial.colonia.nodes.filter(function (n) { return n.id === 'cabin'; }) : [];
    if (cabin.length !== 1) throw new Error('tutorial cabin unavailable');
    var c = cabin[0], l = live.colonia;
    if (l.nodes.some(function (n) { return n.id === c.id || (n.q === c.q && n.r === c.r); })) throw new Error('node overlaps tutorial cabin');
    return {esquema: live.esquema, nodes: [], colonia: {
      nodes: [c].concat(l.nodes),
      buildings: tutorial.colonia.buildings.filter(function (b) { return b.node === c.id; }).concat(l.buildings),
      units: l.units
    }};
  }
  // follow({win, button, tutorial(), live(merged, d), fail(cause)}) → {read}. The heartbeat is read when asked, by the
  // button, and again every minute while the page is visible. Hidden or gone, the claim falls back with its cause and
  // is read again on return: a live claim is never older than a minute on screen. A stale answer never wins.
  // The heartbeat record (Proof of Tick, odd/tasks/mapa-vivo.md): one tick per read the page attempts (offline counts,
  // asking nothing of the network), the tick of the first good read and of the last. The State buoy is replayed from it.
  var record = {t: 0, nace: null, cuidado: null};
  function summary(data) {
    var coverage = data && data.cobertura, nodes = data && data.colonia && data.colonia.nodes;
    if (!coverage || coverage.estado !== 'MEDIDO' || !Array.isArray(nodes)) {
      return { ok: false, cause: coverage && typeof coverage.causa === 'string' ? coverage.causa.slice(0, 80) : 'publisher evidence unavailable' };
    }
    if (!nodes.every(function (n) { return n && typeof n.id === 'string' && typeof n.alive === 'boolean' && (n.seal === 'LIVE' || n.seal === 'STALE'); })) {
      return { ok: false, cause: 'node evidence invalid' };
    }
    return { ok: true, live: nodes.filter(function (n) { return n.alive && n.seal === 'LIVE'; }).length };
  }
  function follow(o) {
    var win = o.win, doc = win.document, gen = 0, expiry = null, ok = false;
    function tell(detail) { if (typeof win.CustomEvent === 'function' && doc.dispatchEvent) doc.dispatchEvent(new win.CustomEvent('world:summary', { detail: detail })); }
    function fail(cause) { clearTimeout(expiry); ok = false; o.fail(cause); tell({ ok: false, cause: String(cause).slice(0, 80) }); }
    // A failed read is retried too: an unattended buoy wears down in sight, it never freezes on its last good word.
    function later() { clearTimeout(expiry); expiry = setTimeout(function () { if (doc.visibilityState === 'hidden') fail('refresh required'); else now(); }, 60000); }
    async function now() {
      if (o.button) o.button.disabled = true;
      var g = ++gen;
      try {
        var t = o.tutorial();
        if (!t) throw new Error('tutorial unavailable');
        record.t++;
        // Offline, nothing is asked of the network: NO_DATA with its cause, read again when the network returns.
        if (win.navigator && win.navigator.onLine === false) throw new Error('offline');
        var d = await read(win.fetch.bind(win));
        if (g !== gen) return;
        var m = merge(t, d);
        o.live(m, d); ok = true; tell(summary(d));
        if (record.nace === null) record.nace = record.t;
        record.cuidado = record.t;
        later();
      } catch (e) { if (g === gen) { fail(e.message || 'publisher unavailable'); later(); } }
      finally { if (o.button) o.button.disabled = false; }
    }
    win.addEventListener('pagehide', function () { gen++; fail('refresh required'); });
    doc.addEventListener('visibilitychange', function () { if (doc.visibilityState === 'visible' && !ok) now(); });
    win.addEventListener('online', function () { if (!ok) now(); });
    if (o.button) o.button.addEventListener('click', now);
    return {read: now};
  }
  root.AtlasWorldFeed = {read: read, merge: merge, follow: follow, summary: summary, record: function () { return {t: record.t, nace: record.nace, cuidado: record.cuidado}; }};
  if (root.addEventListener && root.location && root.location.search.indexOf('landing=1') >= 0) {
    root.addEventListener('message', function (e) {
      if (e.origin !== root.location.origin || !e.data || e.data.type !== 'preceptoros:enter-openworld') { return; }
      if (root.AtlasTerminalPanel && root.AtlasTerminalPanel.mounted) { root.AtlasTerminalPanel.mounted.show('Welcome'); }
      var play = root.document.getElementById('welcome-play'); if (play && !play.hidden) { play.scrollIntoView({ block: 'nearest' }); play.focus({ preventScroll: true }); }
      if (root.AtlasOpenworldFollow) { root.AtlasOpenworldFollow.read(); }
    });
  }
  if (typeof module === 'object' && module.exports) module.exports = root.AtlasWorldFeed;
})(typeof window !== 'undefined' ? window : globalThis);
