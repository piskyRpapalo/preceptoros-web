// Airplane mode (2026-11-01): after ONE online download, /openworld/ reloads with the network OFF (CDP
// Network.emulateNetworkConditions offline), the web node brain loads from this device, verifies every byte again and
// gives a verified answer that reaches the radio. Requests that leave the page while offline (not answered by the service
// worker, or made by the worker itself) must be zero. Uso: node atlas/offline_brain_browser.mjs
import { createServer } from 'node:http';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, extname, join } from 'node:path';
import { launchChrome } from './chrome_launch.mjs';
import { fileURLToPath } from 'node:url';

const PUBLIC = fileURLToPath(new URL('../public/', import.meta.url));
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
function sirve(raiz) {
  const tipos = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webmanifest': 'application/manifest+json', '.wasm': 'application/wasm' };
  const s = createServer((req, res) => {
    try {
      let ruta = decodeURIComponent(new URL(req.url, 'http://local').pathname); if (ruta.endsWith('/')) { ruta += 'index.html'; }
      const f = resolve(raiz, '.' + ruta); if (!f.startsWith(resolve(raiz))) { res.writeHead(403); res.end(); return; }
      const cuerpo = readFileSync(f); res.writeHead(200, { 'Content-Type': tipos[extname(f)] || 'text/plain', 'Cache-Control': 'no-store' }); res.end(cuerpo);
    } catch { res.writeHead(404); res.end(); }
  });
  return new Promise((r) => s.listen(0, '127.0.0.1', () => r(s)));
}
const fallos = [], externas = [], fuera = [];
const ok = (cond, que) => { if (!cond) { fallos.push(que); } };
let ws = null, ch = null, srv = null, id = 0, offline = false;
const pend = new Map(), sw = new Map(), sesiones = [];

async function main() {
  srv = await sirve(PUBLIC);
  const port = srv.address().port, origen = 'http://127.0.0.1:' + port, cdpPort = 9600 + (process.pid % 90);
  ch = launchChrome(cdpPort);
  let lista = null;
  for (let i = 0; i < 60 && !lista && !ch.failure(); i++) { await espera(250); try { lista = await (await fetch(`http://127.0.0.1:${cdpPort}/json`)).json(); } catch {} }
  if (!lista) { throw new Error(ch.diagnostic()); }
  ws = new WebSocket(lista.find((t) => t.type === 'page').webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.addEventListener('open', r); ws.addEventListener('error', () => j(new Error('WebSocket CDP'))); });
  const cmd = (method, params = {}, sessionId) => new Promise((r) => { const n = ++id; pend.set(n, r); ws.send(JSON.stringify(sessionId ? { id: n, method, params, sessionId } : { id: n, method, params })); });
  ws.addEventListener('message', (m) => {
    const d = JSON.parse(m.data);
    if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); }
    // Every worker the page starts (the service worker included) is watched too: its own fetches count as network.
    if (d.method === 'Target.attachedToTarget') { const s = d.params.sessionId; sesiones.push(s); cmd('Network.enable', {}, s); if (offline) { cmd('Network.emulateNetworkConditions', { offline: true, latency: 0, downloadThroughput: -1, uploadThroughput: -1 }, s); } cmd('Runtime.runIfWaitingForDebugger', {}, s); }
    if (d.method === 'Network.requestWillBeSent') {
      const u = d.params.request.url;
      if (/^https?:/.test(u) && new URL(u).origin !== origen) { externas.push(u); }
      if (offline && /^https?:/.test(u)) { sw.set((d.sessionId || 'page') + d.params.requestId, { u, worker: !!d.sessionId }); }
    }
    // A page request answered by the service worker never left the device; anything else did (or tried to).
    if (offline && d.method === 'Network.responseReceived') { const k = (d.sessionId || 'page') + d.params.requestId, q = sw.get(k); if (q && !q.worker && (d.params.response.fromServiceWorker || d.params.response.fromDiskCache)) { sw.delete(k); } }
    if (d.method === 'Runtime.exceptionThrown') {
      const x = d.params.exceptionDetails, f = (x.stackTrace?.callFrames || [])[0] || x;
      fallos.push('exception: ' + String(x.exception?.description || x.text).split('\n')[0].slice(0, 80) + ' @ ' + String(f.url || '').split('/').pop());
    }
  });
  const ev = async (e) => (await cmd('Runtime.evaluate', { expression: e, awaitPromise: true, returnByValue: true })).result?.result?.value ?? null;
  await cmd('Network.enable'); await cmd('Runtime.enable'); await cmd('Page.enable');
  await cmd('Target.setAutoAttach', { autoAttach: true, waitForDebuggerOnStart: false, flatten: true });
  await cmd('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  // 1 · Online, once: the page installs its service worker and the visitor downloads the brain by consent.
  await cmd('Page.navigate', { url: origen + '/openworld/' }); await espera(2000);
  const ctl = await ev(`(async () => { await navigator.serviceWorker.ready; for (let i = 0; i < 100 && !navigator.serviceWorker.controller; i++) await new Promise((r) => setTimeout(r, 100)); return !!navigator.serviceWorker.controller; })()`);
  ok(ctl === true, 'the service worker never controlled /openworld/');
  const uno = await ev(`(async () => { const note = document.getElementById('chat-note'); document.getElementById('brain-load').click();
    for (let i = 0; i < 900 && !/ready on this device/.test(note.textContent); i++) await new Promise((r) => setTimeout(r, 100)); return note.textContent; })()`);
  ok(/ready on this device/.test(uno || ''), 'the online download did not get ready: ' + uno);
  // 2 · Airplane mode: no network at all, then a reload of /openworld/.
  offline = true;
  const AVION = { offline: true, latency: 0, downloadThroughput: -1, uploadThroughput: -1 };
  await cmd('Network.emulateNetworkConditions', AVION); for (const s of sesiones) { await cmd('Network.emulateNetworkConditions', AVION, s); }
  await cmd('Page.reload', { ignoreCache: false }); await espera(2500);
  const r = JSON.parse(await ev(`(async () => { const t0 = performance.now(), note = document.getElementById('chat-note'), heard = [], said = [];
    new MutationObserver(() => said.push(note.textContent)).observe(note, { childList: true, characterData: true, subtree: true });
    document.addEventListener('brain:answer', (e) => heard.push(e.detail));
    const page = { title: (document.querySelector('h1') || {}).textContent || '', online: navigator.onLine };
    document.getElementById('brain-load').click();
    for (let i = 0; i < 900 && !/ready on this device|^NO_DATA/.test(note.textContent); i++) await new Promise((r) => setTimeout(r, 100));
    const t1 = performance.now(), ready = note.textContent;
    const q = document.getElementById('question'); q.value = 'How do I move my character?';
    document.getElementById('entry').requestSubmit();
    for (let i = 0; i < 900 && !heard.length && /ready/.test(ready); i++) await new Promise((r) => setTimeout(r, 100));
    const a = heard[0] || {}, h = a.text ? Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(a.text))), (x) => x.toString(16).padStart(2, '0')).join('') : '';
    const radio = [...document.querySelectorAll('#radio-chat-lista li')].map((li) => li.textContent);
    return JSON.stringify({ page, load_ms: Math.round(t1 - t0), reply_ms: Math.round(performance.now() - t1), ready, announced: said.some((t) => t === 'Web node brain · offline · from this device'),
      text: a.text || null, sha_ok: !!a.text && h === a.sha, verified: a.verified === true, radio: radio.some((l) => !!a.text && l.includes(a.text)), floor: document.getElementById('floor-state').textContent }); })()`));
  ok(r.page.title === 'OpenWorld' && r.page.online === false, '/openworld/ did not open in airplane mode: ' + JSON.stringify(r.page));
  ok(/ready on this device · offline/.test(r.ready), 'the brain did not load offline from this device: ' + r.ready);
  ok(r.announced, 'the offline load was not announced in #chat-note');
  ok(r.verified && r.sha_ok, 'no verified offline answer: ' + JSON.stringify(r));
  ok(r.radio, 'the offline answer did not reach the radio');
  ok(/^Map chunks: 7 of 7/.test(r.floor), 'the map floor did not load offline: ' + r.floor);
  for (const q of sw.values()) { fuera.push((q.worker ? 'worker:' : 'page:') + q.u.replace(origen, '')); }
  ok(fuera.length === 0, 'network requests while offline: ' + fuera.length + ' ' + fuera.slice(0, 30));
  ok(externas.length === 0, 'external requests: ' + externas.slice(0, 3));
  console.log(JSON.stringify({ piece: 'offline-brain', medidas: r, peticiones_sin_red: fuera.length, externas: externas.length, fallos }));
}
main().catch((e) => { fallos.push(String(e.message || e)); console.log(JSON.stringify({ fallos })); }).finally(() => { try { ws && ws.close(); } catch {} try { ch && ch.close && ch.close(); } catch {} try { srv && srv.close(); } catch {} process.exit(fallos.length ? 1 : 0); });
