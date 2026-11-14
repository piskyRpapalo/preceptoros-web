// A TEST authority for shared crab presence (Seam A, Mesa #34). It exists so two independent clients can be proved
// against ONE authority on this machine. It is not the production authority, listens on loopback only, keeps
// everything in memory and forgets it on close. Its law (ticks to STALE, ticks to forget, visits) is a parameter of
// the experiment, never a policy. Its tick is a counter the harness advances: no wall clock decides anything.
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { webcrypto as wc } from 'node:crypto';
const require = createRequire(import.meta.url);
const P = require('./puros/crab_presence.js'), WALK = require('../public/game/visitor_walk.js');
const enc = new TextEncoder();
const hex = (b) => Array.from(new Uint8Array(b), (v) => v.toString(16).padStart(2, '0')).join('');
const unhex = (h) => Uint8Array.from(h.match(/../g), (x) => parseInt(x, 16));
export const digest = async (t) => hex(await wc.subtle.digest('SHA-256', enc.encode(t)));
export async function verify(keyHex, text, signature) {
  try {
    const k = await wc.subtle.importKey('raw', unhex(keyHex), 'Ed25519', false, ['verify']);
    return await wc.subtle.verify('Ed25519', k, unhex(signature.slice(8)), enc.encode(text));
  } catch { return false; }
}
// A small floor for the experiment: sand within `radius` of the cabin, one water cell at 2,0.
export function floor(radius = 4) {
  const cells = { at: {} };
  for (let q = -radius; q <= radius; q++) { for (let r = -radius; r <= radius; r++) { cells.at[q + ',' + r] = [q, r, 1, q === 2 && r === 0 ? 'water' : 'floor']; } }
  return cells;
}
// realFloor() → the baked floor of the public map around the cabin, read from public/map/ with the page's own loader
// (map_chunks.js) and painter (map_painter.js): the authority then walks the very cells the visitor's page walks.
export async function realFloor() {
  const { readFileSync, existsSync } = await import('node:fs'); const { fileURLToPath } = await import('node:url');
  const C = require('../public/game/map_chunks.js'), MP = require('../public/game/map_painter.js');
  const root = fileURLToPath(new URL('../public', import.meta.url));
  const get = async (u) => { const f = root + u; if (!existsSync(f)) { return { ok: false, status: 404 }; } const b = readFileSync(f); return { ok: true, arrayBuffer: async () => b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) }; };
  const o = await C.load([0, 0], { fetch: get, base: '/map/' });
  return MP.cellsOf(o.chunks);
}
// authority({ law, cells, sabotage, tick_ms }) → with tick_ms the tick advances by itself (a physical experiment);
// without it the harness advances it (deterministic cases). `seen` keeps, on this machine's one clock, when a step was
// accepted and when its cell was first served to another visitor: that difference is the latency of the experiment.
// authority({ law, cells, sabotage }) → (sabotage 'sin-firma' stops checking signatures, to prove the cases catch it)
// { listen() → origin, close(), tick(n), state(), counts }. Bodies over 1,024 B are refused.
export function authority({ law, cells = floor(), sabotage = '', tick_ms = 0, host = '127.0.0.1', port = 0 }) {
  let state = P.empty(), tick = 0, chain = Promise.resolve(), timer = null;
  const pending = {}, seen = [];
  const deps = { verify: sabotage === 'sin-firma' ? async () => true : verify, digest, walk: WALK, cells }, counts = { open: 0, step: 0, view: 0, refused: {}, bytesIn: 0, bytesOut: 0 };
  const refuse = (c) => { counts.refused[c] = (counts.refused[c] || 0) + 1; };
  async function handle(path, body) {
    if (path === '/open') {
      counts.open++;
      const r = await P.open(state, { key: body && body.key, consent: body && body.consent, tick, start: body && body.start }, law, deps);
      if (!r.ok) { refuse(r.cause); return { ok: false, cause: r.cause }; }
      state = r.state; return { ok: true, id: state.visits[body.key].id };
    }
    if (path === '/step') {
      counts.step++;
      const r = await P.step(state, { record: body && body.record, signature: body && body.signature, tick }, law, deps);
      if (!r.ok) { refuse(r.cause); return { ok: false, cause: r.cause }; }
      state = r.state;
      if (body.record.esquema === P.SCHEMA) { const id = state.visits[body.record.clave_publica].id; pending[id] = { id, at: r.at, t: performance.now(), dir: body.record.dir }; }
      return { ok: true, at: r.at };
    }
    if (path === '/view') {
      counts.view++; state = P.forget(state, tick, law);
      const v = P.view(state, tick, law, body && Number.isSafeInteger(body.q) ? { q: body.q, r: body.r, radius: body.radius } : undefined);
      const as = body && typeof body.as === 'string' ? body.as : null;
      if (as) { v.crabs.forEach((c) => { const p = pending[c.id]; if (p && c.id !== as && c.q === p.at.q && c.r === p.at.r) { seen.push({ mover: c.id, by: as, dir: p.dir, at: p.at, ms: Math.round((performance.now() - p.t) * 10) / 10 }); delete pending[c.id]; } }); }
      return v;
    }
    return { ok: false, cause: 'route_unknown' };
  }
  const server = createServer((req, res) => {
    const origin = req.headers.origin || '*';
    const head = { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'access-control-allow-origin': origin, 'access-control-allow-headers': 'content-type' };
    if (req.method === 'OPTIONS') { res.writeHead(204, head); res.end(); return; }
    let raw = '', over = false;
    req.on('data', (c) => { raw += c; if (raw.length > 1024) { over = true; } });
    req.on('end', () => {
      counts.bytesIn += Buffer.byteLength(raw);
      // One request at a time: the reducer is the single writer of the state.
      chain = chain.then(async () => {
        let out;
        try { out = over ? { ok: false, cause: 'record_over_budget' } : await handle(new URL(req.url, 'http://x').pathname, raw ? JSON.parse(raw) : null); }
        catch (e) { out = { ok: false, cause: /law_not_signed/.test(String(e)) ? 'law_not_signed' : 'record_malformed' }; }
        if (out.ok === false && over) { refuse(out.cause); }
        const text = JSON.stringify(out); counts.bytesOut += Buffer.byteLength(text);
        res.writeHead(200, head); res.end(text);
      });
    });
  });
  return {
    listen: () => new Promise((r) => server.listen(port, host, () => { if (tick_ms) { timer = setInterval(() => { tick++; }, tick_ms); } r('http://' + host + ':' + server.address().port); })),
    close: () => new Promise((r) => { if (timer) { clearInterval(timer); } server.close(r); server.closeAllConnections && server.closeAllConnections(); }),
    seen, crabs: () => P.view(P.forget(state, tick, law), tick, law, { q: 0, r: 0, radius: 9999 }).crabs,
    tick: (n = 1) => { tick += n; return tick; }, now: () => tick, state: () => state, counts, handle,
  };
}
