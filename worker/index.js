import { worldState } from './world_state.js';
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
// Edge chunks (2026-11-01, odd/tasks/mapa-25d-aldea.md F3): the baked world is content-addressed, so the edge may keep it
// forever. The edge only labels headers: no state, no KV/D1/DO, no cookies, no logging. Docs (read 2026-11-01): with
// run_worker_first the _headers file is NOT applied, so the cache policy lives here.
const CHUNK = /^\/map\/chunks\/-?\d+_-?\d+\.([0-9a-f]{8})\.json$/;
const IMMUTABLE = /^\/(?:models\/web-node\/[^/]+\.part[^/]*|art\/[a-z0-9-]+\.json)$/;
export const CACHE_IMMUTABLE = 'public, max-age=31536000, immutable';
export const CACHE_INDEX = 'public, max-age=300, must-revalidate';

async function cached(request, env, policy, tag) {
  if (tag && request.headers.get('if-none-match') === tag) {
    return new Response(null, { status: 304, headers: { 'Cache-Control': policy, ETag: tag } });
  }
  const r = await env.ASSETS.fetch(request);
  if (!r.ok) return r;
  const out = new Response(r.body, r);
  out.headers.set('Cache-Control', policy);
  if (tag) out.headers.set('ETag', tag);
  return out;
}

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
    if (url.pathname === '/api/world-state') return worldState(request, env);
    const m = CHUNK.exec(url.pathname);
    if (m) return cached(request, env, CACHE_IMMUTABLE, '"' + m[1] + '"');
    if (IMMUTABLE.test(url.pathname)) return cached(request, env, CACHE_IMMUTABLE, null);
    if (url.pathname === '/map/carta.json') return cached(request, env, CACHE_INDEX, null);
    return env.ASSETS.fetch(request);
  },
};
