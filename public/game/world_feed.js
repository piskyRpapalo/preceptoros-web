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
  // merge(tutorial, live) → the state both terminals draw: the tutorial cabin of the baked estado.json, then the live
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
  function follow(o) {
    var win = o.win, doc = win.document, gen = 0, expiry = null, ok = false;
    function fail(cause) { clearTimeout(expiry); ok = false; o.fail(cause); }
    async function now() {
      if (o.button) o.button.disabled = true;
      var g = ++gen;
      try {
        var t = o.tutorial();
        if (!t) throw new Error('tutorial unavailable');
        // Offline, nothing is asked of the network: NO_DATA with its cause, read again when the network returns.
        if (win.navigator && win.navigator.onLine === false) throw new Error('offline');
        var d = await read(win.fetch.bind(win));
        if (g !== gen) return;
        o.live(merge(t, d), d); ok = true;
        clearTimeout(expiry);
        expiry = setTimeout(function () { if (doc.visibilityState === 'hidden') fail('refresh required'); else now(); }, 60000);
      } catch (e) { if (g === gen) fail(e.message || 'publisher unavailable'); }
      finally { if (o.button) o.button.disabled = false; }
    }
    win.addEventListener('pagehide', function () { gen++; fail('refresh required'); });
    doc.addEventListener('visibilitychange', function () { if (doc.visibilityState === 'visible' && !ok) now(); });
    win.addEventListener('online', function () { if (!ok) now(); });
    if (o.button) o.button.addEventListener('click', now);
    return {read: now};
  }
  root.AtlasWorldFeed = {read: read, merge: merge, follow: follow};
  if (typeof module === 'object' && module.exports) module.exports = root.AtlasWorldFeed;
})(typeof window !== 'undefined' ? window : globalThis);
