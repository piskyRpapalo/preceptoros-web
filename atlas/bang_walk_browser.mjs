// BANG-WALK · the first adventure followed ONLY by its «!» (Sovereign 2026-11-24: «"!" intermitente para seguir el
// tutorial completo»). A newcomer presses the one control marked [data-fa-next] and nothing else; the walk records each
// step, the marked control, whether the «!» is visible on it, and the FIRST step where nothing is marked (a dead end).
// Measurement, not a gate. Waits are real time except the egg clock (AtlasVisitorEggs.clock.skip, as other tests do).
// Uso: node atlas/bang_walk_browser.mjs   ·   CAPTURA=<folder> keeps a picture per press
import { createServer } from 'node:http';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { launchChrome } from './chrome_launch.mjs';
const PUBLIC = fileURLToPath(new URL('../public/', import.meta.url));
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const types = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.wasm': 'application/wasm', '.webmanifest': 'application/manifest+json' };
const srv = createServer((req, res) => { try { let p = decodeURIComponent(new URL(req.url, 'http://l').pathname); if (p.endsWith('/')) { p += 'index.html'; }
  const f = resolve(PUBLIC, '.' + p); if (!f.startsWith(resolve(PUBLIC)) || p === '/sw.js') { res.writeHead(404); res.end(); return; }
  const body = readFileSync(f); res.writeHead(200, { 'Content-Type': types[extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-store' }); res.end(body); } catch { res.writeHead(404); res.end(); } });
await new Promise((r) => srv.listen(0, '127.0.0.1', r));
const port = 9790 + (process.pid % 40), ch = launchChrome(port); let list = null;
for (let i = 0; i < 60 && !list; i++) { await wait(250); try { list = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); } catch {} }
const ws = new WebSocket(list.find((x) => x.type === 'page').webSocketDebuggerUrl), pend = new Map(); let id = 0;
await new Promise((r) => ws.addEventListener('open', r));
ws.addEventListener('message', (m) => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); } });
const cmd = (method, params = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async (e) => { const r = await cmd('Runtime.evaluate', { expression: `(async () => JSON.stringify(await (${e})))()`, awaitPromise: true, returnByValue: true }); const v = r.result?.result?.value; return v == null ? null : JSON.parse(v); };
await cmd('Runtime.enable'); await cmd('Page.enable');
await cmd('Emulation.setDeviceMetricsOverride', { width: 360, height: 716, deviceScaleFactor: 1, mobile: true });
await cmd('Page.navigate', { url: `http://127.0.0.1:${srv.address().port}/openworld/` }); await wait(4000);
const shot = async (n) => { if (!process.env.CAPTURA) { return; } const r = await cmd('Page.captureScreenshot', { format: 'png' }); writeFileSync(join(process.env.CAPTURA, `bang-${String(n).padStart(2, '0')}.png`), Buffer.from(r.result.data, 'base64')); };
const LOOK = `(() => { const e = document.querySelector('[data-fa-next]'), b = document.getElementById('fa-bang'), fa = document.getElementById('fa');
  const bv = b && !b.hidden && getComputedStyle(b).display !== 'none' && getComputedStyle(b).visibility !== 'hidden';
  const st = (window.__s) || null;
  return { step: fa && fa.dataset.step, card: fa && !fa.hidden, line: (document.querySelector('#fa .fa-line') || {}).textContent?.slice(0, 110),
    next: e ? (e.id || e.getAttribute('aria-label') || e.className || e.tagName + ':' + e.textContent.trim()).slice(0, 40) + (e.closest('#gamepad') ? ' [pad]' : '') : null,
    bang: !!bv, covers: bv ? [...document.querySelectorAll('#gamepad button, #fa button, #top-bar button')].filter((o) => o !== e && o.getClientRects().length).filter((o) => { const a = b.getBoundingClientRect(), r = o.getBoundingClientRect(); return a.left < r.right && a.right > r.left && a.top < r.bottom && a.bottom > r.top; }).map((o) => o.id || o.getAttribute('aria-label') || o.textContent.trim().slice(0, 12)) : [], dialogs: [...document.querySelectorAll('dialog[open]')].map((d) => (d.className || d.id || d.getAttribute('aria-label') || '').slice(0, 30)), sel: (document.getElementById('surface') || {}).dataset?.sel || '', badge: !!(e && getComputedStyle(e, '::after').content.includes('!')), blinking: !!(bv && getComputedStyle(b).animationIterationCount === 'infinite') || !!(e && getComputedStyle(e, '::after').animationIterationCount === 'infinite') }; })()`;
const log = []; let dead = null;
for (let n = 0; n < +(process.env.N || 45); n++) {
  const L = await ev(LOOK); log.push(L); await shot(n);
  if (L.step === 'explore' || (!L.card && n > 3 && L.step === 'explore')) { break; }
  if (!L.next) { // nothing marked: wait like a person (eggs hatch on their clock, a fight plays out) and look again
    await ev(`(() => { const E = window.AtlasVisitorEggs; if (E && E.clock && E.clock.skip) { E.clock.skip(600000); } const p = document.getElementById('visitor-play'); p && p.dispatchEvent(new CustomEvent('visitor:tick')); return 1; })()`);
    await wait(3000); const L2 = await ev(LOOK); if (!L2.next) { dead = dead || { at: n, ...L2 }; log.push({ dead: true, ...L2 }); await wait(3000); continue; } continue;
  }
  await ev(`(() => { const e = document.querySelector('[data-fa-next]'); e && e.click(); return 1; })()`);
  await wait(L.step === 'practice' || L.step === 'conquest' ? 6000 : 1800);
}
const out = { piece: 'bang-walk', device: 'chromium:360x716', reached: log[log.length - 1].step, dead_end: dead,
  presses: log.filter((x) => x.next).length, without_visible_bang: log.filter((x) => x.next && !x.bang && !x.badge).map((x) => x.step + ':' + x.next),
  not_blinking: log.filter((x) => x.next && !x.blinking).length, covering: log.filter((x) => x.covers && x.covers.length).map((x) => x.step + ':' + x.next + '→' + x.covers.join('+')), log };
console.log(JSON.stringify(out, null, 1));
ws.close(); ch.close && ch.close(); srv.close(); process.exit(0);
