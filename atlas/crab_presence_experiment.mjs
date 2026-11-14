// Seam A · the presence experiment (Mesa #34). An EXPERIMENT with configurable parameters, never a policy: it measures
// what a choice of law would cost, so the Sovereign can sign numbers with evidence instead of guesses.
// In one process, with the pure core and real Ed25519 signatures, on this machine:
//   capacity   how many crabs fit one view of 1,024 B (the frame budget is the hard ceiling of max_visits)
//   bytes      one signed step packet; one view at N crabs
//   cost       core time per accepted step (signature check included) and per view; signing time on the visitor's side
//   memory     heap the authority holds per open visit (approximate: V8 heap delta, run with --expose-gc for less noise)
//   freshness  with a tick of TICK_MS, how long silence takes to show STALE and to be forgotten
// Parameters (environment): VISITS="2,8,16" · STEPS=200 · STALE_AFTER=3 · GONE_AFTER=6 · TICK_MS=1000 · RADIUS=40
// Not measured here: a network, two machines, a phone. Those stay NO_DATA.
// Uso: node [--expose-gc] atlas/crab_presence_experiment.mjs
import { createRequire } from 'node:module';
import { webcrypto as wc } from 'node:crypto';
import { digest, verify, floor } from './crab_presence_authority.mjs';
const require = createRequire(import.meta.url);
const P = require('./puros/crab_presence.js'), WALK = require('../public/game/visitor_walk.js');
const enc = new TextEncoder(), hex = (b) => Array.from(new Uint8Array(b), (v) => v.toString(16).padStart(2, '0')).join('');
const num = (k, d) => { const n = Number(process.env[k]); return Number.isSafeInteger(n) && n > 0 ? n : d; };
const VISITS = (process.env.VISITS || '2,8,16').split(',').map(Number).filter((n) => Number.isSafeInteger(n) && n > 0);
const STEPS = num('STEPS', 200), TICK_MS = num('TICK_MS', 1000), RADIUS = num('RADIUS', 40);
const law = (max) => ({ stale_after: num('STALE_AFTER', 3), gone_after: num('GONE_AFTER', 6), max_visits: max });
const deps = { verify, digest, walk: WALK, cells: floor(RADIUS) };
const ms = (t) => Math.round(t * 1000) / 1000;

async function visitor() {
  const keys = await wc.subtle.generateKey('Ed25519', false, ['sign', 'verify']), key = hex(await wc.subtle.exportKey('raw', keys.publicKey));
  let seq = 0, prev = 'genesis';
  return { key, async packet(dir) {
    const record = { esquema: P.SCHEMA, dir, seq: seq + 1, prev, clave_publica: key }, text = JSON.stringify(record);
    const signature = 'ed25519:' + hex(await wc.subtle.sign('Ed25519', keys.privateKey, enc.encode(text)));
    return { record, signature, text, done: async () => { seq++; prev = await digest(text); } };
  } };
}
// Capacity by the frame budget: the worst honest row (far cells, STALE) repeated until the view no longer fits.
function capacity() {
  let n = 0;
  for (;;) {
    const crabs = []; for (let i = 0; i <= n; i++) { crabs.push({ id: 'crab-' + 'f'.repeat(8), q: -RADIUS, r: -RADIUS, seal: 'STALE' }); }
    if (enc.encode(JSON.stringify({ esquema: 'atlas.presencia/1', tick: 999999, crabs })).length >= P.LIMIT) { return n; }
    n++;
  }
}
async function run(n) {
  const L = law(n); let state = P.empty(); const vs = [];
  if (globalThis.gc) { globalThis.gc(); } const heap0 = process.memoryUsage().heapUsed;
  for (let i = 0; i < n; i++) { const v = await visitor(); state = (await P.open(state, { key: v.key, consent: true, tick: 0 }, L, deps)).state; vs.push(v); }
  if (globalThis.gc) { globalThis.gc(); } const heap1 = process.memoryUsage().heapUsed;
  let tSign = 0, tStep = 0, tView = 0, ok = 0, bytesStep = 0; const dirs = ['east', 'west'];
  for (let i = 0; i < STEPS; i++) {
    const v = vs[i % n]; let t = performance.now(); const p = await v.packet(dirs[Math.floor(i / n) % 2]); tSign += performance.now() - t;
    bytesStep = enc.encode(JSON.stringify({ record: p.record, signature: p.signature })).length;
    t = performance.now(); const r = await P.step(state, { record: p.record, signature: p.signature, tick: 1 }, L, deps); tStep += performance.now() - t;
    if (r.ok) { ok++; state = r.state; await p.done(); }
    t = performance.now(); P.view(state, 1, L); tView += performance.now() - t;
  }
  return { visits: n, steps: STEPS, accepted: ok, step_packet_bytes: bytesStep, view_bytes: enc.encode(JSON.stringify(P.view(state, 1, L))).length,
    sign_ms_per_step: ms(tSign / STEPS), authority_ms_per_step: ms(tStep / STEPS), view_ms: ms(tView / STEPS),
    heap_bytes_per_visit: Math.max(0, Math.round((heap1 - heap0) / n)), heap_note: globalThis.gc ? 'gc forced' : 'approximate: run with --expose-gc' };
}
const cap = capacity(), L = law(cap), runs = [];
for (const n of VISITS) { runs.push(n > cap ? { visits: n, refused: 'over_frame_capacity', capacity: cap } : await run(n)); }
console.log(JSON.stringify({ piece: 'crab-presence-experiment', kind: 'EXPERIMENT · parameters are not policy', machine: process.arch + ' · node ' + process.version,
  parameters: { VISITS, STEPS, STALE_AFTER: L.stale_after, GONE_AFTER: L.gone_after, TICK_MS, RADIUS },
  capacity_by_frame_budget: cap,
  freshness_if_signed: { tick_ms: TICK_MS, silence_to_stale_ms: L.stale_after * TICK_MS, silence_to_forgotten_ms: L.gone_after * TICK_MS },
  runs, no_data: ['network_latency', 'two_machines', 'phone', 'authority_runtime_memory'] }));
