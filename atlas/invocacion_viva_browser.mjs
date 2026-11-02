// La invocación vive, en un navegador real: firmar una invocación en una visita deja el texto en #state y lanza la
// ráfaga; entrar en la cabaña pasa por el túnel hexagonal y luego abre el chat; con movimiento reducido no hay
// animación; cero peticiones externas. Uso: node atlas/invocacion_viva_browser.mjs [carpeta-captura]
import { createServer } from 'node:http';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, extname, join } from 'node:path';
import { launchChrome } from './chrome_launch.mjs';
import { fileURLToPath } from 'node:url';

const PUBLIC = fileURLToPath(new URL('../public/', import.meta.url));
const CAPTURA = process.argv[2] || null;
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
// P5a: with HITL_ON the state file is the test fixture (the tutorial cabin waits for a signature).
const HITL = readFileSync(new URL('./fixtures/hitl_estado.json', import.meta.url));
let HITL_ON = false;
function sirve(raiz) {
  const tipos = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };
  const s = createServer((req, res) => {
    try {
      let ruta = decodeURIComponent(new URL(req.url, 'http://local').pathname); if (ruta.endsWith('/')) { ruta += 'index.html'; }
      const f = resolve(raiz, '.' + ruta); if (!f.startsWith(resolve(raiz))) { res.writeHead(403); res.end(); return; }
      const cuerpo = HITL_ON && ruta === '/openworld/estado.json' ? HITL : readFileSync(f); res.writeHead(200, { 'Content-Type': tipos[extname(f)] || 'text/plain', 'Cache-Control': 'no-store' }); res.end(cuerpo);
    } catch { res.writeHead(404); res.end(); }
  });
  return new Promise((r) => s.listen(0, '127.0.0.1', () => r(s)));
}
const fallos = [], externas = [];
// W-5: a click on the cabin hex on the map (the page's own state, the page's own geometry), then the status line.
const CLIC_CABINA = "(async () => { const d = await (await fetch('/openworld/estado.json', { cache: 'no-store' })).json(); const est = AtlasOpenworldState.leer(d); const s = document.getElementById('surface'); const a = AtlasColoniaPagina.anchorOf(s, est.colonia, 0, est.looks || {}, est.seals || {}, 'cabin'); const r = s.getBoundingClientRect(); s.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: r.left + a.x * r.width / s.width, clientY: r.top + a.y * r.height / s.height })); await new Promise((x) => setTimeout(x, 300)); return document.querySelector('#joy [aria-live]').textContent; })()";
const ok = (cond, que) => { if (!cond) { fallos.push(que); } };
let ws = null, ch = null, srv = null, id = 0;
const pend = new Map();
const VISITA = `(async () => { const w = (ms) => new Promise((r) => setTimeout(r, ms)), $ = (i) => document.getElementById(i);
  for (let i = 0; i < 50 && !$('visitor-start') && !$('play-now'); i++) await w(100);
  ($('visitor-start') || $('play-now')).click(); for (let i = 0; i < 80 && !$('visitor-beacon'); i++) await w(100);
  $('visitor-beacon').click(); for (let i = 0; i < 80 && $('visitor-summon-tc1').disabled; i++) await w(100);
  $('visitor-summon-tc1').click(); for (let i = 0; i < 80 && !/Summoned/.test($('state').textContent); i++) await w(50);
  await w(250); const L = $('invocation-layer');
  return JSON.stringify({ state: $('state').textContent, burst: L && L.dataset.burst, frame: L && Number(L.dataset.frame || -1), hidden: L && L.getAttribute('aria-hidden') }); })()`;
const ENTRA = `(async () => { const w = (ms) => new Promise((r) => setTimeout(r, ms)), $ = (i) => document.getElementById(i);
  const d = await (await fetch('/openworld/estado.json', { cache: 'no-store' })).json(); const est = AtlasOpenworldState.leer(d);
  const s = $('surface'), a = AtlasColoniaPagina.anchorOf(s, est.colonia, 0, est.looks || {}, est.seals || {}, 'cabin'), r = s.getBoundingClientRect();
  const antes = document.querySelectorAll('#log li').length, L = () => $('invocation-layer');
  s.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: r.left + a.x * r.width / s.width, clientY: r.top + a.y * r.height / s.height }));
  await w(30); const corriendo = L() ? L().dataset.tunnel : null, chatDurante = document.querySelectorAll('#log li').length;
  for (let i = 0; i < 40 && document.querySelectorAll('#log li').length === antes; i++) await w(50);
  return JSON.stringify({ corriendo, chatDurante, antes, despues: document.querySelectorAll('#log li').length, fin: L() ? L().dataset.tunnel : null }); })()`;

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
    if (d.method === 'Runtime.exceptionThrown') { const x = d.params.exceptionDetails; fallos.push('exception: ' + String(x.exception?.description || x.text).split('\n')[0].slice(0, 100)); }
  });
  const cmd = (method, params = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async (e) => (await cmd('Runtime.evaluate', { expression: e, awaitPromise: true, returnByValue: true })).result?.result?.value ?? null;
  await cmd('Runtime.enable'); await cmd('Page.enable'); await cmd('Network.enable');
  await cmd('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  // 1 · movimiento normal: la ráfaga anima y el túnel corre antes del chat.
  await cmd('Page.navigate', { url: origen + '/openworld/' }); await espera(1800);
  const v = JSON.parse(await ev(VISITA) || '{}');
  // Captura a mitad de ráfaga con la hoja cerrada: solo se vuelve a dibujar el mismo recibo (render, nunca decide).
  if (CAPTURA) { await ev("document.getElementById('tab-map').click(); AtlasInvocacionViva.burst({ type: 'summon', tc: 'tc1', copper: 50, seq: 1, step: 0 })"); await espera(300); const g = await cmd('Page.captureScreenshot', { format: 'png' }); writeFileSync(join(CAPTURA, 'invocacion-390.png'), Buffer.from(g.result.data, 'base64')); }
  ok(/^Summoned · reef egg · 50 copper/.test(v.state || ''), 'signing a summon does not show the burst text in #state: ' + JSON.stringify(v));
  ok(v.burst === 'animated' && v.frame > 0 && v.hidden === 'true', 'the burst does not animate on the hidden layer: ' + JSON.stringify(v));
  await espera(1600);
  const e = JSON.parse(await ev(ENTRA) || '{}');
  ok(e.corriendo === 'running' && e.chatDurante === e.antes, 'entering the cabin does not play the worm tunnel first: ' + JSON.stringify(e));
  ok(e.despues > e.antes && e.fin === 'done', 'the building chat does not open after the tunnel: ' + JSON.stringify(e));
  // 2 · movimiento reducido: un anillo quieto, el texto igual, el chat al instante.
  await cmd('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  await cmd('Page.navigate', { url: origen + '/openworld/' }); await espera(1800);
  const q = JSON.parse(await ev(VISITA) || '{}');
  ok(/^Summoned · reef egg/.test(q.state || '') && q.burst === 'ring', 'reduced motion is not a static ring with text: ' + JSON.stringify(q));
  const eq = JSON.parse(await ev(ENTRA) || '{}');
  ok(eq.corriendo !== 'running' && eq.despues > eq.antes, 'reduced motion still plays the tunnel: ' + JSON.stringify(eq));
  ok(externas.length === 0, 'external requests: ' + externas.join(' '));
  console.log(JSON.stringify({ visita: v, entra: e, reducido: q, externas: externas.length, fallos }));
}

main().catch((e) => { fallos.push('harness: ' + e.message); })
  .finally(() => { try { ws && ws.close(); } catch {} ch && ch.close && ch.close(); srv && srv.close(); process.exitCode = fallos.length ? 1 : 0; });
