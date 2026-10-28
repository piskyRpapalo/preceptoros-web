// Canonical origin: https://preceptoros.org (apex). www is an alias that only redirects.
// Decided by the Sovereign, 2026-10-25. Every other request is served by the static
// assets untouched: run_worker_first makes this script see each request before the assets do.
//
// English only until the MVP (Sovereign canon, 2026-10-25): the nine language portals were the
// same English landing nine times. They answer 301 to the one landing at the root.
const PORTAL = /^\/(?:ar|de|el|en|es|fr|it|pt|ru)(?:\/(?:index\.html)?)?$/;
// Norte 7 (decree 2026-10-28, approved in docs/norte-7-corte-propuesta.md §4): the game's old door
// has one destination now, the isometric OpenWorld. The query travels with it.
const PLAY = /^\/play(?:\/(?:index\.html)?)?$/;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.hostname === 'www.preceptoros.org') {
      url.hostname = 'preceptoros.org';
      return Response.redirect(url.toString(), 301);
    }
    if (PORTAL.test(url.pathname)) {
      return Response.redirect(url.origin + '/', 301);
    }
    if (PLAY.test(url.pathname)) {
      return Response.redirect(url.origin + '/openworld/' + url.search, 301);
    }
    return env.ASSETS.fetch(request);
  },
};
