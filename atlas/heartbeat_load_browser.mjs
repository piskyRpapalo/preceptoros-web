// Latido visible (odd/tasks/latido-visible.md, 2026-11-03). Measured in production: the heartbeat reached the
// worker whole, and the map showed only the baked state.json because the live read waited behind a hidden button.
// Held shut here, in a real browser, with the worker answered in two ways:
// A · /api/world-state gives the two LIVE nodes measured in production → on load, WITHOUT a click, /openworld/ says
//     «Nodes online: 2» and names both nodes LIVE, and the basic terminal (/face/basic.html) reads the same heartbeat.
// B · the real worker with no publisher binding (honest 503 NO_DATA) → the page never claims «Nodes online: 0»;
//     it says NO_DATA with the worker's own cause.
// Uso: node atlas/heartbeat_load_browser.mjs
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { launchChrome } from './chrome_launch.mjs';
import { worldState } from '../worker/world_state.js';

const PUBLIC = fileURLToPath(new URL('../public/', import.meta.url));
// The body the aduana served on 2026-11-03 (380 B, cobertura MEDIDO 2 node_heartbeats).
const LATIDO = JSON.stringify({ esquema: 'preceptoros.openworld-estado/2', colonia: { nodes: [
  { id: 'primer-ancla', q: 0, r: 0, alive: true, seal: 'LIVE', since: '2026-11-03' },
  { id: 'onexstation', q: 1, r: 0, alive: true, seal: 'LIVE', since: '2026-11-03' }],
  buildings: [{ id: 'observatorio-primer-ancla', node: 'primer-ancla' }], units: [] },
  cobertura: { estado: 'MEDIDO', valor: 2, fuente: 'node_heartbeats' } });
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const tipos = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };
let modo = 'vivo', pedidos = 0;
function sirve(raiz) {
  const s = createServer(async (req, res) => {
    const ruta0 = new URL(req.url, 'http://local').pathname;
    if (ruta0 === '/api/world-state') {
      pedidos++;
      if (modo === 'vivo') { res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end(LATIDO); return; }
      const r = await worldState(new Request('http://local' + req.url, { method: req.method }), {});
      res.writeHead(r.status, { 'Content-Type': 'application/json' }); res.end(await r.text()); return;
    }
    try {
      let ruta = decodeURIComponent(ruta0); if (ruta.endsWith('/')) { ruta += 'index.html'; }
      const f = resolve(raiz, '.' + ruta); if (!f.startsWith(resolve(raiz))) { res.writeHead(403); res.end(); return; }
      const cuerpo = readFileSync(f); res.writeHead(200, { 'Content-Type': tipos[extname(f)] || 'text/plain', 'Cache-Control': 'no-store' }); res.end(cuerpo);
    } catch { res.writeHead(404); res.end(); }
  });
  return new Promise((r) => s.listen(0, '127.0.0.1', () => r(s)));
}
const fallos = [], excepciones = [];
const ok = (cond, que) => { if (!cond) { fallos.push(que); } };
let ws = null, ch = null, srv = null, id = 0;
const pend = new Map();

async function main() {
  srv = await sirve(PUBLIC);
  const origen = 'http://127.0.0.1:' + srv.address().port, cdpPort = 9600 + (process.pid % 90);
  ch = launchChrome(cdpPort);
  let lista = null;
  for (let i = 0; i < 60 && !lista && !ch.failure(); i++) { await espera(250); try { lista = await (await fetch(`http://127.0.0.1:${cdpPort}/json`)).json(); } catch {} }
  if (!lista) { throw new Error(ch.diagnostic()); }
  ws = new WebSocket(lista.find((t) => t.type === 'page').webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.addEventListener('open', r); ws.addEventListener('error', () => j(new Error('WebSocket CDP'))); });
  ws.addEventListener('message', (m) => {
    const d = JSON.parse(m.data);
    if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); }
    if (d.method === 'Runtime.exceptionThrown') { const x = d.params.exceptionDetails; excepciones.push(String(x.exception?.description || x.text).split('\n')[0].slice(0, 90)); }
  });
  const cmd = (method, params = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async (e) => (await cmd('Runtime.evaluate', { expression: e, awaitPromise: true, returnByValue: true })).result?.result?.value ?? null;
  await cmd('Runtime.enable'); await cmd('Page.enable');
  await cmd('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  // The text of a node, polled until it matches (or 4 s pass): no click anywhere.
  const lee = (sel, re) => ev(`(async () => { const t = () => (document.querySelector(${JSON.stringify(sel)}) || {}).textContent || ''; for (let i = 0; i < 40 && !${re}.test(t()); i++) { await new Promise((r) => setTimeout(r, 100)); } return t(); })()`);

  // A · the heartbeat answers: on load, no click.
  modo = 'vivo'; pedidos = 0;
  await cmd('Page.navigate', { url: origen + '/openworld/' }); await espera(800);
  const vivo = await lee('#state', '/Nodes online: 2/');
  ok(pedidos > 0, '/openworld/ did not read /api/world-state on load');
  ok(/Nodes online: 2\b/.test(vivo) && /primer-ancla LIVE/.test(vivo) && /onexstation LIVE/.test(vivo), '/openworld/ does not show the two LIVE nodes on load: ' + vivo);
  // Pieza 2 (odd/tasks/mapa-vivo.md): the map-alive layer loads on demand and says its seals, ground and buoy, no click.
  const mapa = await lee('#frases', '/State buoy/');
  ok(/seal LIVE · primer-ancla/.test(mapa) && /seal LIVE · onexstation/.test(mapa) && /ground of primer-ancla · awake/.test(mapa) && /State buoy · \S+ · .*Proof of Tick/.test(mapa),
    'the live map does not draw its seals, ground and buoy on load: ' + mapa.slice(0, 200));
  pedidos = 0;
  await cmd('Page.navigate', { url: origen + '/face/basic.html' }); await espera(800);
  const cara = await lee('#cause', '/2 LIVE/');
  ok(pedidos > 0 && /2 LIVE/.test(cara), 'the basic terminal does not read the same heartbeat: ' + cara);

  // B · the worker has no publisher: NO_DATA with its cause, never a «0» nobody measured.
  modo = 'sin-publicador';
  await cmd('Page.navigate', { url: origen + '/openworld/' }); await espera(800);
  const sin = await lee('#state', '/world_publisher_unavailable/');
  ok(!/Nodes online: 0\b/.test(sin) && /NO_DATA/.test(sin) && /world_publisher_unavailable/.test(sin), '/openworld/ without a publisher does not say NO_DATA with its cause: ' + sin);
  const sinMapa = await ev("(document.getElementById('frases') || {}).textContent || ''");
  ok(!/seal LIVE · (primer-ancla|onexstation)/.test(sinMapa) && !/ground of/.test(sinMapa), 'without a publisher the map still claims a live seal: ' + sinMapa.slice(0, 200));
  ok(excepciones.length === 0, 'exceptions: ' + excepciones.join(' | '));
  console.log(JSON.stringify({ piece: 'latido-visible', receipt: fallos.length ? 'ROJO' : 'VERDE', vivo: vivo.slice(0, 120), cara: cara.slice(0, 120), sin: sin.slice(0, 160), fallos }));
}
main().catch((e) => { fallos.push(String(e && e.message || e)); console.log(JSON.stringify({ piece: 'latido-visible', receipt: 'ROJO', fallos })); })
  .finally(() => { try { ws && ws.close(); } catch {} ch && ch.close && ch.close(); srv && srv.close(); process.exitCode = fallos.length ? 1 : 0; });
