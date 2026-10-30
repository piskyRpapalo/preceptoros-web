(function (root) {
  'use strict';
  async function read(fetcher) {
    var controller = new AbortController();
    var timeout = setTimeout(function () { controller.abort(); }, 7000);
    try {
      var response = await fetcher('/api/world-state', {cache: 'no-store', credentials: 'omit', redirect: 'error', signal: controller.signal});
      if (!response.ok) throw new Error('publisher unavailable');
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
  root.AtlasWorldFeed = {read: read};
  if (typeof module === 'object' && module.exports) module.exports = root.AtlasWorldFeed;
})(typeof window !== 'undefined' ? window : globalThis);
