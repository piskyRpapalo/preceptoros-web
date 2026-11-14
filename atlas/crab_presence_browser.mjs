// Seam A · first two-client proof (Mesa #34, 2026-11-14): client A moves → ONE authority validates → client B observes.
// Two separate Chromium processes (two profiles, nothing shared), each with its own ephemeral visit key made by the
// real public/game/visitor_account.js, and one loopback TEST authority (atlas/crab_presence_authority.mjs) running
// the pure core. The page is a harness page: no product page mounts presence, and no visitor is connected.
// Proved here: an accepted step is seen by the other client at the authority's cell; a replay, an altered step, a
// step into water and a step from a forgotten visit are refused; silence goes STALE and then disappears.
// Measured, as an experiment and never as policy: latency from A's send to B's sight, bytes per step and per view.
// Parameters: STALE_AFTER, GONE_AFTER, MAX_VISITS (ticks, ticks, visits), POLL_MS (how often B looks).
// Sabotage: SABOTAJE=sin-firma (the authority stops checking signatures) or SABOTAJE=sin-olvido (it never forgets) ⇒ red.
// Uso: node atlas/crab_presence_browser.mjs
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { resolve, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { launchChrome } from './chrome_launch.mjs';
import { authority, floor } from './crab_presence_authority.mjs';

const RAIZ = fileURLToPath(new URL('../', import.meta.url)), PUBLIC = join(RAIZ, 'public/');
const SAB = process.env.SABOTAJE || '';
const num = (k, d) => { const n = Number(process.env[k]); return Number.isSafeInteger(n) && n > 0 ? n : d; };
const LAW = { stale_after: num('STALE_AFTER', 3), gone_after: SAB === 'sin-olvido' ? 1e9 : num('GONE_AFTER', 6), max_visits: num('MAX_VISITS', 8) };
const POLL_MS = num('POLL_MS', 100);
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const fallos = [], medidas = { law_experimental: LAW, poll_ms: POLL_MS };
const ok = (c, que) => { if (!c) { fallos.push(que); } };
const tipos = { '.js': 'text/javascript', '.html': 'text/html', '.json': 'application/json' };

function pages(auth) {
  const html = `<!doctype html><meta charset="utf-8"><title>presence harness</title>
<script src="/game/visitor_account.js"></script><script src="/__client.js"></script>
<script>window.send = (path, body) => fetch(${JSON.stringify(auth)} + path, { method: 'POST', body: JSON.stringify(body) }).then((r) => r.json(), () => null);</script>`;
  const s = createServer((req, res) => {
    try {
      const ruta = decodeURIComponent(new URL(req.url, 'http://local').pathname);
      if (ruta === '/__presence.html') { res.writeHead(200, { 'Content-Type': 'text/html' }); res.end(html); return; }
      const f = ruta === '/__client.js' ? join(RAIZ, 'public/game/crab_presence_client.js') : resolve(PUBLIC, '.' + ruta);
      if (ruta !== '/__client.js' && !f.startsWith(resolve(PUBLIC))) { res.writeHead(403); res.end(); return; }
      const cuerpo = readFileSync(f); res.writeHead(200, { 'Content-Type': tipos[extname(f)] || 'text/plain', 'Cache-Control': 'no-store' }); res.end(cuerpo);
    } catch { res.writeHead(404); res.end(); }
  });
  return new Promise((r) => s.listen(0, '127.0.0.1', () => r(s)));
}
// One Chromium process with one page; ev(expr) evaluates in it and returns the JSON value.
async function client(port, url) {
  const ch = launchChrome(port); let lista = null;
  for (let i = 0; i < 60 && !lista && !ch.failure(); i++) { await espera(250); try { lista = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); } catch {} }
  if (!lista) { throw new Error(ch.diagnostic()); }
  const ws = new WebSocket(lista.find((t) => t.type === 'page').webSocketDebuggerUrl), pend = new Map(); let id = 0;
  await new Promise((r, j) => { ws.addEventListener('open', r); ws.addEventListener('error', () => j(new Error('WebSocket CDP'))); });
  ws.addEventListener('message', (m) => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); } });
  const cmd = (method, params = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async (e) => { const r = await cmd('Runtime.evaluate', { expression: `(async () => JSON.stringify(await (${e})))()`, awaitPromise: true, returnByValue: true }); const v = r.result?.result?.value; return v === undefined ? null : JSON.parse(v); };
  await cmd('Runtime.enable'); await cmd('Page.enable'); await cmd('Page.navigate', { url }); await espera(800);
  return { ev, close: () => { try { ws.close(); } catch {} ch.close && ch.close(); } };
}

let A = null, B = null, srv = null, au = null;
async function main() {
  au = authority({ law: LAW, cells: floor(), sabotage: SAB });
  const auth = await au.listen(); srv = await pages(auth);
  const url = 'http://127.0.0.1:' + srv.address().port + '/__presence.html', base = 9400 + (process.pid % 80);
  [A, B] = await Promise.all([client(base, url), client(base + 1, url)]);
  const JOIN = `(async () => { window.acct = await AtlasVisitorAccount.create(true); window.me = await AtlasCrabPresenceClient.join(window.acct, window.send, true); return { ok: window.me.ok, id: window.me.id, cause: window.me.cause, key: window.acct.info().publicKey }; })()`;
  const a = await A.ev(JOIN), b = await B.ev(JOIN);
  ok(a && a.ok && b && b.ok, 'both clients must open a visit: ' + JSON.stringify([a, b]));
  ok(a && b && a.key !== b.key && a.id !== b.id, 'two clients must be two visits with two keys');
  const refused = await B.ev(`AtlasCrabPresenceClient.join(window.acct, window.send, false)`);
  ok(refused && refused.cause === 'consent_required', 'no consent must open nothing: ' + JSON.stringify(refused));

  // A moves → the authority validates → B observes. Latency is A's send to B's sight, B looking every POLL_MS.
  const lat = [];
  // B walks too (west and back), so it stays a live visit: only a signed step keeps a visit alive, looking does not.
  let bn = 0; const bStep = async () => { const r = await B.ev(`window.me.step(${bn++ % 2 ? "'east'" : "'west'"})`); ok(r && r.ok, 'B step must be accepted: ' + JSON.stringify(r)); };
  for (const dir of ['north-west', 'east', 'south-west']) {
    au.tick(); await bStep();
    const t0 = performance.now(), sent = await A.ev(`window.me.step(${JSON.stringify(dir)})`);
    ok(sent && sent.ok, 'A step ' + dir + ' must be accepted: ' + JSON.stringify(sent));
    let seen = null;
    for (let i = 0; i < 100 && !seen; i++) {
      const v = await B.ev(`window.me.look()`);
      seen = v && v.crabs && v.crabs.find((c) => c.id === a.id && sent && sent.at && c.q === sent.at.q && c.r === sent.at.r && c.seal === 'LIVE') ? v : null;
      if (!seen) { await espera(POLL_MS); }
    }
    ok(!!seen, 'B must see A at the cell the authority accepted after ' + dir);
    if (seen) { lat.push(Math.round(performance.now() - t0)); medidas.view_bytes = Buffer.byteLength(JSON.stringify(seen)); medidas.last = { at: sent.at, crabs: seen.crabs.length }; }
  }
  medidas.latency_ms = { samples: lat, max: Math.max(...lat), note: 'loopback, one machine; not a network measurement' };
  const va = await A.ev(`window.me.look()`), vb = await B.ev(`window.me.look()`);
  ok(JSON.stringify(va) === JSON.stringify(vb), 'A and B must read the same view');
  ok(vb && !JSON.stringify(vb).includes(a.key) && !JSON.stringify(vb).includes(b.key), 'the view must carry no key');

  // Adversarial, through the real browser and the real visit key.
  const cause = async (label, expr, want) => { const r = await A.ev(expr); ok(r && r.ok === false && r.cause === want, label + ' must be refused as ' + want + ': ' + JSON.stringify(r)); return r; };
  await cause('a replay', `window.me.resend()`, 'replayed_step');
  await cause('an altered step', `window.me.forge((p) => { p.record.dir = 'west'; p.record.seq += 1; return p; })`, 'chain_broken');
  // A packet whose chain is right, so only the signature stands between it and the floor.
  const c = await B.ev(`AtlasVisitorAccount.create(true).then(async (x) => { window.c = x; return window.send('/open', { key: x.info().publicKey, consent: true }); })`);
  ok(c && c.ok, 'a third visit must open for the forged-signature case');
  const fake = await B.ev(`window.send('/step', { record: { esquema: 'atlas.paso/1', dir: 'east', seq: 1, prev: 'genesis', clave_publica: window.c.info().publicKey }, signature: 'ed25519:' + '0'.repeat(128) })`);
  ok(fake && fake.ok === false && fake.cause === 'signature_rejected', 'a step with a made-up signature must be refused: ' + JSON.stringify(fake));
  const declared = await B.ev(`window.send('/step', { record: { esquema: 'atlas.paso/1', dir: 'east', seq: 1, prev: 'genesis', clave_publica: window.c.info().publicKey, q: 9, r: 9 }, signature: 'ed25519:' + '0'.repeat(128) })`);
  ok(declared && declared.cause === 'record_scope_rejected', 'a visitor may not declare its cell: ' + JSON.stringify(declared));
  // A stands on 0,0 after north-west, east, south-west; east twice reaches water at 2,0.
  au.tick(); await bStep(); const e1 = await A.ev(`window.me.step('east')`); au.tick(); await bStep(); const wet = await A.ev(`window.me.step('east')`);
  ok(e1 && e1.ok && wet && wet.ok === false && wet.cause === 'floor_refused', 'water must be refused by the authority: ' + JSON.stringify([e1, wet]));
  const still = await B.ev(`window.me.look()`);
  ok(still && still.crabs.some((c) => c.id === a.id && c.q === 1 && c.r === 0), 'a refused step must move nothing');
  medidas.request_bytes_avg = Math.round(au.counts.bytesIn / Math.max(1, au.counts.open + au.counts.step + au.counts.view));

  // Disconnect: A falls silent. B sees STALE, then nothing; a late step of A is an unknown visit. B keeps stepping.
  const seal = async () => { const v = await B.ev(`window.me.look()`); const c = v.crabs.find((x) => x.id === a.id); return c ? c.seal : 'GONE'; };
  const track = [await seal()];
  for (let i = 0; i < LAW.stale_after; i++) { au.tick(); await bStep(); } track.push(await seal());
  for (let i = 0; i < 12 && track[track.length - 1] !== 'GONE'; i++) { au.tick(); await bStep(); if (i >= 2) { track.push(await seal()); } }
  const bSeal = (await B.ev(`window.me.look()`)).crabs.find((x) => x.id === b.id);
  ok(bSeal && bSeal.seal === 'LIVE', 'B kept stepping and must still be LIVE: ' + JSON.stringify(bSeal));
  medidas.disconnect = track;
  ok(track[0] === 'LIVE' && track.includes('STALE') && track[track.length - 1] === 'GONE', 'silence must go LIVE → STALE → gone: ' + JSON.stringify(track));
  const late = await A.ev(`window.me.step('west')`);
  ok(late && late.ok === false && late.cause === 'visit_unknown', 'a step from a forgotten visit must be unknown: ' + JSON.stringify(late));
  ok(!JSON.stringify(au.state()).includes(a.key), 'nothing of a forgotten visit may remain in the authority');
  medidas.authority = { open: au.counts.open, step: au.counts.step, view: au.counts.view, refused: au.counts.refused };
}
main().catch((e) => { fallos.push(String(e && e.message || e)); })
  .finally(async () => {
    console.log(JSON.stringify({ piece: 'crab-presence-two-clients', sabotaje: SAB || null, receipt: fallos.length ? 'ROJO' : 'VERDE', medidas, fallos }));
    A && A.close(); B && B.close(); srv && srv.close(); au && await au.close(); process.exitCode = fallos.length ? 1 : 0;
  });
