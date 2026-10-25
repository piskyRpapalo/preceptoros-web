// Canonical origin: https://preceptoros.org (apex). www is an alias that only redirects.
// Decided by the Sovereign, 2026-10-25. Every other request is served by the static
// assets untouched: run_worker_first makes this script see each request before the assets do.
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.hostname === 'www.preceptoros.org') {
      url.hostname = 'preceptoros.org';
      return Response.redirect(url.toString(), 301);
    }
    return env.ASSETS.fetch(request);
  },
};
