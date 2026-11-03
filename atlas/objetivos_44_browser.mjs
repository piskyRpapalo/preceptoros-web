// OBJETIVOS 44 · every visible interactive target on /openworld/ is at least 44 px tall and wide (house rule; WCAG 2.5.5),
// measured at the edge phone's size (360×716 CSS). Found on the real phone on 2026-11-03: «Skip to the chat» (focused)
// and «How the guide works» measured 25 px. Inline links inside running text are exempt (WCAG 2.5.5 exception).
// Sabotage: SABOTAJE=sin-arreglo serves the two old rules ⇒ red.
// Uso: node atlas/objetivos_44_browser.mjs
import { createServer } from 'node:http';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { launchChrome } from './chrome_launch.mjs';

const RAIZ = fileURLToPath(new URL('../', import.meta.url));
const PUBLIC = join(RAIZ, 'public/');
const CAPTURA = process.argv[2] || null;
const SAB = process.env.SABOTAJE || '';
const W = 360, H = 716;
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const tipos = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };
function sirve(raiz) {
  const s = createServer((req, res) => {
    try {
      let ruta = decodeURIComponent(new URL(req.url, 'http://local').pathname); if (ruta.endsWith('/')) { ruta += 'index.html'; }
      const f = resolve(raiz, '.' + ruta); if (!f.startsWith(resolve(raiz))) { res.writeHead(403); res.end(); return; }
      let cuerpo = readFileSync(f);
      if (SAB === 'sin-arreglo' && ruta === '/assets/landing.css') { cuerpo = Buffer.from(String(cuerpo).replace('z-index:10;display:inline-flex;align-items:center;min-height:44px;', '')); }
      if (SAB === 'sin-arreglo' && ruta === '/game/map_chat.js') { cuerpo = Buffer.from(String(cuerpo).replace("howSummary.style.cssText = 'min-height:44px;display:flex;align-items:center;cursor:pointer'; ", '')); }
      res.writeHead(200, { 'Content-Type': tipos[extname(f)] || 'text/plain', 'Cache-Control': 'no-store' }); res.end(cuerpo);
    } catch { res.writeHead(404); res.end(); }
  });
  return new Promise((r) => s.listen(0, '127.0.0.1', () => r(s)));
}
const fallos = [], medidas = {};
const ok = (cond, que) => { if (!cond) { fallos.push(que); } };
let ws = null, ch = null, srv = null, id = 0;
const pend = new Map();
async function main() {
  srv = await sirve(PUBLIC);
  const origen = 'http://127.0.0.1:' + srv.address().port, cdpPort = 9300 + ((process.pid + 53) % 90);
  ch = launchChrome(cdpPort);
  let lista = null;
  for (let i = 0; i < 60 && !lista && !ch.failure(); i++) { await espera(250); try { lista = await (await fetch(`http://127.0.0.1:${cdpPort}/json`)).json(); } catch {} }
  if (!lista) { throw new Error(ch.diagnostic()); }
  ws = new WebSocket(lista.find((t) => t.type === 'page').webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.addEventListener('open', r); ws.addEventListener('error', () => j(new Error('WebSocket CDP'))); });
  const cmd = (method, params = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  ws.addEventListener('message', (m) => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); } });
  const ev = async (e) => (await cmd('Runtime.evaluate', { expression: e, awaitPromise: true, returnByValue: true })).result?.result?.value ?? null;
  await cmd('Runtime.enable'); await cmd('Page.enable'); await cmd('Network.enable');
  await cmd('Network.setBlockedURLs', { urls: ['https://*'] });
  await cmd('Emulation.setFocusEmulationEnabled', { enabled: true });
  await cmd('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: true });
  await cmd('Page.navigate', { url: origen + '/openworld/' }); await espera(2500);
  // The skip link only shows on focus (the welcome card takes the first Tab, so it is focused directly).
  await ev("document.querySelector('a.skip').focus(), true"); await espera(200);
  const r = JSON.parse(await ev(`JSON.stringify((() => {
    const vis = (el) => { const r = el.getBoundingClientRect(), s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && r.right > 0 && r.left < innerWidth; };
    const enTexto = (el) => el.tagName === 'A' && getComputedStyle(el).display === 'inline' && el.parentElement && el.parentElement.textContent.trim().length > el.textContent.trim().length;
    const d = (el) => el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + ' «' + (el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 28) + '»';
    const todos = [...document.querySelectorAll('a[href],button,input:not([type=hidden]),select,textarea,summary,[role=button],[role=tab]')].filter(vis);
    const chicos = todos.filter((el) => !enTexto(el)).filter((el) => { const b = el.getBoundingClientRect(); return b.height < 44 || b.width < 44; }).map((el) => d(el) + ' ' + Math.round(el.getBoundingClientRect().width) + 'x' + Math.round(el.getBoundingClientRect().height));
    const a = document.activeElement, ar = a.getBoundingClientRect();
    return { total: todos.length, chicos, foco: d(a), focoAlto: Math.round(ar.height) }; })())`));
  medidas.objetivos = r;
  ok(/Skip to the chat/.test(r.foco) && r.focoAlto >= 44, 'the focused skip link is under 44 px: ' + r.foco + ' ' + r.focoAlto);
  ok(r.chicos.length === 0, 'targets under 44 px: ' + r.chicos.join(' | '));
  console.log(JSON.stringify({ piece: 'objetivos-44', sabotaje: SAB || null, receipt: fallos.length ? 'ROJO' : 'VERDE', medidas, fallos }));
}
main().catch((e) => { fallos.push(String(e && e.message || e)); console.log(JSON.stringify({ piece: 'objetivos-44', sabotaje: SAB || null, receipt: 'ROJO', medidas, fallos })); })
  .finally(() => { try { ws && ws.close(); } catch {} ch && ch.close && ch.close(); srv && srv.close(); process.exitCode = fallos.length ? 1 : 0; });
