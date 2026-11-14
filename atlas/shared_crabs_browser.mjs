// Shared crabs on the real page: two clients on /openworld/, one TEST authority with the real baked floor (Mesa #34).
// The two clients are two separate Chromium processes on this machine, or — with PHONES="serialA,serialB" — the
// Chrome of two physical phones reached over adb (the page and the authority travel to them by `adb reverse`; this
// harness drives and reads their tabs through the phone's own DevTools socket). Identities are ephemeral visit keys
// made in each browser. Nobody else is connected and nothing is published.
// Proved: A walks → the authority accepts → B's page holds A at the authority's cell AND draws it; B answers and A
// sees it; a still crab stays LIVE by its signed beat; a closed page goes silent → STALE → gone, said in words.
// One event, four readings on the observer: the live line, the same sentence in the «acho:event» frame, the crab
// drawn on the map, and the notes handed to Web Audio (a sound a person heard is NO_DATA here).
// Parameters (experiment, not policy): TICK_MS, STALE_AFTER, GONE_AFTER, MAX_VISITS, POLL_MS, BEAT_MS.
// Sabotage: SABOTAJE=sin-latido (the page never signs «still here») ⇒ red; SABOTAJE=bajo-niebla (the crab layer draws
// before the map's own layers, so the fog covers it) ⇒ red. CAPTURA=<folder> keeps a picture of each client.
// Uso: node atlas/shared_crabs_browser.mjs      |      PHONES="<serialA>,<serialB>" node atlas/shared_crabs_browser.mjs
import { createServer } from 'node:http';
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { launchChrome } from './chrome_launch.mjs';
import { authority, realFloor } from './crab_presence_authority.mjs';

const PUBLIC = fileURLToPath(new URL('../public/', import.meta.url));
const SAB = process.env.SABOTAJE || '', PHONES = (process.env.PHONES || '').split(',').filter(Boolean);
const num = (k, d) => { const n = Number(process.env[k]); return Number.isSafeInteger(n) && n > 0 ? n : d; };
const TICK_MS = num('TICK_MS', 500), POLL_MS = num('POLL_MS', 300), BEAT_MS = num('BEAT_MS', 1000);
const LAW = { stale_after: num('STALE_AFTER', 6), gone_after: num('GONE_AFTER', 12), max_visits: num('MAX_VISITS', 8), beat_gap: 1 };
const WEB_PORT = num('WEB_PORT', PHONES.length ? 8811 : 0), AUTH_PORT = num('AUTH_PORT', PHONES.length ? 8812 : 0);
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const fallos = [], medidas = { clients: PHONES.length ? 'two physical phones over adb' : 'two Chromium processes on this machine',
  experiment: { tick_ms: TICK_MS, poll_ms: POLL_MS, beat_ms: BEAT_MS, law: LAW } };
const ok = (c, que) => { if (!c) { fallos.push(que); } return !!c; };
const tipos = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webmanifest': 'application/manifest+json', '.wasm': 'application/wasm' };
const adb = (serial, ...a) => execFileSync('adb', ['-s', serial, ...a], { encoding: 'utf8' }).trim();

function site() {
  const s = createServer((req, res) => {
    try {
      let ruta = decodeURIComponent(new URL(req.url, 'http://local').pathname); if (ruta.endsWith('/')) { ruta += 'index.html'; }
      const f = resolve(PUBLIC, '.' + ruta); if (!f.startsWith(resolve(PUBLIC))) { res.writeHead(403); res.end(); return; }
      let cuerpo = readFileSync(f);
      if (ruta === '/game/shared_crabs.js' && SAB === 'sin-latido') { cuerpo = Buffer.from(String(cuerpo).replace('me.beat().then(', 'Promise.resolve({ ok: true }).then(')); }
      if (ruta === '/game/shared_crabs.js' && SAB === 'bajo-niebla') { cuerpo = Buffer.from(String(cuerpo).replace("if (doc.readyState === 'complete') { layer(); } else { win.addEventListener('load', layer); }", 'layer();')); }
      if (ruta === '/sw.js') { res.writeHead(404); res.end(); return; } // no service worker in the experiment: nothing is cached on the phones
      res.writeHead(200, { 'Content-Type': tipos[extname(f)] || 'text/plain', 'Cache-Control': 'no-store' }); res.end(cuerpo);
    } catch { res.writeHead(404); res.end(); }
  });
  return new Promise((r) => s.listen(WEB_PORT, '127.0.0.1', () => r(s)));
}
// attach(wsUrl) → { ev, cmd, close }: one tab, evaluated through CDP.
async function attach(wsUrl) {
  const ws = new WebSocket(wsUrl), pend = new Map(); let id = 0;
  await new Promise((r, j) => { ws.addEventListener('open', r); ws.addEventListener('error', () => j(new Error('WebSocket CDP'))); });
  ws.addEventListener('message', (m) => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); } });
  const cmd = (method, params = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async (e) => { const r = await cmd('Runtime.evaluate', { expression: `(async () => JSON.stringify(await (${e})))()`, awaitPromise: true, returnByValue: true }); const v = r.result?.result?.value; return v === undefined || v === null ? null : JSON.parse(v); };
  await cmd('Runtime.enable'); await cmd('Page.enable');
  return { ev, cmd, close: () => { try { ws.close(); } catch {} } };
}
async function local(port, url) {
  const ch = launchChrome(port); let lista = null;
  for (let i = 0; i < 60 && !lista && !ch.failure(); i++) { await espera(250); try { lista = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); } catch {} }
  if (!lista) { throw new Error(ch.diagnostic()); }
  const t = await attach(lista.find((x) => x.type === 'page').webSocketDebuggerUrl);
  await t.cmd('Page.navigate', { url });
  return { ...t, name: 'chromium:' + port, end: () => { t.close(); ch.close && ch.close(); } };
}
// A phone: the page and the authority reach it by adb reverse; its Chrome DevTools socket comes here by adb forward.
async function phone(serial, cdp, url, ports) {
  ports.forEach((p) => adb(serial, 'reverse', 'tcp:' + p, 'tcp:' + p));
  adb(serial, 'forward', 'tcp:' + cdp, 'localabstract:chrome_devtools_remote');
  // Android's Chrome does not open tabs through DevTools: the tab is opened as a person would, then found by its address.
  adb(serial, 'shell', 'am', 'start', '--user', '0', '-n', 'com.android.chrome/com.google.android.apps.chrome.Main', '-a', 'android.intent.action.VIEW', '-d', "'" + url + "'");
  let made = null;
  for (let i = 0; i < 40 && !made; i++) { await espera(500); try { made = (await (await fetch(`http://127.0.0.1:${cdp}/json`)).json()).find((x) => x.type === 'page' && x.url.startsWith(url.split('?')[0])); } catch {} }
  if (!made) { throw new Error('NO_DATA: the tab did not open on ' + serial); }
  const t = await attach(made.webSocketDebuggerUrl);
  const model = adb(serial, 'shell', 'getprop', 'ro.product.model');
  return { ...t, name: model, end: async () => { try { await fetch(`http://127.0.0.1:${cdp}/json/close/${made.id}`); } catch {} t.close(); try { adb(serial, 'forward', '--remove', 'tcp:' + cdp); ports.forEach((p) => adb(serial, 'reverse', '--remove', 'tcp:' + p)); } catch {} } };
}
const until = async (t, expr, ms = 15000, every = 150) => { const t0 = Date.now(); let v = null; while (Date.now() - t0 < ms) { v = await t.ev(expr); if (v) { return v; } await espera(every); } return v; };

let A = null, B = null, srv = null, au = null;
async function main() {
  au = authority({ law: LAW, cells: await realFloor(), sabotage: SAB, tick_ms: TICK_MS, port: AUTH_PORT });
  const auth = await au.listen(), authPort = Number(new URL(auth).port); srv = await site();
  const webPort = srv.address().port, url = `http://127.0.0.1:${webPort}/openworld/?colony=alone&presence=${authPort}&poll=${POLL_MS}&beat=${BEAT_MS}`;
  medidas.url = url;
  if (PHONES.length === 2) { A = await phone(PHONES[0], 9601, url, [webPort, authPort]); B = await phone(PHONES[1], 9602, url, [webPort, authPort]); }
  else { const base = 9500 + (process.pid % 80); [A, B] = await Promise.all([local(base, url), local(base + 1, url)]); }
  medidas.devices = [A.name, B.name];

  // Each client enters as its own ephemeral crab, then consents to share it.
  const SPY = `(() => { window.__acho = []; document.addEventListener('acho:event', (e) => window.__acho.push({ id: e.detail.id, r: e.detail.frame.atoms[0].r, sound: e.detail.frame.sound, news: e.detail.news }));
    window.__osc = 0; const P = window.AudioContext || window.webkitAudioContext; if (P && !P.prototype.__spied) { const make = P.prototype.createOscillator; P.prototype.createOscillator = function () { window.__osc++; return make.call(this); }; P.prototype.__spied = true; } return true; })()`;
  const enter = async (t) => {
    // An older experiment may have left a service worker on this loopback origin, serving an old page. It is removed
    // for this origin only (never the public site's), and the page is loaded again from this checkout.
    await until(t, `document.readyState === 'complete'`, 30000);
    if (await t.ev(`!!(navigator.serviceWorker && navigator.serviceWorker.controller)`)) {
      medidas.stale_worker_removed = (medidas.stale_worker_removed || []).concat(t.name);
      await t.ev(`(async () => { const rs = await navigator.serviceWorker.getRegistrations(); await Promise.all(rs.map((r) => r.unregister())); const ks = await caches.keys(); await Promise.all(ks.map((k) => caches.delete(k))); return true; })()`);
      await t.cmd('Page.reload', { ignoreCache: true }); await espera(1500); await until(t, `document.readyState === 'complete'`, 30000);
    }
    if (!ok(await until(t, `!!(window.AtlasSharedCrabs && window.AtlasSharedCrabs.mounted && document.getElementById('play-now'))`, 30000), t.name + ': the page did not mount shared crabs')) {
      fallos.push(t.name + ' diagnosis: ' + JSON.stringify(await t.ev(`({ href: location.href, ready: document.readyState, piece: !!window.AtlasSharedCrabs, mounted: !!(window.AtlasSharedCrabs && window.AtlasSharedCrabs.mounted), box: !!document.getElementById('visitor-play'), surface: !!document.getElementById('surface'), play: !!document.getElementById('play-now'), sw: !!(navigator.serviceWorker && navigator.serviceWorker.controller), scripts: document.scripts.length })`)));
      throw new Error('NO_DATA: ' + t.name + ' cannot run the experiment');
    }
    await t.ev(SPY);
    await t.ev(`(document.getElementById('play-now').click(), true)`);
    ok(await until(t, `(() => { const b = document.getElementById('shared-crabs-join'); return !!b && !b.hidden; })()`, 20000), t.name + ': no share button after starting a visit');
    const before = await t.ev(`AtlasSharedCrabs.mounted.state().id`);
    ok(before === null, t.name + ': nothing may be shared before the consent press');
    await t.ev(`(document.getElementById('shared-crabs-join').click(), true)`);
    const id = await until(t, `AtlasSharedCrabs.mounted.state().id`, 20000);
    ok(/^crab-[0-9a-f]{8}$/.test(id || ''), t.name + ': the authority did not open the visit: ' + JSON.stringify(await t.ev(`document.getElementById('shared-crabs-line').textContent`)));
    return id;
  };
  const a = await enter(A), b = await enter(B);
  ok(a && b && a !== b, 'two devices must be two different crabs: ' + JSON.stringify([a, b]));
  medidas.crabs = { [A.name]: a, [B.name]: b };

  // mover walks one hex; watcher must hold it at the authority's cell and draw it. Latency is read on the authority's clock.
  const walk = async (mover, watcher, id, dir) => {
    const n0 = au.seen.length;
    const moved = await mover.ev(`(() => { const C = AtlasOpenworldView().controls, w0 = C.walker(), from = [w0.q, w0.r]; C.step(${JSON.stringify(dir)}); const w = C.walker(); return { from, to: [w.q, w.r] }; })()`);
    if (!ok(moved && (moved.from[0] !== moved.to[0] || moved.from[1] !== moved.to[1]), mover.name + ' did not walk ' + dir + ': ' + JSON.stringify(moved))) { return null; }
    const seen = await until(watcher, `(() => { const s = AtlasSharedCrabs.mounted.state(), c = s.view && s.view.crabs.find((x) => x.id === ${JSON.stringify(id)}); const d = JSON.parse(document.getElementById('surface').dataset.crabs || '[]').find((x) => x.id === ${JSON.stringify(id)});
      if (!(c && c.q === ${moved.to[0]} && c.r === ${moved.to[1]} && d && d.q === c.q && d.r === c.r)) { return null; }
      // Not only «the piece says it drew it»: the pixel of its label on the canvas must be the paper of the label, or
      // something else (the fog) was painted over the crab.
      const cv = document.getElementById('surface'), H = AtlasMapPainter.view().H, paper = H.rgbOf(H.T.NEUTRAL.paper);
      const inside = d.tag[0] >= 0 && d.tag[1] >= 0 && d.tag[0] < cv.width && d.tag[1] < cv.height;
      const px = inside ? Array.from(cv.getContext('2d').getImageData(d.tag[0], d.tag[1], 1, 1).data).slice(0, 3) : null;
      const visible = !inside ? 'off_canvas' : px.every((v, i) => Math.abs(v - paper[i]) <= 6);
      return { held: c, drawn: d, px, paper, visible }; })()`, 12000, 60);
    ok(seen && seen.visible !== false, watcher.name + ': the other crab is drawn but not visible (painted over): ' + JSON.stringify(seen && [seen.px, seen.paper]));
    ok(seen, watcher.name + ' does not see ' + mover.name + ' at ' + moved.to.join(',') + ' after ' + dir);
    const lat = au.seen.slice(n0).find((s) => s.mover === id);
    return seen ? { dir, to: moved.to, authority_to_other_ms: lat ? lat.ms : null, drawn_at: [seen.drawn.x, seen.drawn.y], visible: seen.visible, seal: seen.held.seal } : null;
  };
  const steps = [];
  for (const d of ['north-west', 'north-west', 'north-east']) { steps.push({ who: A.name, ...(await walk(A, B, a, d)) }); await espera(400); }
  for (const d of ['south-east', 'east']) { steps.push({ who: B.name, ...(await walk(B, A, b, d)) }); await espera(400); }
  medidas.steps = steps;
  const lats = steps.map((s) => s.authority_to_other_ms).filter((x) => typeof x === 'number');
  medidas.latency_ms = { samples: lats, max: lats.length ? Math.max(...lats) : null, what: 'step accepted by the authority → its cell first served to the other client (bounded by poll_ms); loopback or adb reverse over USB, not the internet' };
  ok(lats.length === steps.length, 'every accepted step must be served to the other client');

  if (process.env.CAPTURA) { for (const t of [A, B]) { const g = await t.cmd('Page.captureScreenshot', { format: 'png' }); if (g.result && g.result.data) { writeFileSync(join(process.env.CAPTURA, 'shared-crabs-' + t.name.replace(/\W+/g, '') + '.png'), Buffer.from(g.result.data, 'base64')); } } }
  // One event, four readings, on the observer B.
  const four = await B.ev(`(() => { const line = document.getElementById('shared-crabs-line').textContent, e = window.__acho[window.__acho.length - 1] || null;
    return { line, frame_says: e && e.r, frame_id: e && e.id, sound: e && e.sound, notes: window.__osc, news: window.__acho.flatMap((x) => x.news || []), drawn: JSON.parse(document.getElementById('surface').dataset.crabs || '[]').length, live: document.getElementById('shared-crabs-line').getAttribute('aria-live') }; })()`);
  medidas.four_readings = four;
  ok(four && four.line && four.frame_says === four.line, 'B: the frame must carry the very sentence of the live line');
  ok(four && four.live === 'polite' && four.drawn === 1, 'B: the line must be a live region and one other crab must be drawn');
  ok(four && four.sound === 'ok' && four.notes > 0, 'B: the event must hand notes to Web Audio: ' + JSON.stringify(four && [four.sound, four.notes]));
  ok(four && four.news.some((n) => / (nearer|farther|arrived)$/.test(n)), 'B: a move must be said as nearer, farther or arrived: ' + JSON.stringify(four && four.news));
  ok(four && /^presence\/crab-/.test(four.frame_id || ''), 'B: the event must be named after the observer\'s visit');

  // Standing still: nobody walks for longer than the law forgets. The signed beat keeps both LIVE.
  await espera((LAW.gone_after + 3) * TICK_MS);
  const still = au.crabs().map((c) => c.seal);
  medidas.still = { waited_ms: (LAW.gone_after + 3) * TICK_MS, seals: still };
  ok(still.length === 2 && still.every((s) => s === 'LIVE'), 'two still crabs must stay LIVE by their signed beats: ' + JSON.stringify(still));

  // Disconnect: A's page goes away. B must read silent, then gone, in words.
  const t0 = Date.now(); await A.cmd('Page.navigate', { url: 'about:blank' });
  const sil = await until(B, `(() => { const n = window.__acho.flatMap((x) => x.news || []); return n.includes(${JSON.stringify(a + ' silent')}) ? true : null; })()`, (LAW.stale_after + 6) * TICK_MS + 4000, 100);
  const tStale = Date.now() - t0;
  const gone = await until(B, `(() => { const n = window.__acho.flatMap((x) => x.news || []); return n.includes(${JSON.stringify(a + ' gone')}) ? document.getElementById('shared-crabs-line').textContent : null; })()`, (LAW.gone_after + 6) * TICK_MS + 4000, 100);
  medidas.disconnect = { stale_said_after_ms: sil ? tStale : null, gone_said_after_ms: gone ? Date.now() - t0 : null, line: gone, expected_ms: { stale: LAW.stale_after * TICK_MS, gone: LAW.gone_after * TICK_MS } };
  ok(sil, 'B must be told that A fell silent'); ok(gone, 'B must be told that A is gone');
  ok(gone && JSON.parse(await B.ev(`JSON.stringify(document.getElementById('surface').dataset.crabs || '[]')`)) === '[]', 'a crab that is gone must not stay drawn');
  ok(au.crabs().length === 1, 'the authority must hold only B now: ' + au.crabs().length);
  medidas.authority = { open: au.counts.open, step: au.counts.step, view: au.counts.view, refused: au.counts.refused };
}
main().catch((e) => { fallos.push(String(e && e.stack || e).split('\n').slice(0, 2).join(' | ')); })
  .finally(async () => {
    console.log(JSON.stringify({ piece: 'shared-crabs-on-the-page', sabotaje: SAB || null, receipt: fallos.length ? 'ROJO' : 'VERDE', medidas, fallos }));
    try { A && await A.end(); B && await B.end(); } catch {} srv && srv.close(); au && await au.close(); process.exitCode = fallos.length ? 1 : 0; setTimeout(() => process.exit(), 500).unref();
  });
