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
  "frame-ancestors 'self'",                              // the landing frames /openworld/ (index.html:31)
].join('; ');

// withSecurity(response) → the same response with the policy, only for HTML documents (other files keep theirs).
export function withSecurity(res) {
  const type = res.headers.get('content-type') || '';
  if (!type.startsWith('text/html')) return res;
  const out = new Response(res.body, res);
  out.headers.set('Content-Security-Policy', POLICY);
  out.headers.set('X-Content-Type-Options', 'nosniff');
  out.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  return out;
}
