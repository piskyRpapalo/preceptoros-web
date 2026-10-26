// P3 [1d] in a real browser: the landing's three doors are drawn in the house bubble language, with
// the same three links, the same footer, the titles still readable by screen readers, no exception
// and no external request. Uso: node atlas/landing_doors_browser.mjs [carpeta-captura]
import { createServer } from 'node:http';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, extname, join } from 'node:path';
import { launchChrome } from './chrome_launch.mjs';
import { fileURLToPath } from 'node:url';

const PUBLIC = fileURLToPath(new URL('../public/', import.meta.url));
const CAPTURA = process.argv[2] || null;
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
// Static server on port 0: a fixed range collides with services on the node (measured 2026-10-26).
function sirve(raiz) {
  const tipos = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };
  const s = createServer((req, res) => {
    try {
      let ruta = decodeURIComponent(new URL(req.url, 'http://local').pathname); if (ruta.endsWith('/')) { ruta += 'index.html'; }
      const f = resolve(raiz, '.' + ruta); if (!f.startsWith(resolve(raiz))) { res.writeHead(403); res.end(); return; }
      const cuerpo = readFileSync(f); res.writeHead(200, { 'Content-Type': tipos[extname(f)] || 'text/plain', 'Cache-Control': 'no-store' }); res.end(cuerpo);
    } catch { res.writeHead(404); res.end(); }
  });
  return new Promise((r) => s.listen(0, '127.0.0.1', () => r(s)));
}
const fallos = [], externas = [];
const ok = (cond, que) => { if (!cond) { fallos.push(que); } };
let ws = null, ch = null, srv = null, id = 0, medida = null;
const pend = new Map();

async function main() {
  srv = await sirve(PUBLIC);
  const port = srv.address().port, origen = 'http://127.0.0.1:' + port, cdpPort = 9600 + (process.pid % 90);
  ch = launchChrome(cdpPort);
  let lista = null;
  for (let i = 0; i < 60 && !lista && !ch.failure(); i++) { await espera(250); try { lista = await (await fetch(`http://127.0.0.1:${cdpPort}/json`)).json(); } catch {} }
  if (!lista) { throw new Error(ch.diagnostic()); }
  ws = new WebSocket(lista.find((t) => t.type === 'page').webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.addEventListener('open', r); ws.addEventListener('error', () => j(new Error('WebSocket CDP'))); });
  ws.addEventListener('message', (m) => {
    const d = JSON.parse(m.data);
    if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); }
    if (d.method === 'Network.requestWillBeSent') { const u = d.params.request.url; if (/^https?:/.test(u) && new URL(u).origin !== origen) { externas.push(u); } }
    if (d.method === 'Runtime.exceptionThrown') {
      const x = d.params.exceptionDetails, f = (x.stackTrace?.callFrames || [])[0] || x;
      fallos.push('exception: ' + String(x.exception?.description || x.text).split('\n')[0].slice(0, 80) + ' @ ' + String(f.url || '').split('/').pop());
    }
  });
  const cmd = (method, params = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async (e) => (await cmd('Runtime.evaluate', { expression: e, awaitPromise: true, returnByValue: true })).result?.result?.value ?? null;
  await cmd('Runtime.enable'); await cmd('Page.enable'); await cmd('Network.enable');
  await cmd('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  await cmd('Page.navigate', { url: origen + '/' });
  for (let t = 0; t < 15000 && !(await ev("document.documentElement.classList.contains('con-burbujas')")); t += 250) { await espera(250); }
  medida = JSON.parse(await ev(`JSON.stringify((() => {
    const puertas = [...document.querySelectorAll('#doors .door')];
    const tinta = (c) => { const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 3; i < d.length; i += 4) { if (d[i] > 0) { n++; } } return n; };
    return { burbujas: document.documentElement.classList.contains('con-burbujas'), puertas: puertas.length,
      enlaces: puertas.map((a) => a.getAttribute('href')), titulos: puertas.map((a) => (a.querySelector('b') || {}).textContent),
      dibujos: puertas.map((a) => { const c = a.querySelector('canvas.door-art'); return c ? tinta(c) : 0; }),
      pie: (document.querySelector('.note') || {}).textContent, texto: document.body.innerText };
  })())`));
  ok(medida.burbujas && medida.puertas === 3, 'the three doors were not all drawn in bubble language');
  ok(JSON.stringify(medida.enlaces) === JSON.stringify(['/play/', '/face/', '/creation.html']), 'links changed: ' + medida.enlaces);
  ok(JSON.stringify(medida.titulos) === JSON.stringify(['Play theGame', 'Worlds', 'Creation studio']), 'titles changed or gone: ' + medida.titulos);
  ok(medida.dibujos.every((n) => n > 2000), 'a bubble is blank: ' + medida.dibujos);
  ok(medida.pie === 'One language until the MVP: English. The old translated addresses lead here.', 'footer changed');
  ok(!/\bundefined\b|\bNaN\b/.test(medida.texto), 'missing value shown on the landing');
  ok(externas.length === 0, 'external requests: ' + externas.slice(0, 3));
  if (CAPTURA) {
    const s = await cmd('Page.captureScreenshot', { format: 'png' });
    writeFileSync(join(CAPTURA, 'landing-doors.png'), Buffer.from(s.result.data, 'base64'));
  }
  console.log(JSON.stringify({ piece: 'P3-1d', receipt: 'MEDIDO', dibujos: medida.dibujos, enlaces: medida.enlaces, externas: externas.length, fallos }));
}

main().catch((e) => { fallos.push(String(e && e.message || e)); console.log(JSON.stringify({ piece: 'P3-1d', fallos })); })
  .finally(() => { try { ws && ws.close(); } catch {} ch && ch.close && ch.close(); srv && srv.close(); process.exitCode = fallos.length ? 1 : 0; });
