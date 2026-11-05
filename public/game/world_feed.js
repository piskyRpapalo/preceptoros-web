(function (root) {
  'use strict';
  function start(options) {
    var stopped = false, timer = null, controller = null;
    async function refresh() {
      if (stopped) return;
      controller = new AbortController();
      var timeout = setTimeout(function () { controller.abort(); }, 7000);
      try {
        var response = await options.fetch('/api/world-state', {cache: 'no-store', credentials: 'omit', signal: controller.signal});
        if (!response.ok) throw new Error('world publisher unavailable');
        var data = await response.json();
        options.validate(data);
        if (!stopped) options.accept(data);
      } catch (e) {
        if (!stopped) options.unavailable('Live world unavailable. The tutorial remains available.');
      } finally {
        clearTimeout(timeout);
        if (!stopped) timer = setTimeout(refresh, 60000);
      }
    }
    refresh();
    return function () { stopped = true; clearTimeout(timer); if (controller) controller.abort(); };
  }
  root.AtlasWorldFeed = {start: start};
  if (typeof module === 'object' && module.exports) module.exports = root.AtlasWorldFeed;
})(typeof window !== 'undefined' ? window : globalThis);
