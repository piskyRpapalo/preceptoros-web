// SNAP · open /openworld/ at 360×716, run one page expression, keep one picture. A tool to look, not a gate.
// Uso: node atlas/snap_browser.mjs <out.png> '<async js expression>'
import { createServer } from 'node:http';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { launchChrome } from './chrome_launch.mjs';
const PUBLIC = fileURLToPath(new URL('../public/', import.meta.url)), wait = (ms) => new Promise((r) => setTimeout(r, ms));
const types = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.wasm': 'application/wasm' };
const srv = createServer((req, res) => { try { let p = decodeURIComponent(new URL(req.url, 'http://l').pathname); if (p.endsWith('/')) { p += 'index.html'; }
  const f = resolve(PUBLIC, '.' + p); if (!f.startsWith(resolve(PUBLIC)) || p === '/sw.js') { throw 0; } const body = readFileSync(f);
  res.writeHead(200, { 'Content-Type': types[extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-store' }); res.end(body); } catch { res.writeHead(404); res.end(); } });
await new Promise((r) => srv.listen(0, '127.0.0.1', r));
const port = 9830 + (process.pid % 40), ch = launchChrome(port); let list = null;
for (let i = 0; i < 60 && !list; i++) { await wait(250); try { list = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); } catch {} }
const ws = new WebSocket(list.find((x) => x.type === 'page').webSocketDebuggerUrl), pend = new Map(); let id = 0;
await new Promise((r) => ws.addEventListener('open', r));
ws.addEventListener('message', (m) => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); } });
const cmd = (method, params = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
await cmd('Emulation.setDeviceMetricsOverride', { width: +(process.env.W || 360), height: +(process.env.H || 716), deviceScaleFactor: 2, mobile: true });
await cmd('Page.navigate', { url: `http://127.0.0.1:${srv.address().port}/openworld/` }); await wait(4000);
const r = await cmd('Runtime.evaluate', { expression: `(async () => JSON.stringify(await (${process.argv[3] || '1'})))()`, awaitPromise: true, returnByValue: true });
console.log(r.result?.result?.value || JSON.stringify(r.result?.exceptionDetails || r));
await wait(800); const s = await cmd('Page.captureScreenshot', { format: 'png' }); writeFileSync(process.argv[2], Buffer.from(s.result.data, 'base64'));
ws.close(); ch.close && ch.close(); srv.close(); process.exit(0);
