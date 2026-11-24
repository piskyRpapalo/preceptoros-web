// Ed25519 (RFC 8032) for browsers whose WebCrypto does not know it yet (2026-11-24: Android System WebView 113 inside
// the APP — «Algorithm: Unrecognized name» — so Play failed and the APP's crab could not join the other crabs on the map).
// Same algorithm, same bytes: a 32-byte public key and a 64-byte signature that any Ed25519 verifier accepts (the
// presence authority included). Loaded ONLY when crypto.subtle rejects Ed25519 (visitor_account.js); SHA-512 still
// comes from WebCrypto. The seed lives in this closure, in memory, and ends with the visit, like the native key.
// Checked against RFC 8032 §7.1 vectors and node:crypto in atlas/puros/ed25519_lite_law.mjs.
(function (root) {
  'use strict';
  var P = 2n ** 255n - 19n, N = 2n ** 252n + 27742317777372353535851937790883648493n;
  function mod(a, m) { var r = a % (m || P); return r >= 0n ? r : r + (m || P); }
  function pow(b, e) { var r = 1n; b = mod(b); while (e > 0n) { if (e & 1n) { r = mod(r * b); } b = mod(b * b); e >>= 1n; } return r; }
  function inv(a) { return pow(a, P - 2n); }
  var D = mod(-121665n * inv(121666n)), I = pow(2n, (P - 1n) / 4n);
  var G = [15112221349535400772501151409588531511454012693041857206046113283949847762202n, 46316835694926478169428394003475163141307993866256225615783033603165251855960n, 1n];
  G.push(mod(G[0] * G[1]));
  // Extended coordinates (X, Y, Z, T), a = -1 (RFC 8032 §5.1.4).
  function add(p, q) {
    var a = mod((p[1] - p[0]) * (q[1] - q[0])), b = mod((p[1] + p[0]) * (q[1] + q[0])), c = mod(2n * D * p[3] * q[3]), d = mod(2n * p[2] * q[2]);
    var e = b - a, f = d - c, g = d + c, h = b + a;
    return [mod(e * f), mod(g * h), mod(f * g), mod(e * h)];
  }
  function mul(p, k) { var r = [0n, 1n, 1n, 0n]; while (k > 0n) { if (k & 1n) { r = add(r, p); } p = add(p, p); k >>= 1n; } return r; }
  function le(bytes) { var n = 0n; for (var i = bytes.length - 1; i >= 0; i--) { n = (n << 8n) | BigInt(bytes[i]); } return n; }
  function bytes32(n) { var out = new Uint8Array(32); for (var i = 0; i < 32; i++) { out[i] = Number(n & 255n); n >>= 8n; } return out; }
  function encode(p) { var z = inv(p[2]), x = mod(p[0] * z), y = mod(p[1] * z), out = bytes32(y); out[31] |= Number(x & 1n) << 7; return out; }
  function decode(b) {
    var y = le(b) & ((1n << 255n) - 1n), sign = b[31] >> 7; if (y >= P) { return null; }
    var u = mod(y * y - 1n), v = mod(D * y * y + 1n), x = mod(u * pow(v, 3n) * pow(u * pow(v, 7n), (P - 5n) / 8n));
    if (mod(v * x * x) !== u) { x = mod(x * I); } if (mod(v * x * x) !== u) { return null; }
    if (Number(x & 1n) !== sign) { x = mod(-x); } if (x === 0n && sign) { return null; }
    return [x, y, 1n, mod(x * y)];
  }
  function cat() { var n = 0, i, a = arguments; for (i = 0; i < a.length; i++) { n += a[i].length; } var out = new Uint8Array(n), o = 0; for (i = 0; i < a.length; i++) { out.set(a[i], o); o += a[i].length; } return out; }
  async function sha512(subtle, data) { return new Uint8Array(await subtle.digest('SHA-512', data)); }
  // keypair(subtle, seed?) → { publicKey: Uint8Array(32), sign(msg) → Uint8Array(64) }. seed: 32 bytes (random if absent).
  async function keypair(subtle, seed) {
    seed = seed || root.crypto.getRandomValues(new Uint8Array(32));
    var h = await sha512(subtle, seed), a = h.slice(0, 32); a[0] &= 248; a[31] &= 127; a[31] |= 64;
    var s = le(a), prefix = h.slice(32), A = encode(mul(G, s));
    return Object.freeze({ publicKey: A, sign: async function (msg) {
      var r = mod(le(await sha512(subtle, cat(prefix, msg))), N), R = encode(mul(G, r));
      var k = mod(le(await sha512(subtle, cat(R, A, msg))), N);
      return cat(R, bytes32(mod(r + k * s, N)));
    } });
  }
  // verify(subtle, publicKey, signature, msg) → boolean (cofactorless, as RFC 8032 §5.1.7 with [S]B = R + [k]A).
  async function verify(subtle, pub, sig, msg) {
    if (!(pub && pub.length === 32 && sig && sig.length === 64)) { return false; }
    var A = decode(pub), R = decode(sig.slice(0, 32)), S = le(sig.slice(32)); if (!A || !R || S >= N) { return false; }
    var k = mod(le(await sha512(subtle, cat(sig.slice(0, 32), pub, msg))), N);
    var a = encode(mul(G, S)), b = encode(add(R, mul(A, k)));
    return a.every(function (v, i) { return v === b[i]; });
  }
  var api = Object.freeze({ keypair: keypair, verify: verify });
  if (typeof module === 'object' && module.exports) { module.exports = api; }
  root.AtlasEd25519 = api;
})(typeof globalThis === 'object' ? globalThis : this);
