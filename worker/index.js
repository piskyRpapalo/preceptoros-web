import { worldState } from './world_state.js';
import { withSecurity } from './security_headers.js';
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
    if (url.pathname === '/app') {
      // /app/ is the canonical app URL; never redirect it to itself.
      url.pathname = '/app/';
      return Response.redirect(url.toString(), 308);
    }
    // One pinned APK release redirect: public GitHub asset, no credentials, no generic proxy.
    // The old 1.34 MB TWA remains available separately. Never serve a 156 MB APK from assets.
    if ((request.method === 'GET' || request.method === 'HEAD') &&
        url.pathname === '/get-the-app/PreceptorOS-android-0.3.0-v7.apk') {
      return withSecurity(Response.redirect(
        'https://github.com/piskyRpapalo/preceptoros-app/releases/download/android-mvp-v7-20261119/PreceptorOS-android-0.3.0-v7.apk', 302), url.pathname);
    }
    if (url.pathname === '/api/world-state') return worldState(request, env);
    return withSecurity(await env.ASSETS.fetch(request), url.pathname);
  },
};
