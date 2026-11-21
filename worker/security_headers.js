// R-17 · the declared content policy. Measured on 2026-11-08 against every page of public/ (bin/csp_walk.mjs):
// no inline script, no eval; the web node brain imports its own verified bytes as blob: and compiles WebAssembly;
// rack ideas reads two public files from raw.githubusercontent.com; send.js talks to api.preceptoros.org.
// 'unsafe-inline' for styles is declared, not hidden: pages and pieces set style attributes. Each source has its cause.
export const POLICY = [
  "default-src 'self'",
  "script-src 'self' blob: 'wasm-unsafe-eval'",          // brain: import(blob of verified wllama.js) + wasm compile
  "worker-src 'self' blob:",                              // service worker + wllama's blob worker
  "style-src 'self' 'unsafe-inline'",                     // style attributes in pages and pieces
  "img-src 'self' data: blob:",
  "media-src 'self' data: blob:",                         // Acho sonification
  "font-src 'self'",
  "connect-src 'self' blob: https://api.preceptoros.org https://raw.githubusercontent.com",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  // the landing frames /openworld/ (index.html:31); the PreceptorOS app frames it from its own loopback origins
  // (odd/tasks/app-frames-openworld.md, FIRMO of the Sovereign in chat 2026-11-08) and, PROPOSED pending FIRMO, from the
  // signed Android APK's bundled-asset origin https://preceptoros.mvp.local (WebViewAssetLoader; not a DNS host, no public
  // TLS certificate can exist for it). Measured 2026-11-21: without it the APK frame fails net::ERR_BLOCKED_BY_RESPONSE.
  // Never a wildcard.
  "frame-ancestors 'self' http://127.0.0.1:8742 http://localhost:8742 https://preceptoros.mvp.local",
].join('; ');

// This exact script comes from APP #345 public-mini package, whose index.html
// is independently sha256-verified by WEB's importer and source gates.
// Only /app/ may execute it. No unsafe-inline and no permission for OpenWorld.
export const MINI_INLINE_SCRIPT_HASH = "'sha256-xEKa+5N6sNmuMqEzA0jbhI0YhqO7PSA6qXrM3LCwtL8='";
export function policyForPath(pathname = '') {
  if (pathname !== '/app/' && pathname !== '/app/index.html') return POLICY;
  return POLICY.replace("script-src 'self' blob: 'wasm-unsafe-eval'",
    "script-src 'self' blob: 'wasm-unsafe-eval' " + MINI_INLINE_SCRIPT_HASH);
}

// withSecurity(response,pathname) → the same response with the route-scoped policy, for HTML only.

export function withSecurity(res, pathname = '') {
  const type = res.headers.get('content-type') || '';
  if (!type.startsWith('text/html')) return res;
  const out = new Response(res.body, res);
  out.headers.set('Content-Security-Policy', policyForPath(pathname));
  out.headers.set('X-Content-Type-Options', 'nosniff');
  out.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  return out;
}
