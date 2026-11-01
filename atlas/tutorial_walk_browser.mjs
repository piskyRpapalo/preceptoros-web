// G4-2 in a real browser: walking into the cabin node (a click on its hex, W-5) completes the first tutorial step; the next
// step names its place. The arrow keys choose a neighbour; with none, the page says NO_DATA.
// Uso: node atlas/tutorial_walk_browser.mjs
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { launchChrome } from './chrome_launch.mjs';
const PUBLIC = fileURLToPath(new URL('../public/', import.meta.url));
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const tipos = { '.js': 'text/javascript', '.html': 'text/html', '.json': 'application/json', '.css': 'text/css' };
const srv = createServer((req, res) => {
  try { let p = decodeURIComponent(new URL(req.url, 'http://l').pathname); if (p.endsWith('/')) { p += 'index.html'; }
    const f = resolve(PUBLIC, '.' + p); res.writeHead(200, { 'Content-Type': tipos[extname(f)] || 'text/plain' }); res.end(readFileSync(f));
  } catch { res.writeHead(404); res.end(); } });
await new Promise((r) => srv.listen(0, '127.0.0.1', r));
const port = srv.address().port, cdp = 9700 + (process.pid % 90);
const ch = launchChrome(cdp);
let lista = null;
for (let i = 0; i < 60 && !lista; i++) { await espera(250); try { lista = await (await fetch(`http://127.0.0.1:${cdp}/json`)).json(); } catch {} }
if (!lista) { console.log('NO_CDP', ch.diagnostic()); process.exit(1); }
const ws = new WebSocket(lista.find((t) => t.type === 'page').webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r));
let id = 0; const pend = new Map();
ws.addEventListener('message', (m) => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); } });
const cmd = (method, params = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async (e) => (await cmd('Runtime.evaluate', { expression: e, awaitPromise: true, returnByValue: true })).result?.result?.value ?? null;
await cmd('Runtime.enable'); await cmd('Page.enable');
await cmd('Emulation.setDeviceMetricsOverride', { width: 1000, height: 800, deviceScaleFactor: 1, mobile: false });
await cmd('Page.navigate', { url: `http://127.0.0.1:${port}/openworld/` }); await espera(2000);
const say = () => ev(`(document.querySelector('#joy .state')||{}).textContent`);
// W-5: a click on the cabin hex on the map. The hex is found with the page's own geometry (anchorOf).
const clicCabina = () => ev(`(async () => { const d = await (await fetch('/openworld/estado.json', { cache: 'no-store' })).json(); const est = AtlasOpenworldState.leer(d); const s = document.getElementById('surface'); const a = AtlasColoniaPagina.anchorOf(s, est.colonia, 0, est.looks || {}, est.seals || {}, 'cabin'); const r = s.getBoundingClientRect(); s.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: r.left + a.x * r.width / s.width, clientY: r.top + a.y * r.height / s.height })); return 'ok'; })()`);
const teclaFlecha = (key) => ev(`(() => { document.body.dispatchEvent(new KeyboardEvent('keydown', { key: ${JSON.stringify(key)}, bubbles: true, cancelable: true })); return 'ok'; })()`);
const press = (txt) => ev(`(() => { const b=[...document.querySelectorAll('#joy button')].find(x=>x.textContent===${JSON.stringify(txt)}); if(!b) return 'NO_BUTTON'; b.click(); return 'ok'; })()`);
const out = {};
out.start = await say();
await clicCabina(); await espera(300); out.enterCabin1 = await say();
out.skipButtonHeight = await ev(`(() => { const b=[...document.querySelectorAll('#joy button')].find(x=>x.textContent==='Skip tutorial'); return b ? b.getBoundingClientRect().height : 0; })()`);
await press('Skip tutorial'); await espera(200); out.afterSkip = await say();
await clicCabina(); await espera(300); out.enterCabin2 = await say();
await teclaFlecha('ArrowRight'); await espera(200); out.eastFromCabin = await say();
if (!out.enterCabin1.includes('key played') || out.skipButtonHeight < 44 || out.afterSkip !== 'tutorial: skipped' || !out.enterCabin2.includes('tutorial: complete')) {
  console.error(JSON.stringify(out)); process.exitCode = 1;
}
console.log(JSON.stringify(out, null, 1));
ch.kill ? ch.kill() : null; srv.close(); ws.close(); process.exit(0);
